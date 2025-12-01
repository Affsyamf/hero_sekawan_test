import React, { useEffect, useState } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import useDateFilterStore from "../../../stores/useDateFilterStore";

const toLocalYMD = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).toLocaleDateString(
    "en-CA"
  );

const DateRangeFilter = () => {
  const { dateRange, setDateRange, clearDateRange } = useDateFilterStore();
  const currentRange = dateRange;

  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(dateRange?.dateFrom || "");
  const [endDate, setEndDate] = useState(dateRange?.dateTo || "");
  const [filterMode, setFilterMode] = useState("days");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (isOpen) {
      setStartDate(currentRange?.dateFrom || "");
      setEndDate(currentRange?.dateTo || "");
      if (currentRange?.mode) setFilterMode(currentRange.mode);
      if (currentRange?.month) setSelectedMonth(currentRange.month);
      if (currentRange?.year) setSelectedYear(currentRange.year);
    }
  }, [isOpen, currentRange]);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleApplyFilter = () => {
    if (filterMode === "days" && startDate && endDate) {
      setDateRange({
        dateFrom: startDate,
        dateTo: endDate,
        mode: "days",
      });
    } else if (filterMode === "month-year") {
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = new Date(selectedYear, selectedMonth, 0);
      const startStr = toLocalYMD(start);
      const endStr = toLocalYMD(end);

      setDateRange({
        dateFrom: startStr,
        dateTo: endStr,
        mode: "month-year",
        month: selectedMonth,
        year: selectedYear,
      });
    } else if (filterMode === "year") {
      const start = new Date(selectedYear, 0, 1);
      const end = new Date(selectedYear, 11, 31);
      const startStr = toLocalYMD(start);
      const endStr = toLocalYMD(end);

      setDateRange({
        dateFrom: startStr,
        dateTo: endStr,
        mode: "year",
        year: selectedYear,
      });
    } else if (filterMode === "ytd") {
      const start = new Date(new Date().getFullYear(), 0, 1);
      const end = new Date();
      const startStr = toLocalYMD(start);
      const endStr = toLocalYMD(end);

      setDateRange({
        dateFrom: startStr,
        dateTo: endStr,
        mode: "ytd",
        year: new Date().getFullYear(),
      });
    }
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilterMode("days");
    clearDateRange();
    setIsOpen(false);
  };

  const handleQuickSelect = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const startStr = toLocalYMD(start);
    const endStr = toLocalYMD(end);

    setStartDate(startStr);
    setEndDate(endStr);
    setFilterMode("days");
    setDateRange({
      dateFrom: startStr,
      dateTo: endStr,
      mode: "days",
      days: days,
    });
    setIsOpen(false);
  };

  const handleFilterModeChange = (newMode) => {
    setFilterMode(newMode);

    let start, end;
    const now = new Date();

    switch (newMode) {
      case "month-year":
        start = new Date(selectedYear, selectedMonth - 1, 1);
        end = new Date(selectedYear, selectedMonth, 0);
        break;
      case "year":
        start = new Date(selectedYear, 0, 1);
        end = new Date(selectedYear, 11, 31);
        break;
      case "ytd":
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
        break;
      default:
        return;
    }

    const startStr = toLocalYMD(start);
    const endStr = toLocalYMD(end);

    setStartDate(startStr);
    setEndDate(endStr);

    setDateRange({
      dateFrom: startStr,
      dateTo: endStr,
      mode: newMode,
      ...(newMode === "month-year" && {
        month: selectedMonth,
        year: selectedYear,
      }),
      ...(newMode === "year" && { year: selectedYear }),
    });
  };

  const handleMonthYearChange = (type, value) => {
    if (type === "month") {
      setSelectedMonth(value);
    } else {
      setSelectedYear(value);
    }

    const month = type === "month" ? value : selectedMonth;
    const year = type === "year" ? value : selectedYear;

    if (filterMode === "month-year") {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      const startStr = toLocalYMD(start);
      const endStr = toLocalYMD(end);

      setStartDate(startStr);
      setEndDate(endStr);

      setDateRange({
        dateFrom: startStr,
        dateTo: endStr,
        mode: "month-year",
        month: month,
        year: year,
      });
    } else if (filterMode === "year") {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      const startStr = toLocalYMD(start);
      const endStr = toLocalYMD(end);

      setStartDate(startStr);
      setEndDate(endStr);

      setDateRange({
        dateFrom: startStr,
        dateTo: endStr,
        mode: "year",
        year: year,
      });
    }
  };

  const formatDateRange = () => {
    if (!currentRange?.dateFrom && !currentRange?.dateTo) {
      return "Select Date";
    }

    if (
      currentRange.mode === "month-year" &&
      currentRange.month &&
      currentRange.year
    ) {
      const monthName = months.find(
        (m) => m.value === currentRange.month
      )?.label;
      return `${monthName} ${currentRange.year}`;
    }

    if (currentRange.mode === "year" && currentRange.year) {
      return `${currentRange.year}`;
    }

    if (currentRange.mode === "ytd") {
      return `YTD ${new Date().getFullYear()}`;
    }

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const start = currentRange.dateFrom;
    const end = currentRange.dateTo;

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".date-filter-container")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative date-filter-container">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      >
        <Calendar size={16} className="text-gray-500" />
        <span className="text-xs sm:text-sm">{formatDateRange()}</span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Clear Button (shown when filter is active) */}
      {currentRange && (
        <button
          onClick={handleClearFilter}
          className="absolute p-1 text-white bg-red-500 rounded-full -right-2 -top-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
        >
          <X size={12} />
        </button>
      )}

      {/* Dropdown Panel - PERBAIKAN UTAMA DI SINI */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg top-full w-72 max-h-[85vh] overflow-y-auto">
          <div className="p-3 space-y-3">
            {/* Header */}
            <h3 className="text-sm font-semibold text-gray-900">Filter Date</h3>

            {/* Mode Filter */}
            <div>
              <label className="block mb-1.5 text-xs text-gray-500">
                Filter Mode
              </label>
              <div className="inline-flex flex-wrap gap-1 p-1 border border-gray-200 rounded-lg">
                {["days", "month-year", "year", "ytd"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleFilterModeChange(mode)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      filterMode === mode
                        ? "bg-blue-500 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {mode === "month-year"
                      ? "Month"
                      : mode === "ytd"
                      ? "YTD"
                      : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Month & Year Selectors */}
              {filterMode === "month-year" && (
                <div className="flex gap-2 mt-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) =>
                      handleMonthYearChange("month", Number(e.target.value))
                    }
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) =>
                      handleMonthYearChange("year", Number(e.target.value))
                    }
                    className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Year Only Selector */}
              {filterMode === "year" && (
                <select
                  value={selectedYear}
                  onChange={(e) =>
                    handleMonthYearChange("year", Number(e.target.value))
                  }
                  className="w-full px-2 py-1.5 mt-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              )}

              {/* YTD Info */}
              {filterMode === "ytd" && (
                <p className="mt-2 text-xs italic text-gray-500">
                  Year to date from Jan 1, {new Date().getFullYear()} to today
                </p>
              )}
            </div>

            {/* Quick Select for Days Mode */}
            {filterMode === "days" && (
              <>
                <div>
                  <label className="block mb-1.5 text-xs text-gray-500">
                    Quick Select
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Today", days: 0 },
                      { label: "Last 7 Days", days: 7 },
                      { label: "Last 30 Days", days: 30 },
                      { label: "Last 90 Days", days: 90 },
                    ].map((option) => (
                      <button
                        key={option.days}
                        onClick={() => handleQuickSelect(option.days)}
                        className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200"></div>

                {/* Custom Date Range */}
                <div>
                  <label className="block mb-1.5 text-xs text-gray-500">
                    Custom Range
                  </label>
                  <div className="space-y-2">
                    <div>
                      <label className="block mb-1 text-xs text-gray-600">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs text-gray-600">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Custom Date */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleClearFilter}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleApplyFilter}
                    disabled={!startDate || !endDate}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </>
            )}

            {/* Clear Filter Button for non-days modes */}
            {filterMode !== "days" && (
              <div className="flex justify-end">
                <button
                  onClick={handleClearFilter}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
