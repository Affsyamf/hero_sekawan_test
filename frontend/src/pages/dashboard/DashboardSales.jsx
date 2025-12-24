import {
  Building2,
  DollarSign,
  Download,
  HandCoins,
  ShoppingCart,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/card/Card";
import Chart from "../../components/ui/chart/Chart";
import { MetricGrid } from "../../components/ui/chart/MetricCard";
import ClientFilter from "../../components/ui/filter/ClientFilter";
import ColorKitchenFilter from "../../components/ui/filter/ColorKitchenFilter";
import DesignFilter from "../../components/ui/filter/DesignFilter";
import SaleFilter from "../../components/ui/filter/SaleFilter";
import { Highchart } from "../../components/ui/highchart";
import { useFilterService } from "../../contexts/FilterServiceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { reportsPurchasingBreakdown } from "../../services/reporting/report_purchasing_service";
import {
  reportsReceivableTrend,
  reportsSalesClient,
  reportsSalesSummary,
  reportsSalesTrend,
} from "../../services/reporting/report_sales_service";
import useDateFilterStore from "../../stores/useDateFilterStore";
import {
  buildDatasetsFromData,
  hydrateDataForChart,
} from "../../utils/chartHelper";
import { formatPeriod, formatWeeklyPeriod } from "../../utils/dateHelper";
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatDate,
} from "../../utils/helpers";

export default function DashboardSales() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();

  const dateRange = useDateFilterStore((state) => state.dateRange);

  // Granularity per chart
  const [trendGranularity, setTrendGranularity] = useState("monthly");
  const [paymentGranularity, setPaymentGranularity] = useState("monthly");

  const { filters, setFilter, registerFilters } = useFilterService();

  // Trend Data states
  const [trendData, setTrendData] = useState([]);
  const [paymentVsReceivableTrend, setPaymentVsReceivableTrend] = useState([]);

  // ✅ Register filters with proper dependencies
  useEffect(() => {
    registerFilters([
      <ClientFilter
        key="client-filter"
        value={filters.client_ids || []}
        onChange={(v) => setFilter("client_ids", v)}
      />,
      <DesignFilter
        key="design-filter"
        value={filters.design_ids || []}
        onChange={(v) => setFilter("design_ids", v)}
      />,
      <ColorKitchenFilter
        key="ck-filter"
        value={filters.ck_ids || []}
        onChange={(v) => setFilter("ck_ids", v)}
      />,
      <SaleFilter
        key="sale-filter"
        value={filters.sale_ids || []}
        onChange={(v) => setFilter("sale_ids", v)}
      />,
    ]);
  }, [registerFilters, setFilter, JSON.stringify(filters)]);

  // ✅ Helper function to generate filters (sama seperti di ColorKitchen)
  const generateFilters = () => {
    return {
      client_ids: filters.client_ids?.length ? filters.client_ids : undefined,
      design_ids: filters.design_ids?.length ? filters.design_ids : undefined,
      ck_ids: filters.ck_ids?.length ? filters.ck_ids : undefined,
      sale_ids: filters.sale_ids?.length ? filters.sale_ids : undefined,
    };
  };

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

  const transformPaymentReceivableData = useCallback((trend) => {
    return (trend || []).map((item) => {
      let displayPeriod = item.period;

      if (item.week_start && item.week_end) {
        displayPeriod = formatWeeklyPeriod(item.week_start, item.week_end);
      } else {
        displayPeriod = formatPeriod(item.period);
      }

      return {
        key: displayPeriod,
        total_payment: item.total_payment ?? 0,
        total_receivable: item.total_receivable ?? 0,
      };
    });
  }, []);

  const pivotClientByPeriod = useCallback((data = []) => {
    return data.map((row) => {
      const result = {
        period: row.period,
        week_start: row.week_start,
        week_end: row.week_end,
      };

      let computedTotal = 0;

      row.clients?.forEach((client) => {
        result[client.name] = client.total;
        computedTotal += client.total;
      });

      result.total = computedTotal;

      return result;
    });
  }, []);

  // ✅ 1. Fetch Summary and Client Data - dengan dependency yang benar
  const fetchSalesData = async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const params = {
        start_date: dateRange.dateFrom,
        end_date: dateRange.dateTo,
        ...generateFilters(),
      };

      const [summary, clients] = await Promise.all([
        reportsSalesSummary(params),
        reportsSalesClient(params),
      ]);

      const metrics = {
        total_sales: {
          value: summary.data.total_sales || 0,
          trend: 0,
        },
        total_returns: {
          value: summary.data.total_returns || 0,
          trend: 0,
        },
        total_receivables: {
          value: summary.data.total_receivable || 0,
          trend: 0,
        },
        total_payments: {
          value: summary.data.total_payments || 0,
          trend: 0,
        },
      };

      const clientData = (clients.data || []).map((item) => ({
        key: item.name.charAt(0).toUpperCase() + item.name.slice(1),
        value: item.value || 0,
        drilldown: false,
      }));

      setSalesData({ metrics, clientData });
    } catch (error) {
      console.error("Error fetching sales data:", error);
      setSalesData(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 2. Fetch Sales Trend Data
  const fetchSalesTrend = async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) return;

    try {
      const params = {
        start_date: dateRange.dateFrom,
        end_date: dateRange.dateTo,
        ...generateFilters(),
        granularity: trendGranularity,
      };

      const trend = await reportsSalesTrend(params);
      setTrendData(transformTrendData(pivotClientByPeriod(trend.data)));
    } catch (error) {
      console.error("Error fetching sales trend data:", error);
    }
  };

  // ✅ 3. Fetch Payment vs Receivable Trend
  const fetchPaymentReceivableTrend = async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) return;

    try {
      const params = {
        start_date: dateRange.dateFrom,
        end_date: dateRange.dateTo,
        ...generateFilters(),
        granularity: paymentGranularity,
      };

      const trend = await reportsReceivableTrend(params);
      setPaymentVsReceivableTrend(transformPaymentReceivableData(trend.data));
    } catch (error) {
      console.error("Error fetching payment receivable trend:", error);
    }
  };

  // ✅ Effect hooks dengan dependency yang benar (sama seperti ColorKitchen)
  useEffect(() => {
    if (dateRange?.dateFrom && dateRange?.dateTo) {
      fetchSalesData();
    }
  }, [dateRange, JSON.stringify(filters)]);

  useEffect(() => {
    if (dateRange?.dateFrom && dateRange?.dateTo) {
      fetchSalesTrend();
    }
  }, [dateRange, trendGranularity, JSON.stringify(filters)]);

  useEffect(() => {
    if (dateRange?.dateFrom && dateRange?.dateTo) {
      fetchPaymentReceivableTrend();
    }
  }, [dateRange, paymentGranularity, JSON.stringify(filters)]);

  const transformToBarData = (data) => {
    return data.map((d) => ({
      key: d.key,
      value: d.value,
    }));
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
        ...generateFilters(),
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales_report_${dateRange.dateFrom}_${dateRange.dateTo}.xlsx`;
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

  if (loading || !salesData) {
    if (!loading && !salesData) {
      return (
        <div className="flex items-center justify-center h-screen">
          <p className="mt-4 text-gray-600">Failed to load sales data.</p>
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

  const { metrics, clientData } = salesData;

  return (
    <>
      <div className="max-w-full space-y-4 p-0.5 md:p-1">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
              Sales Overview
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 md:text-sm">
              Monitor penjualan, client, dan trend sales
            </p>
            {dateRange.dateFrom && dateRange.dateTo && (
              <p className="mt-1 text-xs text-blue-600">
                📅 Filtered: {formatDate(dateRange.dateFrom)} to{" "}
                {formatDate(dateRange.dateTo)}
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
            icon={ShoppingCart}
            color="primary"
          />
          <Chart.Metric
            title="Total Return"
            value={formatCompactCurrency(metrics.total_returns.value)}
            icon={Wrench}
            color="warning"
          />
          <Chart.Metric
            title="Total Payment"
            value={formatCompactCurrency(metrics.total_payments.value)}
            icon={DollarSign}
            color="success"
          />
          <Chart.Metric
            title="Total Receivables"
            value={formatCompactCurrency(metrics.total_receivables.value)}
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
                  "key",
                ])}
                title=""
                subtitle=""
                datasets={buildDatasetsFromData(trendData, [
                  "period",
                  "week_start",
                  "week_end",
                  "key",
                ])}
                onFetchData={() => trendData}
                showSummary={false}
                valueFormatter={
                  !filters.unit ? formatCompactCurrency : formatCompactNumber
                }
              />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full">
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

        {/* Top Clients & Payment vs Receivables */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
          {/* Top 5 Clients */}
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
                  Client dengan total penjualan tertinggi
                </p>
              </div>
            </div>

            <Highchart.HighchartsBar
              initialData={transformToBarData(clientData)}
              title=""
              subtitle=""
              datasets={[
                { key: "value", label: "Total Sales", color: "primary" },
              ]}
              periods={[]}
              showSummary={false}
              valueFormatter={
                !filters.unit ? formatCompactCurrency : formatCompactNumber
              }
            />
          </Card>

          {/* Payment vs Receivables */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
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
              <select
                value={paymentGranularity}
                onChange={(e) => setPaymentGranularity(e.target.value)}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg"
              >
                <option value="daily">Perhari</option>
                <option value="weekly">Perminggu</option>
                <option value="monthly">Perbulan</option>
                <option value="yearly">Pertahun</option>
              </select>
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
              showSummary={false}
              yAxisLabel="Nilai (Rp)"
              valueFormatter={
                !filters.unit ? formatCompactCurrency : formatCompactNumber
              }
            />
          </Card>
        </div>
      </div>
    </>
  );
}