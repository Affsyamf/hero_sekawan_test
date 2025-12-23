// pages/dashboard/DashboardPurchasing.jsx
import {
  Building2,
  Download,
  FlaskConical,
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
  formatCompactNumber,
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
import { formatPeriod, formatWeeklyPeriod } from "../../utils/dateHelper";
import UnitFilter from "../../components/ui/filter/UnitFilter";

export default function DashboardPurchasing() {
  const [purchasingData, setPurchasingData] = useState(null);
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
      <UnitFilter
        key="unit-filter"
        value={filters.unit ?? null}
        onChange={(val) => setFilter("unit", val)}
        disabled={!filters.category || filters?.category === "both"}
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
    // if category is null, reset unit
    if (
      (!filters.category || filters?.category === "both") &&
      filters.unit !== null
    ) {
      setFilter("unit", null);
    }
  }, [filters.category]);

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
      const [summary, breakdown, suppliers] = await Promise.all([
        reportsPurchasingSummary(params),
        reportsPurchasingBreakdownSummary(params),
        reportsPurchasingSuppliers(params),
      ]);

      // Fetch trend and products with their specific granularity
      const [trend, products] = await Promise.all([
        reportsPurchasingTrend({ ...params, granularity: trendGranularity }),
        reportsPurchasingProducts({
          ...params,
        }),
      ]);

      const transformedData = transformApiData(
        summary.data,
        trend.data,
        breakdown.data,
        suppliers.data,
        products.data
      );

      setPurchasingData(transformedData);
    } catch (error) {
      console.error("Error fetching purchasing data:", error);
      setPurchasingData(null);
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

      setPurchasingData((prev) => ({
        ...prev,
        trendData: transformTrendData(trend.data),
      }));
    } catch (error) {
      console.error("Error fetching trend data:", error);
    }
  };

  useEffect(() => {
    if (purchasingData) {
      fetchTrendData();
    }
  }, [trendGranularity]);

  const transformTrendData = (trend) => {
    let trendData = null;

    if (!filters.unit) {
      trendData = trend.map((x) => {
        const ret = {
          period: x.period,
          week_start: x.week_start,
          week_end: x.week_end,
          total: x.total_value,
        };

        if ("Batubara" in x) ret["Batubara"] = x?.Batubara?.value ?? 0;
        if ("Chemical" in x) ret["Chemical"] = x?.Chemical?.value ?? 0;
        if ("Other" in x) ret["Other"] = x?.Other?.value ?? 0;
        if ("Sparepart" in x) ret["Sparepart"] = x?.Sparepart?.value ?? 0;

        return ret;
      });
    } else {
      trendData = trend.map((x) => {
        const ret = {
          period: x.period,
          week_start: x.week_start,
          week_end: x.week_end,
          total: x.total_qty,
        };

        if ("Batubara" in x) ret["Batubara"] = x?.Batubara?.qty ?? 0;
        if ("Chemical" in x) ret["Chemical"] = x?.Chemical?.qty ?? 0;
        if ("Other" in x) ret["Other"] = x?.Other?.qty ?? 0;
        if ("Sparepart" in x) ret["Sparepart"] = x?.Sparepart?.qty ?? 0;

        return ret;
      });
    }

    return (trendData || []).map((item) => {
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
  };

  const transformProductsData = (products) => {
    const mostPurchased = (products?.most_purchased || []).slice(0, 5);
    const maxValue = Math.max(...mostPurchased.map((p) => p.total_qty), 1);

    return mostPurchased.map((item) => ({
      label: item.product,
      value: item.total_qty || 0,
      unit: "unit",
      maxValue: maxValue,
      total_value: item.total_value || 0,
      avg_cost: item.avg_cost || 0,
    }));
  };

  const transformSuppliersToBarData = (suppliers) => {
    return suppliers.map((supplier) => ({
      key: supplier.name,
      value: supplier.total_purchases,
      percentage: supplier.percentage,
    }));
  };

  const transformPurchasesToBarData = (purchases) => {
    return purchases.map((purchase) => ({
      key: purchase.supplier,
      value: purchase.value,
    }));
  };

  const transformApiData = (summary, trend, breakdown, suppliers, products) => {
    const metrics = {
      total_purchases: {
        value: summary.total_purchases || 0,
        trend: 0,
      },
      total_chemical: {
        value: summary.total_chemical || 0,
        trend: 0,
      },
      total_sparepart: {
        value: summary.total_sparepart || 0,
        trend: 0,
      },
    };

    // let trendData = null;

    // if (!filters.unit) {
    //   const tmp = trend.map((x) => {
    //     const ret = {
    //       period: x.period,
    //       week_start: x.week_start,
    //       week_end: x.week_end,
    //       total: x.total_value,
    //     };

    //     if ("Batubara" in x) ret["Batubara"] = x?.Batubara?.value ?? 0;
    //     if ("Chemical" in x) ret["Chemical"] = x?.Chemical?.value ?? 0;
    //     if ("Other" in x) ret["Other"] = x?.Other?.value ?? 0;
    //     if ("Sparepart" in x) ret["Sparepart"] = x?.Sparepart?.value ?? 0;

    //     return ret;
    //   });
    //   trendData = transformTrendData(tmp);
    // } else {
    //   const tmp = trend.map((x) => {
    //     const ret = {
    //       period: x.period,
    //       week_start: x.week_start,
    //       week_end: x.week_end,
    //       total: x.total_qty,
    //     };

    //     if ("Batubara" in x) ret["Batubara"] = x?.Batubara?.qty ?? 0;
    //     if ("Chemical" in x) ret["Chemical"] = x?.Chemical?.qty ?? 0;
    //     if ("Other" in x) ret["Other"] = x?.Other?.qty ?? 0;
    //     if ("Sparepart" in x) ret["Sparepart"] = x?.Sparepart?.qty ?? 0;

    //     return ret;
    //   });
    //   trendData = transformTrendData(tmp);
    // }

    const trendData = transformTrendData(trend);

    const donutData = (breakdown || []).map((item) => ({
      key: item.label.charAt(0).toUpperCase() + item.label.slice(1),
      value: (!filters.unit ? item.value : item.qty) || 0,
      drilldown: true,
      context: item.label,
    }));

    const top_suppliers = (suppliers?.top_suppliers || [])
      .slice(0, 5)
      .map((item) => ({
        name: item.supplier,
        total_purchases: item.total_spent || 0,
        percentage: item.percentage || 0,
      }));

    const top_purchases = (products?.most_purchased || [])
      .slice(0, 5)
      .map((item) => ({
        supplier: item.product,
        value: (!filters.unit ? item.total_value : item.total_qty) || 0,
      }));

    const most_purchased = transformProductsData(products);

    return {
      metrics,
      trendData,
      donutData,
      top_suppliers,
      top_purchases,
      most_purchased,
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

  if (!purchasingData) {
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

  const {
    metrics,
    trendData,
    donutData,
    top_suppliers,
    top_purchases,
    most_purchased,
  } = purchasingData;

  const onDrilldown = async (context, depth) => {
    const params = {
      start_date: dateRange?.dateFrom,
      end_date: dateRange?.dateTo,
      ...generateFilters(),
    };

    // level 1 → Goods vs Jasa
    if (depth === 0) {
      const res = await reportsPurchasingBreakdown(
        "account_type",
        context,
        0,
        params
      );
      return res.data.map((r) => ({
        key: r.label,
        value: !filters.unit ? r.value : r.qty,
        percentage: r.percentage,
        context: r.account_id,
        drilldown: true,
      }));
    }

    // level 2 → Supplier → Product breakdown
    if (depth === 1) {
      const res = await reportsPurchasingBreakdown(
        "account",
        context,
        context,
        params
      );

      return res.data.map((p) => ({
        key: p.label,
        value: !filters.unit ? p.value : p.qty,
      }));
    }
  };

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
            title="Total Purchases"
            value={formatCompactCurrency(metrics.total_purchases.value)}
            // trend={metrics.total_purchases.trend}
            icon={ShoppingCart}
            color="primary"
          />
          <Chart.Metric
            title="Total Chemical"
            value={formatCompactCurrency(metrics.total_chemical.value)}
            // trend={metrics.total_chemical.trend}
            icon={FlaskConical}
            color="success"
          />
          <Chart.Metric
            title="Total Sparepart"
            value={formatCompactCurrency(metrics.total_sparepart.value)}
            // trend={metrics.total_sparepart.trend}
            icon={Wrench}
            color="warning"
          />
        </MetricGrid>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="w-full h-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                    Trend Purchasing
                  </h3>
                  <p className="text-xs text-gray-600">Trend pembelian</p>
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
                valueFormatter={
                  !filters.unit ? formatCompactCurrency : formatCompactNumber
                }
              />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full ">
              <Highchart.HighchartsDonut
                data={donutData}
                title="Breakdown Purchasing"
                className="w-full h-full"
                showSummary={false}
                onDrilldownRequest={async ({ _, context, depth }) => {
                  return onDrilldown(context, depth);
                }}
                valueFormatter={
                  !filters.unit ? formatCompactCurrency : formatCompactNumber
                }
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
                  Top 5 Suppliers
                </h3>
                <p className="text-xs text-gray-600">
                  Supplier dengan total pembelian tertinggi
                </p>
              </div>
            </div>

            <Highchart.HighchartsBar
              initialData={transformSuppliersToBarData(top_suppliers)}
              title=""
              subtitle=""
              datasets={[
                { key: "value", label: "Total Purchases", color: "primary" },
              ]}
              periods={[]}
              showSummary={false}
              valueFormatter={
                !filters.unit ? formatCompactCurrency : formatCompactNumber
              }
            />

            {/* {top_suppliers.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-gray-200">
              <div className="p-2 rounded-lg bg-purple-50">
                <p className="text-xs text-purple-600">Total dari Top 5</p>
                <p className="text-sm font-bold text-purple-900">
                  {formatCompactCurrency(
                    top_suppliers.reduce((sum, s) => sum + s.total_purchases, 0)
                  )}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <p className="text-xs text-purple-600">Share dari Total</p>
                <p className="text-sm font-bold text-purple-900">
                  {top_suppliers
                    .reduce((sum, s) => sum + s.percentage, 0)
                    .toFixed(1)}
                  %
                </p>
              </div>
            </div>
          )} */}
          </Card>

          {/* Top 5 Product Values */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Top 5 Product Values
                </h3>
                <p className="text-xs text-gray-600">
                  Produk dengan nilai pembelian tertinggi
                </p>
              </div>
            </div>

            <Highchart.HighchartsBar
              initialData={transformPurchasesToBarData(top_purchases)}
              title=""
              subtitle=""
              datasets={[
                { key: "value", label: "Total Purchases", color: "primary" },
              ]}
              periods={[]}
              showSummary={false}
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
