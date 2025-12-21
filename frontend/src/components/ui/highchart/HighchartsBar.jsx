import React, { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatCompactCurrency } from "../../../utils/helpers";
import {
  chartColors,
  getColorForLabel,
  registerCategories,
} from "../../../utils/chartColors";

const HighchartsBar = ({
  initialData,
  title,
  subtitle,
  datasets,
  periods,
  onFetchData,
  showSummary = true,
  valueFormatter,
}) => {
  const [period, setPeriod] = useState(periods?.[0] || "6 Bulan");
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (onFetchData) {
      const newData = onFetchData(period);
      setData(newData);
    }
  }, [period, onFetchData]);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (datasets) {
      registerCategories(datasets.map((ds) => ds.label));
    }
  }, [datasets]);

  const formatValue =
    valueFormatter ||
    ((val) => {
      if (val == null) return "-";
      if (typeof val === "number")
        return val.toLocaleString("en-US", { maximumFractionDigits: 2 });
      return String(val);
    });

  const categories = data?.map((item) => item.key) || [];

  const series =
    datasets?.map((dataset, index) => {
      return {
        name: dataset.label ?? dataset.key,
        data: data?.map((item) => item[dataset.key]) || [],
        color: getColorForLabel(dataset.label),
        type: dataset.type || "column",
        stacking:
          dataset.type === "column" && dataset.stacked ? "normal" : undefined,
      };
    }) || [];

  const summary =
    datasets?.map((dataset) => {
      const total =
        data?.reduce((sum, item) => sum + (item[dataset.key] || 0), 0) || 0;
      return {
        label: dataset.label,
        total,
        color: dataset.color === "primary" ? "#3b82f6" : "#f59e0b",
      };
    }) || [];

  const options = {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      height: 280, // 350 → 280
    },
    title: {
      text: null,
    },
    xAxis: {
      type: "category",
      categories: categories,
      crosshair: true,
      labels: {
        style: {
          fontSize: "11px", // 12px → 11px
          color: "#6b7280",
        },
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: "Nilai (Rp)",
        style: {
          color: "#6b7280",
          fontSize: "11px", // 12px → 11px
        },
      },
      labels: {
        formatter: function () {
          return formatValue(this.value);
        },
        style: {
          fontSize: "11px", // 12px → 11px
          color: "#6b7280",
        },
      },
      gridLineColor: "#e5e7eb",
    },
    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderRadius: 6,
      padding: 10,
      outside: true,
      zIndex: 999999,
      positioner: function (labelWidth, labelHeight, point) {
        const chart = this.chart;
        const chartWidth = chart.chartWidth;

        // base x = point position + chart offset
        let x = point.plotX + chart.plotLeft + 20; // prefer right
        const y = point.plotY + chart.plotTop - labelHeight / 2;

        // if tooltip would overflow right edge → flip to left side
        if (x + labelWidth > chartWidth) {
          x = point.plotX + chart.plotLeft - labelWidth - 20;
        }

        return { x, y };
      },
      formatter: function () {
        const header =
          (this.points &&
            this.points[0] &&
            this.points[0].point &&
            this.points[0].point.category) ||
          this.x;
        let tooltip = `<div style="font-size:13px;font-weight:600;margin-bottom:8px;">${header}</div>`;
        this.points.forEach((point) => {
          tooltip += `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${
            point.color
          };"></span>
          <span style="color:#6b7280;font-size:12px;">${
            point.series.name
          }:</span>
          <span style="font-weight:600;font-size:12px;">${formatValue(
            point.y
          )}</span>
        </div>`;
        });
        return tooltip;
      },
    },
    plotOptions: {
      column: {
        pointPadding: 0.1,
        borderWidth: 0,
        borderRadius: 3, // 4 → 3
      },
      spline: {
        marker: { enabled: true },
        lineWidth: 2.5,
      },
    },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
      itemStyle: {
        fontSize: "11px", // 12px → 11px
        color: "#374151",
        fontWeight: "500",
      },
      itemHoverStyle: {
        color: "#111827",
      },
    },
    credits: {
      enabled: false,
    },
    series: series,
  };

  return (
    <div className="p-4">
      {" "}
      {/* p-6 → p-4 */}
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        {" "}
        {/* mb-6 → mb-4 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate md:text-base">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-600">{subtitle}</p>
          )}
        </div>
        {periods && periods.length > 0 && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>
      {/* Chart */}
      <div className="w-full">
        <HighchartsReact highcharts={Highcharts} options={options} oneToOne />
      </div>
      {/* Summary */}
      {showSummary && summary.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-gray-200">
          {" "}
          {/* gap-4 pt-6 mt-6 → gap-3 pt-4 mt-4 */}
          {summary.map((item, index) => (
            <div key={index} className="p-3 rounded-lg bg-gray-50">
              {" "}
              {/* p-4 → p-3 */}
              <div className="flex items-center gap-1.5 mb-1">
                {" "}
                {/* gap-2 → gap-1.5 */}
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xs font-medium text-gray-700">
                  {" "}
                  {/* text-sm → text-xs */}
                  {item.label}
                </p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {" "}
                {/* text-xl → text-lg */}
                {formatCompactCurrency(item.total)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HighchartsBar;
