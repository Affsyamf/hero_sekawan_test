import { useTheme } from "../../contexts/ThemeContext";
import Card from "../../components/ui/card/Card";
import Button from "../../components/ui/button/Button";
import Chart from "../../components/ui/chart/Chart";
import { Highchart } from "../../components/ui/highchart";
import {
  DollarSign,
  Download,
  Palette,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { getDashboardData } from "../../services/dashboard_service";
import { formatCompactCurrency } from "../../utils/helpers";
import useDateFilterStore from "../../stores/useDateFilterStore";
import Loading from "../../components/ui/loading/Loading";
import {
  buildDatasetsFromData,
  hydrateDataForChart,
} from "../../utils/chartHelper";
import { reportsPurchasingTrend } from "../../services/report_purchasing_service";
import { formatPeriod, formatWeeklyPeriod } from "../../utils/dateHelper";
import { reportsColorKitchenTrend } from "../../services/report_color_kitchen_service";

export default function OverviewNew() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();

  // Granularity states
  const [purchasingTrendGranularity, setPurchasingTrendGranularity] =
    useState("monthly");
  const [ckTrendGranularity, setCkTrendGranularity] = useState("monthly");
  const [costTrendGranularity, setCostTrendGranularity] = useState("monthly");

  // Trend Data states
  const [purchasingTrendData, setPurchasingTrendData] = useState([]);
  const [ckTrendData, setCkTrendData] = useState([]);

  const dateRange = useDateFilterStore((state) => state.dateRange);

  // Helper function
  const transformTrendData = useCallback((trend) => {
    return (trend || []).map((item) => {
      let displayPeriod = item.period;

      if (item.week_start && item.week_end) {
        displayPeriod = formatWeeklyPeriod(item.week_start, item.week_end);
      } else {
        displayPeriod = formatPeriod(item.period);
      }

      return {
        key: displayPeriod,
        ...item,
      };
    });
  }, []);

  // 1. Fetch Dashboard Data (Metrics, Cost Trend, Stock Flow)
  const fetchDashboardData = useCallback(async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) {
      setDashboardData(null);
      return;
    }

    try {
      // Show loading indicator only for the Dashboard metrics/main data
      // For trend updates, we rely on the chart's internal loading state
      if (costTrendGranularity === "monthly") setLoading(true); // Only show full screen loading on initial/major load

      const params = {
        start_date: dateRange.dateFrom,
        end_date: dateRange.dateTo,
        granularity: costTrendGranularity,
      };

      const response = await getDashboardData(params);
      setDashboardData({ ...response.data });
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange, costTrendGranularity]);

  // 2. Fetch Purchasing Trend Data
  const fetchPurchasingTrendData = useCallback(async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) return;

    try {
      const params = {
        start_date: dateRange.dateFrom,
        end_date: dateRange.dateTo,
        granularity: purchasingTrendGranularity,
      };

      const trend = await reportsPurchasingTrend(params);
      setPurchasingTrendData(transformTrendData(trend.data));
    } catch (error) {
      console.error("Error fetching purchasing trend data:", error);
    }
  }, [dateRange, purchasingTrendGranularity, transformTrendData]);

  // 3. Fetch Color Kitchen (CK) Trend Data
  const fetchCkTrend = useCallback(async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) return;

    try {
      const params = {
        start_date: dateRange.dateFrom,
        end_date: dateRange.dateTo,
        granularity: ckTrendGranularity,
      };

      const trend = await reportsColorKitchenTrend(params);
      setCkTrendData(transformTrendData(trend.data));
    } catch (error) {
      console.error("Error fetching CK trend data:", error);
    }
  }, [dateRange, ckTrendGranularity, transformTrendData]);

  // --- EFFECT HOOKS FOR ISOLATED FETCHING ---

  // 1. Dashboard data fetcher (runs on dateRange or cost granularity change)
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Dependency is the memoized fetchDashboardData function

  // 2. Purchasing trend data fetcher (runs on dateRange or purchasing granularity change)
  useEffect(() => {
    fetchPurchasingTrendData();
  }, [fetchPurchasingTrendData]); // Dependency is the memoized fetchPurchasingTrendData function

  // 3. CK trend data fetcher (runs on dateRange or CK granularity change)
  useEffect(() => {
    fetchCkTrend();
  }, [fetchCkTrend]); // Dependency is the memoized fetchCkTrend function

  // --- End of Effect Hooks ---

  const handleExport = async () => {
    try {
      setExporting(true);
      alert("Export belum diimplementasi");
    } finally {
      setExporting(false);
    }
  };

  if (loading || !dashboardData) {
    if (!loading && !dashboardData) {
      return (
        <div className="flex items-center justify-center h-screen">
          <p className="mt-4 text-gray-600">Failed to load dashboard data.</p>
        </div>
      );
    }

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
            title="Avg Cost per Roll"
            value={formatCompactCurrency(metrics.avg_cost_per_roll.value)}
            // trend={formatTrend(metrics.avg_cost_per_roll.trend)}
            icon={Palette}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <Card className="w-full h-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                    Trend Purchasing
                  </h3>
                  <p className="text-xs text-gray-600">Trend pembelian</p>
                </div>
                <select
                  value={purchasingTrendGranularity}
                  onChange={(e) =>
                    setPurchasingTrendGranularity(e.target.value)
                  }
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg"
                >
                  <option value="daily">Perhari</option>
                  <option value="weekly">Perminggu</option>
                  <option value="monthly">Perbulan</option>
                  <option value="yearly">Pertahun</option>
                </select>
              </div>
              <Highchart.HighchartsBar
                initialData={hydrateDataForChart(purchasingTrendData, [
                  "period",
                  "week_start",
                  "week_end",
                ])}
                title=""
                subtitle=""
                datasets={buildDatasetsFromData(purchasingTrendData, [
                  "period",
                  "week_start",
                  "week_end",
                ])}
                onFetchData={() => purchasingTrendData}
                showSummary={false}
              />
            </Card>
          </div>
        </div>

        {/* Ck Charts Row */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <Card className="w-full h-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                    Chemical Usage Trend
                  </h3>
                  <p className="text-xs text-gray-600">
                    Trend penggunaan dyes dan auxiliaries
                  </p>
                </div>
                <select
                  value={ckTrendGranularity}
                  onChange={(e) => setCkTrendGranularity(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg"
                >
                  <option value="daily">Perhari</option>
                  <option value="weekly">Perminggu</option>
                  <option value="monthly">Perbulan</option>
                  <option value="yearly">Pertahun</option>
                </select>
              </div>
              <Highchart.HighchartsBar
                initialData={ckTrendData}
                title=""
                subtitle=""
                datasets={[
                  {
                    key: "dyes",
                    label: "Dyes",
                    color: "primary",
                    type: "column",
                    stacked: true,
                  },
                  {
                    key: "auxiliaries",
                    label: "Auxiliaries",
                    color: "warning",
                    type: "column",
                    stacked: true,
                  },
                  {
                    key: "total",
                    label: "Total",
                    color: "neutral",
                    type: "spline",
                  },
                ]}
                onFetchData={() => ckTrendData}
                showSummary={false}
              />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
