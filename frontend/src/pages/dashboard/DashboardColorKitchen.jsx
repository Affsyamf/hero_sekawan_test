// pages/dashboard/DashboardColorKitchen.jsx
import { useTheme } from "../../contexts/ThemeContext";
import Card from "../../components/ui/card/Card";
import Button from "../../components/ui/button/Button";
import Chart from "../../components/ui/chart/Chart";
import { Highchart } from "../../components/ui/highchart";
import {
  Droplets,
  Palette,
  Download,
  Layers,
  FileText,
  Package2,
  DollarSign,
  TrendingUp,
  Building2,
  X,
  Cylinder,
  HandCoins,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  formatNumber,
  formatCompactCurrency,
  formatDate,
  formatCompactNumber,
} from "../../utils/helpers";
import {
  reportsColorKitchenSummary,
  reportsColorKitchenChemicalUsageSummary,
  reportsColorKitchenChemicalUsage,
  reportsColorKitchenTrend,
} from "../../services/reporting/report_color_kitchen_service";
import { formatPeriod, formatWeeklyPeriod } from "../../utils/dateHelper";
import useDateFilterStore from "../../stores/useDateFilterStore";
import { MetricGrid } from "../../components/ui/chart/MetricCard";
import { useFilterService } from "../../contexts/FilterServiceContext";
import UnitFilter from "../../components/ui/filter/UnitFilter";
import DyeAuxFilter from "../../components/ui/filter/DyeAuxFilter";
import CkProductFilter from "../../components/ui/filter/CkProductFilter";
import CkSupplierFilter from "../../components/ui/filter/CkSupplierFilter";
import Loading from "../../components/ui/loading/Loading";
import AccountFilter from "../../components/ui/filter/AccountFilter";

export default function DashboardColorKitchen() {
  const [ckData, setCkData] = useState(null);
  const [trendData, setTrendData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { colors } = useTheme();

  const [trendGranularity, setTrendGranularity] = useState("monthly");

  // ✅ Use useDateFilterStore instead of useGlobalFilter
  const dateRange = useDateFilterStore((state) => state.dateRange);

  const { filters, setFilter, registerFilters } = useFilterService();

  useEffect(() => {
    registerFilters([
      <UnitFilter
        key="unit-filter"
        value={filters.unit ?? null}
        onChange={(val) => setFilter("unit", val)}
      />,
      <DyeAuxFilter
        key="dye-aux-filter"
        value={filters.dye_aux ?? null}
        onChange={(val) => setFilter("dye_aux", val)}
      />,
      <AccountFilter
        key="account-filter"
        value={filters.account_ids ?? []}
        onChange={(val) => setFilter("account_ids", val)}
      />,
      <CkProductFilter
        key="ck-product-filter"
        value={filters.product_ids ?? []}
        onChange={(val) => setFilter("product_ids", val)}
      />,
      <CkSupplierFilter
        key="ck-supplier-filter"
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
      chemical_type: filters.dye_aux || "BOTH",
      account_ids: filters.account_ids?.length
        ? filters.account_ids
        : undefined,
    };
  };

  // ✅ Auto refresh when dateRange changes
  useEffect(() => {
    if (dateRange?.dateFrom && dateRange?.dateTo) {
      fetchCkData();
    }
  }, [dateRange, JSON.stringify(filters)]);

  useEffect(() => {
    if (dateRange?.dateFrom && dateRange?.dateTo) {
      fetchCkTrend();
    }
  }, [dateRange, trendGranularity, JSON.stringify(filters)]);

  const fetchCkData = async () => {
    // Skip jika dateRange belum ada
    if (!dateRange?.dateFrom || !dateRange?.dateTo) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // ✅ Use dateRange from useDateFilterStore
      const params = {
        start_date: dateRange.dateFrom,
        end_date: dateRange.dateTo,
        ...generateFilters(),
      };

      // Fetch all data in parallel
      const [summary, chemicalSummary, dyesData, auxData] = await Promise.all([
        reportsColorKitchenSummary(params),
        reportsColorKitchenChemicalUsageSummary(params),
        reportsColorKitchenChemicalUsage("dye", { ...params }),
        reportsColorKitchenChemicalUsage("aux", { ...params }),
      ]);

      const transformedData = transformApiData(
        summary.data,
        chemicalSummary.data,
        dyesData.data,
        auxData.data
      );

      setCkData(transformedData);
    } catch (error) {
      console.error("Error fetching Color Kitchen data:", error);
      setCkData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCkTrend = async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) return;

    const params = {
      start_date: dateRange.dateFrom,
      end_date: dateRange.dateTo,
      granularity: trendGranularity,
      ...generateFilters(),
    };

    const [trend] = await Promise.all([reportsColorKitchenTrend(params)]);

    const trendTransformed = trend.data.map((item) => {
      let displayPeriod = item.period;

      if (item.week_start && item.week_end) {
        displayPeriod = formatWeeklyPeriod(item.week_start, item.week_end);
      } else {
        displayPeriod = formatPeriod(item.period);
      }

      return {
        key: displayPeriod,
        dyes: item.dyes || 0,
        auxiliaries: item.auxiliaries || 0,
        total: item.total || 0,
      };
    });

    setTrendData(trendTransformed);
  };

  const transformApiData = (summary, chemicalSummary, dyesData, auxData) => {
    // Transform metrics
    const metrics = {
      total_rolls: {
        value: summary.total_rolls_processed || 0,
        trend: 0,
      },
      avg_cost_per_roll: {
        value: summary.avg_cost_per_roll || 0,
        trend: 0,
      },
      total_cost: {
        value: summary.total_cost || 0,
        trend: 0,
      },
    };

    // Transform chemical breakdown for donut charts
    const chemicalSummaryTransformed = (chemicalSummary.data || []).map(
      (item) => ({
        key: item.label === "Dyes" ? "Dyes" : "Auxiliaries",
        value: item.value || 0,
        drilldown: true,
        context: item.label,
      })
    );

    // Transform top dyes (dari parent_type=dye)
    const dyesList = dyesData.data || [];
    const maxDyeValue = Math.max(...dyesList.map((d) => d.quantity || 0), 1);
    const top_dyes = dyesList.slice(0, 5).map((item) => ({
      label: item.product_name || item.label || "Unknown",
      quantity: item.qty || 0,
      value: item.value || 0,
      percentage: item.percentage || 0,
      maxValue: maxDyeValue,
    }));

    // Transform top auxiliaries (dari parent_type=aux)
    const auxList = auxData.data || [];
    const maxAuxValue = Math.max(...auxList.map((a) => a.quantity || 0), 1);
    const top_aux = auxList.slice(0, 5).map((item) => ({
      label: item.product_name || item.label || "Unknown",
      quantity: item.qty || 0,
      value: item.value || 0,
      percentage: item.percentage || 0,
      maxValue: maxAuxValue,
    }));

    // Create cost breakdown for donut charts
    const dye_cost_breakdown =
      top_dyes.length > 0
        ? top_dyes.map((item) => ({
            label: item.label,
            value: item.cost,
          }))
        : [{ label: "No Data", value: 0 }];

    const aux_cost_breakdown =
      top_aux.length > 0
        ? top_aux.map((item) => ({
            label: item.label,
            value: item.cost,
          }))
        : [{ label: "No Data", value: 0 }];

    return {
      metrics,
      top_dyes,
      top_aux,
      dye_cost_breakdown,
      aux_cost_breakdown,
      chemicalSummaryTransformed,
    };
  };

  const handleExport = async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) {
      alert("Please select a date range first");
      return;
    }

    try {
      setExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Export successful!");
      alert("Export berhasil!");
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const onDrilldown = async (context, depth) => {
    console.log("aa");
    if (!dateRange?.dateFrom || !dateRange?.dateTo) return [];

    const params = {
      start_date: dateRange.dateFrom,
      end_date: dateRange.dateTo,
      ...generateFilters(),
    };

    let res = [];
    // // level 1 → Goods vs Jasa
    if (depth === 0) {
      if (context === "Dyes") {
        res = await reportsColorKitchenChemicalUsage("dye", params);
      } else {
        res = await reportsColorKitchenChemicalUsage("aux", params);
      }
      return res.data.data.map((r) => ({
        key: r.label,
        value: r.value,
        percentage: r.percentage,
      }));
    }
  };

  if (!ckData) {
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

  const transformDataToBar = (data) => {
    return data.map((x) => ({
      ...x,
      key: x.label,
    }));
  };

  const {
    metrics,
    top_dyes,
    top_aux,
    dye_cost_breakdown,
    aux_cost_breakdown,
    chemicalSummaryTransformed,
  } = ckData;

  return (
    <>
      {loading && <Loading fullscreen={true} />}
      <div className="max-w-full space-y-4 p-0.5 md:p-1">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
              Color Kitchen Dashboard
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 md:text-sm">
              Monitor chemical usage, cost analysis, dan trend color kitchen
            </p>
          </div>
          <div>
            <Button
              onClick={handleExport}
              disabled={exporting}
              label={exporting ? "Exporting..." : "Export Report"}
              icon={Download}
              className="text-white bg-green-600 hover:bg-green-700"
            />
          </div>
        </div>

        {/* KPI Cards - Row 1 */}
        <MetricGrid>
          <Chart.Metric
            title="Total Cost"
            value={formatCompactCurrency(metrics.total_cost?.value)}
            // trend={metrics.total_cost.trend}
            icon={HandCoins}
            color="primary"
          />
          <Chart.Metric
            title="Total Rolls"
            value={metrics.total_rolls?.value}
            // trend={metrics.total_chemical.trend}
            icon={Cylinder}
            color="success"
          />
          <Chart.Metric
            title="Average Cost Per Roll"
            value={formatCompactCurrency(metrics.avg_cost_per_roll?.value)}
            // trend={metrics.avg_cost_per_roll.trend}
            icon={DollarSign}
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
                    Chemical Usage Trend
                  </h3>
                  <p className="text-xs text-gray-600">
                    Trend penggunaan dyes dan auxiliaries
                  </p>
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
                initialData={trendData}
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
                data={chemicalSummaryTransformed}
                // centerText={{
                //   value: formatCompactCurrency(metrics.total_cost.value),
                //   label: "Total Cost",
                // }}
                title="Chemical Cost Breakdown"
                subtitle="Dyes vs Auxiliaries"
                onDrilldownRequest={async ({ _, context, depth }) => {
                  console.log("bb");
                  return onDrilldown(context, depth);
                }}
                valueFormatter={
                  !filters.unit ? formatCompactCurrency : formatCompactNumber
                }
              />
            </Card>
          </div>
        </div>

        {/* Top Products */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
          {/* Top 5 Suppliers */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Top 5 Dyes
                </h3>
                <p className="text-xs text-gray-600">
                  Dyes dengan total pemakaian tertinggi
                </p>
              </div>
            </div>

            <Highchart.HighchartsBar
              initialData={transformDataToBar(top_dyes)}
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

          {/* Top Auxiliaries */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Top 5 Aux
                </h3>
                <p className="text-xs text-gray-600">
                  Aux dengan total pemakaian tertinggi
                </p>
              </div>
            </div>

            <Highchart.HighchartsBar
              initialData={transformDataToBar(top_aux)}
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
