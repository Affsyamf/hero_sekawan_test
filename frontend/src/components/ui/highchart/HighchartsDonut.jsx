import React, { useRef, useState, useMemo, useEffect, cache } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/modules/drilldown";
import {
  getColorForLabel,
  registerCategories,
  othersColor,
} from "../../../utils/chartColors";

const HighchartsDonut = ({
  data,
  centerText,
  title,
  subtitle,
  className = "",
  showSummary = false,
  onDrilldownRequest,
  enableDataLabels = false,
  valueFormatter,
}) => {
  const chartRef = useRef(null);

  const [visibleData, setVisibleData] = useState([]);
  const [showRaw, setShowRaw] = useState(false);

  const cacheTree = useRef({ key: "__root__", children: [] });
  const drillStack = useRef(["__root__"]);

  useEffect(() => {
    cacheTree.current = { key: "__root__", children: [] };
    drillStack.current = ["__root__"];

    resetHighchartsDrilldown();

    setVisibleData(data);
    insertDrillData(["__root__"], data);
  }, [data]);

  function resetHighchartsDrilldown() {
    const chart = chartRef.current?.chart;
    if (!chart) return;

    // Drill up until we return to root
    while (chart.drilldownLevels && chart.drilldownLevels.length > 0) {
      chart.drillUp();
    }
  }

  function findNodeStrict(path) {
    let node = cacheTree.current;

    for (const key of path) {
      const child = node.children.find((c) => c.key === key);
      if (!child) return null;
      node = child;
    }
    return node;
  }

  function getCachedChildren(path) {
    const node = findNodeStrict(path);
    return node?.children?.length ? node.children : null;
  }

  // Utility: find or create nested node path
  function findOrCreateNode(path) {
    let node = cacheTree.current;

    for (const key of path) {
      let child = node.children.find((c) => c.key === key);
      if (!child) {
        child = { key, children: [] };
        node.children.push(child);
      }
      node = child;
    }
    return node;
  }

  // Utility: insert children cleanly
  function insertDrillData(path, children) {
    const node = findOrCreateNode(path);

    node.rawData = children.map((c) => ({
      key: c.name || c.key,
      value: c.y ?? c.value,
      drilldown: c.drilldown ?? false,
      context: c.context,
    }));
    const maxNData = getMaxN(children).maxNData;

    node.children = maxNData?.map((c) => ({
      key: c.name || c.key,
      value: c.y ?? c.value,
      drilldown: c.drilldown ?? false,
      context: c.context,
      children: c.children || [],
    }));
  }

  const getMaxN = (data) => {
    if (!data || data.length === 0) return [];

    // Sort descending
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const total = sortedData.reduce((sum, d) => sum + (d.value || 0), 0);
    if (total === 0) return [];

    // Target: Others ≤ 10 % of total
    const MAX_OTHER_RATIO = 0.1;

    let cumulative = 0;
    let cutoffIndex = sortedData.length; // assume all visible

    for (let i = 0; i < sortedData.length; i++) {
      cumulative += sortedData[i].value || 0;
      const remaining = total - cumulative;

      // stop when remaining ≤ 10 %
      if (remaining / total <= MAX_OTHER_RATIO) {
        cutoffIndex = i + 1;
        break;
      }
    }

    const visible = sortedData.slice(0, cutoffIndex);
    const others = sortedData.slice(cutoffIndex);

    const finalData = visible.map((item) => ({
      name: item.key,
      y: item.value,
      drilldown: item.drilldown ?? false,
      context: item.context,
      color: getColorForLabel(item.key),
    }));

    // Add "Others" only if there’s something left beyond 10 %
    if (others.length > 0) {
      // othersCache.current = others;
      finalData.push({
        id: "Others",
        name: "Others",
        y: others.reduce((sum, d) => sum + (d.value || 0), 0),
        drilldown: true,
        context: "__others__",
        color: othersColor,
      });
    }

    return { maxNData: finalData, others };
  };

  const finalData = useMemo(() => {
    const { maxNData, others } = getMaxN(data);
    return maxNData || [];
  }, [data]);
  registerCategories(finalData.map((d) => d.name));

  const formatValue =
    valueFormatter ||
    ((val) => {
      if (val == null) return "-";
      if (typeof val === "number")
        return val.toLocaleString("en-US", { maximumFractionDigits: 2 });
      return String(val);
    });

  const options = useMemo(() => {
    return {
      drilldown: {
        drillUpButton: {
          relativeTo: "spacingBox",
          position: { x: 0, y: 0 },
        },
        navigation: {
          breadcrumbs: { enabled: false },
        },
      },
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        height: 320,
        events: {
          load() {
            setVisibleData(data);
            insertDrillData(["__root__"], data);
          },
          async drilldown(e) {
            e.preventDefault(); // prevent default drilldown
            const chart = this;
            chart.showLoading("Loading...");

            try {
              let depth = 0;

              for (const lvl of chart.drilldownLevels || []) {
                const context = lvl.pointOptions?.context?.toLowerCase?.();
                if (context === "__others__") {
                  depth += 0;
                } else {
                  depth += 1;
                }
              }

              // 🔹 Determine the full drill path
              const path = [...drillStack.current, e.point.name];
              const cached = getCachedChildren(path);

              // ✅ CASE 1: Use cached data if exists
              if (cached) {
                const { maxNData, others } = getMaxN(cached);
                chart.addSingleSeriesAsDrilldown(e.point, {
                  id: e.point.name,
                  name: e.point.name,
                  data: maxNData,
                });
                chart.applyDrilldown();
                drillStack.current = path;
                setVisibleData(cached);
                return;
              }

              // ✅ CASE 2: Handle "Others"
              if (e.point.context === "__others__") {
                const cached = findOrCreateNode(drillStack.current);
                const { _, others } = getMaxN(cached.rawData);

                if (others.length > 0) {
                  const { maxNData, _ } = getMaxN(others);
                  chart.addSingleSeriesAsDrilldown(e.point, {
                    id: "others",
                    name: "Others",
                    data: maxNData,
                  });
                  chart.applyDrilldown();

                  insertDrillData(path, others);
                  drillStack.current = path;
                  // setVisibleData(drillData);
                }
                return;
              }

              if (!onDrilldownRequest) return;

              // ✅ CASE 3: Fetch from backend and cache
              const res = await onDrilldownRequest({
                name: e.point.name,
                context: e.point.options.context,
                depth,
              });

              // Cache this node
              insertDrillData(path, res);
              drillStack.current = path;

              const { maxNData, others } = getMaxN(res);

              chart.addSingleSeriesAsDrilldown(e.point, {
                id: e.point.name,
                name: e.point.name,
                data: maxNData,
              });

              chart.applyDrilldown();
              setVisibleData(res);
            } catch (err) {
              console.error("Drilldown fetch error:", err);
            } finally {
              chart.hideLoading();
            }
          },
          drillup() {
            const chart = this;

            let depth = 1;

            for (const lvl of chart.drilldownLevels || []) {
              const context = lvl.pointOptions?.context?.toLowerCase?.();
              if (context === "__others__") {
                depth += 0;
              } else {
                depth += 1;
              }
            }

            drillStack.current = [...drillStack.current.slice(0, depth)];
            const node = findOrCreateNode(drillStack.current);
            const cached = getCachedChildren(drillStack.current);

            if (cached?.length > 0) {
              setVisibleData(cached);
            }
          },
        },
      },
      title: { text: null },
      tooltip: {
        useHTML: true,
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 6,
        padding: 10,
        formatter: function () {
          return `
            <div style="font-size: 12px;">
              <div style="font-weight: 600; margin-bottom: 3px;">${
                this.point.name
              }</div>
              <div style="color: #6b7280; font-size: 11px; margin-bottom: 2px;">
                Nilai: <span style="font-weight: 600; color: #111827;">${formatValue(
                  this.point.y
                )}</span>
              </div>
              <div style="color: #6b7280; font-size: 11px;">
                Persentase: <span style="font-weight: 600; color: #111827;">${this.point.percentage.toFixed(
                  1
                )}%</span>
              </div>
            </div>
          `;
        },
      },
      colors: [],
      // colors: chartColors,
      plotOptions: {
        pie: {
          innerSize: "65%",
          size: "75%",
          center: ["50%", "50%"],
          depth: 45,
          dataLabels: {
            enabled: enableDataLabels,
            format: "{point.name}: {point.percentage:.1f}%",
            style: {
              fontSize: "11px",
              fontWeight: "500",
              color: "#374151",
              textOutline: "none",
            },
            distance: 12,
          },
          showInLegend: true,
          // colorByPoint: true,
        },
      },
      legend: {
        align: "center",
        verticalAlign: "bottom",
        layout: "horizontal",

        // spacing
        padding: 0,
        margin: 10,

        // control wrapping
        itemWidth: 150,
        maxHeight: 80,

        navigation: {
          enabled: true, // scroll arrows when too many labels
        },

        itemStyle: {
          fontSize: "11px",
          color: "#374151",
          fontWeight: "500",
        },
        itemHoverStyle: { color: "#111827" },
      },
      credits: { enabled: false },
      series: [
        {
          name: "Value",
          data: finalData.map((d) => ({
            ...d,
            color:
              d.context === "__others__"
                ? othersColor
                : getColorForLabel(d.name),
          })),
        },
      ],
    };
  }, [data, onDrilldownRequest, enableDataLabels]);

  return (
    <div className={`p-1 ${className}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900 md:text-base">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-600">{subtitle}</p>
          )}
        </div>

        <button
          onClick={() => setShowRaw((prev) => !prev)}
          className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
        >
          {showRaw ? "Hide Raw Data" : "Show Raw Data"}
        </button>
      </div>

      {/* Chart Container */}
      <div className="relative">
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          ref={chartRef}
        />

        {/* Center Text Overlay */}
        {centerText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center" style={{ marginBottom: "40px" }}>
              <p className="text-xl font-bold text-gray-900 md:text-2xl">
                {centerText.value}
              </p>
              <p className="text-xs text-gray-600">{centerText.label}</p>
            </div>
          </div>
        )}
      </div>

      {/* Current Data Display */}
      {showRaw && visibleData.length > 0 && (
        <div className="mt-4 p-3 border rounded bg-gray-50 text-xs">
          <p className="font-semibold mb-2 text-gray-700">Current Data:</p>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="py-1">Name</th>
                <th className="py-1 text-right">Value</th>
                <th className="py-1 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const total = visibleData.reduce(
                  (sum, d) => sum + (d.y || d.value || 0),
                  0
                );

                // Sort by percentage descending
                const sortedData = [...visibleData].sort(
                  (a, b) =>
                    (b.y || b.value || 0) / total -
                    (a.y || a.value || 0) / total
                );

                return sortedData.map((item, idx) => {
                  const percentage =
                    total > 0
                      ? (((item.y || item.value) / total) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 hover:bg-gray-100 transition"
                    >
                      <td className="py-1 text-gray-800">
                        {item.key || item.name}
                      </td>
                      <td className="py-1 text-right text-gray-700">
                        {formatValue(item.y || item.value || 0)}
                      </td>
                      <td className="py-1 text-right text-gray-500">
                        {percentage}%
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Cards */}
      {showSummary && data.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {data?.map((item, index) => (
            <div
              key={index}
              className="p-2.5 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: index === 0 ? "#3b82f6" : "#f59e0b",
                  }}
                />
                <p className="text-xs font-medium text-gray-700">
                  {item.label}
                </p>
              </div>
              <p className="text-base font-bold text-gray-900">
                {formatValue(item.value)}
              </p>
              <p className="text-xs text-gray-600">
                {(
                  (item.value / data.reduce((sum, d) => sum + d.value, 0)) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HighchartsDonut;
