// pages/dashboard/DashboardPurchasing.jsx
import {
  Building2,
  DollarSign,
  Download,
  FlaskConical,
  HandCoins,
  Package,
  ShoppingCart,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/card/Card";
import Chart from "../../components/ui/chart/Chart";
import { MetricGrid } from "../../components/ui/chart/MetricCard";
import { Highchart } from "../../components/ui/highchart";
import { useTheme } from "../../contexts/ThemeContext";
import {
  reportsPurchasingBreakdown,
  reportsPurchasingBreakdownSummary,
  reportsPurchasingProducts,
  reportsPurchasingSummary,
  reportsPurchasingSuppliers,
  reportsPurchasingTrend,
} from "../../services/reporting/report_purchasing_service";
import {
  formatCompactCurrency,
  formatDate,
  formatNumber,
} from "../../utils/helpers";
import useDateFilterStore from "../../stores/useDateFilterStore";
import {
  buildDatasetsFromData,
  hydrateDataForChart,
} from "../../utils/chartHelper";
import { useFilterService } from "../../contexts/FilterServiceContext";
import ProductFilter from "../../components/ui/filter/ProductFilter";
import SupplierFilter from "../../components/ui/filter/SupplierFilter";
import CategoryFilter from "../../components/ui/filter/CategoryFilter";
import Loading from "../../components/ui/loading/Loading";
import AccountParentFilter from "../../components/ui/filter/AccountParentFilter";
import {
  reportsReceivableTrend,
  reportsSalesClient,
  reportsSalesSummary,
  reportsSalesTrend,
} from "../../services/reporting/report_sales_service";
import { formatPeriod, formatWeeklyPeriod } from "../../utils/dateHelper";

export default function DashboardSales() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { colors } = useTheme();

  const dateRange = useDateFilterStore((state) => state.dateRange);

  // Granularity per chart
  const [trendGranularity, setTrendGranularity] = useState("monthly");
  const { filters, setFilter, registerFilters } = useFilterService();

  useEffect(() => {
    registerFilters([
      <CategoryFilter
        key="category-filter"
        value={filters.category ?? null}
        onChange={(val) => setFilter("category", val)}
      />,
      <AccountParentFilter
        key="account-parent-filter"
        value={filters.account_parent_ids || []}
        onChange={(v) => setFilter("account_parent_ids", v)}
      />,
      <ProductFilter
        key="product-filter"
        value={filters.product_ids || []}
        onChange={(v) => setFilter("product_ids", v)}
      />,
      <SupplierFilter
        key="supplier-filter"
        value={filters.supplier_ids || []}
        onChange={(v) => setFilter("supplier_ids", v)}
      />,
    ]);
  }, [registerFilters, setFilter, JSON.stringify(filters)]);

  const generateFilters = () => {
    return {
      product_ids: filters.product_ids?.length
        ? filters.product_ids
        : undefined,
      supplier_ids: filters.supplier_ids?.length
        ? filters.supplier_ids
        : undefined,
      category: filters.category,
      account_parent_ids: filters.account_parent_ids?.length
        ? filters.account_parent_ids
        : undefined,
    };
  };

  useEffect(() => {
    if (dateRange?.dateFrom && dateRange?.dateTo) {
      fetchPurchasingData();
    }
  }, [dateRange, JSON.stringify(filters)]);

  const fetchPurchasingData = async () => {
    try {
      setLoading(true);

      // Use dateRange from useDateFilterStore with fallback
      const params = {
        start_date: dateRange?.dateFrom,
        end_date: dateRange?.dateTo,
        granularity: trendGranularity,
        ...generateFilters(),
      };

      // Skip fetch if no date range yet
      if (!params.start_date || !params.end_date) {
        setLoading(false);
        return;
      }

      // Fetch summary, breakdown, and suppliers (no granularity needed)
      const [summary, clients] = await Promise.all([
        reportsSalesSummary(params),
        reportsSalesClient(params),
      ]);

      // Fetch trend and products with their specific granularity
      const [trend, paymentVsReceivableTrend] = await Promise.all([
        reportsSalesTrend({ ...params, granularity: trendGranularity }),
        reportsReceivableTrend({ ...params, granularity: trendGranularity }),
      ]);

      const transformedData = transformApiData(
        summary.data,
        clients.data,
        trend.data,
        paymentVsReceivableTrend.data
      );

      setSalesData(transformedData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      //   setPurchasingData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trend data when granularity changes
  const fetchTrendData = async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) return;

    try {
      const params = {
        start_date: dateRange.dateFrom,
        end_date: dateRange.dateTo,
        granularity: trendGranularity,
        ...generateFilters(),
      };

      const trend = await reportsPurchasingTrend(params);

      //   setPurchasingData((prev) => ({
      //     ...prev,
      //     trendData: transformTrendData(trend.data),
      //   }));
    } catch (error) {
      console.error("Error fetching trend data:", error);
    }
  };

  useEffect(() => {
    // if (purchasingData) {
    //   fetchTrendData();
    // }
  }, [trendGranularity]);

  const transformTrendData = (trend) => {
    return (trend || []).map((item) => {
      let displayPeriod = item.period;

      if (item.week_start && item.week_end) {
        displayPeriod = formatWeeklyPeriod(item.week_start, item.week_end);
      } else {
        displayPeriod = formatPeriod(item.period);
      }

      // return {
      //   key: displayPeriod,
      //   ...item,
      // };
      return {
        key: displayPeriod,
        payments: item.total_payment ?? 0,
        receivables: item.total_receivable ?? 0,
      };
    });
  };

  const transformToBarData = (data) => {
    return data.map((d) => ({
      key: d.key,
      value: d.value,
    }));
  };

  const pivotClientByPeriod = (data = []) =>
    data.map((row) => {
      const result = {
        period: row.period,
        week_start: row.week_start,
        week_end: row.week_end,
      };

      let computedTotal = 0;

      row.clients.forEach((client) => {
        result[client.name] = client.total;
        computedTotal += client.total;
      });

      result.total = computedTotal;

      return result;
    });

  const transformApiData = (summary, clients, sales, paymentVsReceivable) => {
    const metrics = {
      total_sales: {
        value: summary.total_sales || 0,
        trend: 0,
      },
      total_returns: {
        value: summary.total_returns || 0,
        trend: 0,
      },
      total_receivables: {
        value: summary.total_receivable || 0,
        trend: 0,
      },
      total_payments: {
        value: summary.total_payments || 0,
        trend: 0,
      },
    };

    const trendData = transformTrendData(pivotClientByPeriod(sales));
    const paymentVsReceivableTrend = transformTrendData(paymentVsReceivable);

    console.log(trendData);

    const clientData = (clients || []).map((item) => ({
      key: item.name.charAt(0).toUpperCase() + item.name.slice(1),
      value: item.value || 0,
      drilldown: false,
    }));

    console;

    return {
      metrics,
      trendData,
      paymentVsReceivableTrend,
      clientData,
    };
  };

  const handleExport = async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) {
      alert("Please select a date range first");
      return;
    }

    try {
      setExporting(true);
      const response = await reportsPurchasingBreakdown({
        start_date: dateRange.dateFrom,
        end_date: dateRange.dateTo,
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `purchasing_breakdown_${dateRange.dateFrom}_${dateRange.dateTo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  if (!salesData) {
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

  const { metrics, trendData, paymentVsReceivableTrend, clientData } =
    salesData;

  return (
    <>
      {loading && <Loading fullscreen={true} />}

      <div className="max-w-full space-y-4 p-0.5 md:p-1">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
              Purchasing Overview
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 md:text-sm">
              Monitor pembelian, supplier, dan trend purchasing
            </p>
            {/* Show active filter info */}
            {dateRange.startDate && dateRange.endDate && (
              <p className="mt-1 text-xs text-blue-600">
                📅 Filtered: {formatDate(dateRange.startDate)} to{" "}
                {formatDate(dateRange.endDate)}
              </p>
            )}
          </div>
          <div>
            <Button
              icon={Download}
              label={exporting ? "Exporting..." : "Export Data"}
              variant="primary"
              onClick={handleExport}
              disabled={exporting}
            />
          </div>
        </div>

        {/* KPI Cards */}
        <MetricGrid>
          <Chart.Metric
            title="Total Sales"
            value={formatCompactCurrency(metrics.total_sales.value)}
            // trend={metrics.total_purchases.trend}
            icon={ShoppingCart}
            color="primary"
          />
          <Chart.Metric
            title="Total Perbaikan"
            value={formatCompactCurrency(metrics.total_returns.value)}
            // trend={metrics.total_chemical.trend}
            icon={Wrench}
            color="warning"
          />
          <Chart.Metric
            title="Total Payment"
            value={formatCompactCurrency(metrics.total_payments.value)}
            // trend={metrics.total_sparepart.trend}
            icon={DollarSign}
            color="success"
          />
          <Chart.Metric
            title="Total Receivables"
            value={formatCompactCurrency(metrics.total_receivables.value)}
            // trend={metrics.total_sparepart.trend}
            icon={HandCoins}
            color="error"
          />
        </MetricGrid>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="w-full h-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                    Sales Trend
                  </h3>
                  <p className="text-xs text-gray-600">Trend penjualan</p>
                </div>
                <select
                  value={trendGranularity}
                  onChange={(e) => setTrendGranularity(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg"
                >
                  <option value="daily">Perhari</option>
                  <option value="weekly">Perminggu</option>
                  <option value="monthly">Perbulan</option>
                  <option value="yearly">Pertahun</option>
                </select>
              </div>
              <Highchart.HighchartsBar
                initialData={hydrateDataForChart(trendData, [
                  "period",
                  "week_start",
                  "week_end",
                ])}
                title=""
                subtitle=""
                datasets={buildDatasetsFromData(trendData, [
                  "period",
                  "week_start",
                  "week_end",
                ])}
                onFetchData={() => trendData}
                showSummary={false}
              />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full ">
              <Highchart.HighchartsDonut
                data={clientData}
                title="Breakdown Client"
                className="w-full h-full"
                showSummary={false}
                valueFormatter={formatCompactCurrency}
              />
            </Card>
          </div>
        </div>

        {/* Top Suppliers & Top Purchases */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
          {/* Top 5 Suppliers */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Top 5 Clients
                </h3>
                <p className="text-xs text-gray-600">
                  Client dengan total pembelian tertinggi
                </p>
              </div>
            </div>

            <Highchart.HighchartsBar
              initialData={transformToBarData(clientData)}
              title=""
              subtitle=""
              datasets={[
                { key: "value", label: "Total Purchases", color: "primary" },
              ]}
              periods={[]}
              showSummary={false}
            />
          </Card>

          {/* <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Payments Vs Receivables
                </h3>
                <p className="text-xs text-gray-600">
                  Trend pembayaran vs piutang
                </p>
              </div>
            </div>

            <Highchart.HighchartsLine
              initialData={transformToBarData(paymentVsReceivableTrend)}
              title=""
              subtitle=""
              datasets={[
                { key: "value", label: "Total Purchases", color: "primary" },
              ]}
              periods={[]}
              showSummary={false}
            />
          </Card> */}

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Payments Vs Receivables
                </h3>
                <p className="text-xs text-gray-600">
                  Trend pembayaran vs piutang
                </p>
              </div>
            </div>

            <Highchart.HighchartsLine
              initialData={paymentVsReceivableTrend}
              title=""
              subtitle=""
              datasets={[
                {
                  key: "total_payment",
                  label: "Total Payment",
                  color: "success",
                },
                {
                  key: "total_receivable",
                  label: "Total Receivable",
                  color: "error",
                },
              ]}
              periods={[]}
              showSummary={true}
              yAxisLabel="Nilai (Rp)"
            />
          </Card>
        </div>
      </div>
    </>
  );
}
