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
} from "../../services/report_purchasing_service";
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
        product_ids: filters.product_ids?.length
          ? filters.product_ids
          : undefined,
        supplier_ids: filters.supplier_ids?.length
          ? filters.supplier_ids
          : undefined,
        category: filters.category,
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
        product_ids: filters.product_ids?.length
          ? filters.product_ids
          : undefined,
        supplier_ids: filters.supplier_ids?.length
          ? filters.supplier_ids
          : undefined,
        category: filters.category,
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

    const trendData = transformTrendData(trend);

    const donutData = (breakdown || []).map((item) => ({
      key: item.label.charAt(0).toUpperCase() + item.label.slice(1),
      value: item.value || 0,
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
        value: item.total_value || 0,
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

  const formatPeriod = (period) => {
    if (!period) return "";
    if (period.includes("-W")) {
      const [year, week] = period.split("-W");
      return `Week ${week}, ${year}`;
    }
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split("-");
      return new Date(year, month - 1).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
    return period;
  };

  const formatWeeklyPeriod = (weekStart, weekEnd) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    const startStr = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startStr} - ${endStr}`;
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
      product_ids: filters.product_ids?.length
        ? filters.product_ids
        : undefined,
      supplier_ids: filters.supplier_ids?.length
        ? filters.supplier_ids
        : undefined,
      category: filters.category,
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
        value: r.value,
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
        value: p.value,
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
            />

            {/* {top_purchases.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-gray-200">
              <div className="p-2 rounded-lg bg-green-50">
                <p className="text-xs text-green-600">Total dari Top 5</p>
                <p className="text-sm font-bold text-green-900">
                  {formatCompactCurrency(
                    top_purchases.reduce((sum, p) => sum + p.value, 0)
                  )}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <p className="text-xs text-green-600">Highest Value</p>
                <p className="text-sm font-bold text-green-900">
                  {formatCompactCurrency(
                    Math.max(...top_purchases.map((p) => p.value))
                  )}
                </p>
              </div>
            </div>
          )} */}
          </Card>
        </div>

        {/* Most Purchased Products */}
        {/* <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Most Purchased Products
                </h3>
                <p className="text-xs text-gray-600">
                  Top 5 produk dengan volume pembelian terbanyak
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={productsGranularity}
                onChange={(e) => setProductsGranularity(e.target.value)}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg"
              >
                <option value="daily">Perhari</option>
                <option value="weekly">Perminggu</option>
                <option value="monthly">Perbulan</option>
                <option value="yearly">Pertahun</option>
              </select>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Volume</p>
                <p className="text-xs font-semibold text-gray-900">
                  {formatNumber(
                    most_purchased.reduce((sum, item) => sum + item.value, 0)
                  )}{" "}
                  unit
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            {most_purchased.length > 0 ? (
              most_purchased.map((item, index) => (
                <div
                  key={index}
                  className="p-3 transition-all border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-xs font-bold text-blue-600 bg-blue-100 rounded-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {item.label}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-600">Volume</span>
                      <span className="text-xs font-bold text-gray-900">
                        {formatNumber(item.value)} {item.unit}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-600">Total Value</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {formatCompactCurrency(item.total_value)}
                      </span>
                    </div>
                    <Highchart.HighchartsProgress
                      label=""
                      value={item.value}
                      maxValue={item.maxValue}
                      color={
                        index === 0
                          ? "error"
                          : index === 1
                          ? "primary"
                          : index === 2
                          ? "warning"
                          : index === 3
                          ? "success"
                          : "info"
                      }
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-5">
                <p className="text-xs text-center text-gray-500">
                  No product data available
                </p>
              </div>
            )}
          </div>
        </Card> */}
      </div>
    </>
  );
}
