import { useTheme } from "../../contexts/ThemeContext";
import Card from "../../components/ui/card/Card";
import Button from "../../components/ui/button/Button";
import Chart from "../../components/ui/chart/Chart";
import HighchartsBar from "../../components/ui/highchart/HighchartsBar";
import HighchartsLine from "../../components/ui/highchart/HighchartsLine";
import {
  DollarSign,
  Download,
  Droplets,
  Palette,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboardData } from "../../services/dashboard_service";
import {
  formatNumber,
  formatCompactCurrency,
  formatDate,
} from "../../utils/helpers";
import useDateFilterStore from "../../stores/useDateFilterStore";
import Loading from "../../components/ui/loading/Loading";

export default function OverviewNew() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ Gunakan useDateFilterStore - sama seperti di Purchasing page
  const dateRange = useDateFilterStore((state) => state.dateRange);

  // ✅ Granularity state untuk Cost Trend
  const [costTrendGranularity, setCostTrendGranularity] = useState("monthly");

  // ✅ Trigger refresh when dateRange changes - sama seperti di Purchasing page
  useEffect(() => {
    console.log("🔍 DateRange changed:", dateRange);
    setRefreshKey((prev) => prev + 1);
  }, [dateRange]);

  // ✅ Fetch data ketika refreshKey atau granularity berubah
  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey, costTrendGranularity]);

  const fetchDashboardData = async () => {
    // Validasi dateRange sebelum fetch
    if (!dateRange?.dateFrom || !dateRange?.dateTo) {
      console.log("⚠️ DateRange not valid, skipping fetch");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const params = {
        start_date: dateRange.dateFrom,
        end_date: dateRange.dateTo,
        granularity: costTrendGranularity,
      };

      const response = await getDashboardData(params);

      const stock_flow = response.data.stock_flow.map((item) => ({
        ...item,
        key: item.month,
      }));

      const cost_trend = response.data.cost_trend.map((item) => ({
        ...item,
        key: item.month,
      }));

      const res = {
        ...response.data,
        stock_flow: stock_flow,
        cost_trend: cost_trend,
      };

      setDashboardData(res);
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      alert("Export belum diimplementasi");
    } finally {
      setExporting(false);
    }
  };

  const formatTrend = (trend) => {
    const sign = trend > 0 ? "+" : "";
    return `${sign}${trend}%`;
  };

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
          <p className="mt-2 text-xs text-gray-500">
            Date: {dateRange?.dateFrom} to {dateRange?.dateTo}
          </p>
        </div>
      </div>
    );
  }

  const { metrics, cost_trend, stock_flow, most_used_dye, most_used_aux } =
    dashboardData;

  return (
    <>
      {loading && <Loading fullscreen={true} />}

      <div className="max-w-full space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Dashboard Produksi
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview Stock, Cost, dan Usage Produksi Kain Printing
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              icon={Download}
              label={exporting ? "Exporting..." : "Export Data"}
              variant="primary"
              onClick={handleExport}
              disabled={exporting}
            />
          </div>
        </div>

        {/* ✅ Display active filter info - sama seperti Purchasing page */}
        {dateRange && (
          <div className="p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">📅 Active Filter:</span>{" "}
              {dateRange.mode === "ytd" && `YTD ${new Date().getFullYear()}`}
              {dateRange.mode === "year" && `Year ${dateRange.year}`}
              {dateRange.mode === "month-year" && (
                <>
                  {new Date(
                    dateRange.year,
                    dateRange.month - 1
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </>
              )}
              {(dateRange.mode === "days" || !dateRange.mode) && (
                <>
                  {formatDate(dateRange.dateFrom)} to{" "}
                  {formatDate(dateRange.dateTo)}
                  {dateRange.days !== undefined && (
                    <span className="ml-2 text-xs">
                      (
                      {dateRange.days === 0
                        ? "Today"
                        : `Last ${dateRange.days} days`}
                      )
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        )}

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Chart.Metric
            title="Total Purchasing"
            value={formatCompactCurrency(metrics.total_purchasing.value)}
            // trend={formatTrend(metrics.total_purchasing.trend)}
            icon={ShoppingCart}
          />
          <Chart.Metric
            title="Total Stock Terpakai"
            value={formatCompactCurrency(metrics.total_stock_terpakai.value)}
            // trend={formatTrend(metrics.total_stock_terpakai.trend)}
            icon={TrendingDown}
          />
          <Chart.Metric
            title="Total Cost Produksi"
            value={formatCompactCurrency(metrics.total_cost_produksi.value)}
            // trend={formatTrend(metrics.total_cost_produksi.trend)}
            icon={DollarSign}
          />
          <Chart.Metric
            title="Avg Cost per Job"
            value={formatCompactCurrency(metrics.avg_cost_per_job.value)}
            // trend={formatTrend(metrics.avg_cost_per_job.trend)}
            icon={Palette}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Stock Flow Chart */}
          <Card className="w-full h-full">
            <HighchartsBar
              initialData={stock_flow}
              title="Trend Stock Masuk vs Terpakai"
              subtitle="Perbandingan purchasing dan usage di Color Kitchen"
              datasets={[
                {
                  key: "stockMasuk",
                  label: "Stock Masuk (Purchasing)",
                  color: "success",
                },
                {
                  key: "stockTerpakai",
                  label: "Stock Terpakai (Stock Movement)",
                  color: "primary",
                },
              ]}
              onFetchData={() => stock_flow}
              showSummary={true}
            />
          </Card>

          {/* Cost Produksi Trend */}
          <Card className="w-full h-full">
            <div className="flex items-center justify-between px-4 pt-4 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Trend Cost Produksi (Dye + Aux)
                </h3>
                <p className="text-xs text-gray-600">
                  Total biaya produksi per periode
                </p>
              </div>
            </div>
            <HighchartsLine
              initialData={cost_trend}
              title=""
              subtitle=""
              datasets={[
                {
                  key: "total_cost",
                  label: "Cost Produksi",
                  color: "primary",
                },
              ]}
              onFetchData={() => cost_trend}
              showSummary={true}
              yAxisLabel="Cost (Rp)"
            />
          </Card>
        </div>
      </div>
    </>
  );
}
