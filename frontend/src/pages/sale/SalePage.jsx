import { Edit2, Eye } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import SaleForm from "../../components/features/sale/SaleForm";
import Table from "../../components/ui/table/Table";
import ClientFilter from "../../components/ui/filter/ClientFilter";
import ColorKitchenFilter from "../../components/ui/filter/ColorKitchenFilter";
import DesignFilter from "../../components/ui/filter/DesignFilter";
import OpjFilter from "../../components/ui/filter/OpjFilter";
import {
  createSales,
  searchSales,
  updateSales,
} from "../../services/sale_service";
import { formatDate } from "../../utils/helpers";
import useDateFilterStore from "../../stores/useDateFilterStore";
import { useFilterService } from "../../contexts/FilterServiceContext";

export default function SalePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const dateRange = useDateFilterStore((state) => state.dateRange);
  const { filters, setFilter, registerFilters } = useFilterService();

  // Register filters untuk Sale page
  useEffect(() => {
    registerFilters([
      <ClientFilter
        key="client-filter"
        value={filters.client_ids || []}
        onChange={(v) => setFilter("client_ids", v)}
      />,
      <ColorKitchenFilter
        key="ck-filter"
        value={filters.ck_ids || []}
        onChange={(v) => setFilter("ck_ids", v)}
      />,
      <DesignFilter
        key="design-filter"
        value={filters.design_ids || []}
        onChange={(v) => setFilter("design_ids", v)}
      />,
      <OpjFilter
        key="opj-filter"
        value={filters.opj_ids || []}
        onChange={(v) => setFilter("opj_ids", v)}
      />,
    ]);
  }, [registerFilters, setFilter, JSON.stringify(filters)]);

  const fetchDataWithDateFilter = useCallback(
    async (params) => {
      try {
        const payload = { ...params };

        // Date filter (single value, not array)
        if (dateRange?.dateFrom) {
          payload.start_date = dateRange.dateFrom;
        }
        if (dateRange?.dateTo) {
          payload.end_date = dateRange.dateTo;
        }

        // Dynamic multi-select filters (as arrays, flat structure)
        if (filters.client_ids?.length) {
          payload.client_ids = filters.client_ids;
        }
        if (filters.ck_ids?.length) {
          payload.ck_ids = filters.ck_ids;
        }
        if (filters.design_ids?.length) {
          payload.design_ids = filters.design_ids;
        }
        if (filters.opj_ids?.length) {
          payload.opj_ids = filters.opj_ids;
        }

        const response = await searchSales(payload);
        return response;
      } catch (error) {
        console.error("Failed to fetch sales:", error);
        throw error;
      }
    },
    [dateRange, filters]
  );

  const columns = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (v) => <span className="font-medium text-primary-text">{v}</span>,
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">{formatDate(v)}</span>
      ),
    },
    {
      key: "client",
      label: "Client",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.name || "-"}</span>
      ),
    },
    {
      key: "quantity_start",
      label: "Qty Start",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">
          {parseFloat(v || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: "quantity_end",
      label: "Qty End",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">
          {parseFloat(v || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: "difference",
      label: "Difference",
      sortable: false,
      render: (_, row) => {
        const diff =
          (parseFloat(row.quantity_end) || 0) -
          (parseFloat(row.quantity_start) || 0);
        return (
          <span
            className={`font-medium ${
              diff > 0
                ? "text-green-600"
                : diff < 0
                ? "text-red-600"
                : "text-secondary-text"
            }`}
          >
            {diff.toFixed(2)}
          </span>
        );
      },
    },
    {
      key: "opj",
      label: "OPJ",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.code || "-"}</span>
      ),
    },
    {
      key: "color_kitchen",
      label: "Color Kitchen",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.name || "-"}</span>
      ),
    },
  ];

  const renderActions = (row) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setSelected(row);
          setIsModalOpen(true);
        }}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSelected(row);
          setIsModalOpen(true);
        }}
        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
        title="Edit"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelected(null);
  };

  const handleSave = async (saleData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(saleData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateSales(payload.id, payload);
      } else {
        await createSales(payload);
      }
      setRefresh((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save sale: " + error.message);
    }
  };

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.client_ids?.length) count += filters.client_ids.length;
    if (filters.ck_ids?.length) count += filters.ck_ids.length;
    if (filters.design_ids?.length) count += filters.design_ids.length;
    if (filters.opj_ids?.length) count += filters.opj_ids.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-bold text-primary-text">
          Sales Management
        </h1>
        <p className="mb-2 text-secondary-text">
          Manage sales transactions and track quantity conversions.
        </p>

        {/* Active Date Filter Info */}
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
                  ).toLocaleDateString("id-ID", {
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

        {/* Active Filters Info */}
        {activeFiltersCount > 0 && (
          <div className="p-3 mb-4 border border-purple-200 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-800">
              <span className="font-semibold">🔍 Active Filters:</span>{" "}
              {filters.client_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.client_ids.length} Client(s)
                </span>
              )}
              {filters.ck_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.ck_ids.length} Color Kitchen(s)
                </span>
              )}
              {filters.design_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.design_ids.length} Design(s)
                </span>
              )}
              {filters.opj_ids?.length > 0 && (
                <span className="mr-2">{filters.opj_ids.length} OPJ(s)</span>
              )}
            </p>
          </div>
        )}

        <Table
          key={`${refresh}-${JSON.stringify(filters)}`}
          columns={columns}
          fetchData={fetchDataWithDateFilter}
          actions={renderActions}
          onCreate={() => {
            setSelected(null);
            setIsModalOpen(true);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          showDateRangeFilter={false}
        />

        <SaleForm
          entry={selected}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
