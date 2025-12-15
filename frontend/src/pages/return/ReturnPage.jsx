import { Edit2, Eye, RotateCcw } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import ReturnForm from "../../components/features/return/ReturnForm";
import Table from "../../components/ui/table/Table";
import ClientFilter from "../../components/ui/filter/ClientFilter";
import ColorKitchenFilter from "../../components/ui/filter/ColorKitchenFilter";
import ProductFilter from "../../components/ui/filter/ProductFilter";
import DesignFilter from "../../components/ui/filter/DesignFilter";
import {
  createReturn,
  searchReturn,
  updateReturn,
} from "../../services/return_service";
import { formatDate } from "../../utils/helpers";
import useDateFilterStore from "../../stores/useDateFilterStore";
import { useFilterService } from "../../contexts/FilterServiceContext";

export default function ReturnPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const dateRange = useDateFilterStore((state) => state.dateRange);
  const { filters, setFilter, registerFilters } = useFilterService();

  // Register filters untuk Return page
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
      <ProductFilter
        key="product-filter"
        value={filters.product_ids || []}
        onChange={(v) => setFilter("product_ids", v)}
      />,
      <DesignFilter
        key="design-filter"
        value={filters.design_ids || []}
        onChange={(v) => setFilter("design_ids", v)}
      />,
    ]);
  }, [registerFilters, setFilter, JSON.stringify(filters)]);

  const fetchDataWithDateFilter = useCallback(
    async (params) => {
      try {
        const queryParams = { ...params };

        // Build filters object
        const filtersPayload = {};

        // Add date range filters
        if (dateRange?.dateFrom && dateRange?.dateTo) {
          filtersPayload.start_date = [dateRange.dateFrom];
          filtersPayload.end_date = [dateRange.dateTo];
        }

        // Add client_ids filter
        if (filters.client_ids?.length) {
          filtersPayload.client_ids = filters.client_ids;
        }

        // Add ck_ids filter
        if (filters.ck_ids?.length) {
          filtersPayload.ck_ids = filters.ck_ids;
        }

        // Add product_ids filter
        if (filters.product_ids?.length) {
          filtersPayload.product_ids = filters.product_ids;
        }

        // Add design_ids filter
        if (filters.design_ids?.length) {
          filtersPayload.design_ids = filters.design_ids;
        }

        // Only add filters to params if there are any
        if (Object.keys(filtersPayload).length > 0) {
          queryParams.filters = filtersPayload;
        }

        const response = await searchReturn(queryParams);
        return response;
      } catch (error) {
        console.error("Failed to fetch returns:", error);
        throw error;
      }
    },
    [dateRange, filters]
  );

  const columns = [
    {
      key: "id",
      label: "Return ID",
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-orange-500" />
          <span className="font-medium text-primary-text">#{v}</span>
        </div>
      ),
    },
    {
      key: "date",
      label: "Return Date",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">{formatDate(v)}</span>
      ),
    },
    {
      key: "quantity",
      label: "Quantity Returned",
      sortable: true,
      render: (v) => (
        <span className="font-medium text-orange-600">
          {v !== null && v !== undefined ? parseFloat(v).toFixed(2) : "-"}
        </span>
      ),
    },
    {
      key: "sale",
      label: "Sale Reference",
      sortable: false,
      render: (v, row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-gray-700">
            {row.sale?.code || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "client_name",
      label: "Client",
      sortable: false,
      render: (v) => <span className="text-secondary-text">{v || "-"}</span>,
    },
    {
      key: "product_name",
      label: "Product",
      sortable: false,
      render: (v) => <span className="text-secondary-text">{v || "-"}</span>,
    },
    {
      key: "color_kitchen",
      label: "Color Kitchen",
      sortable: false,
      render: (v, row) => (
        <span className="text-secondary-text">
          {row.sale?.color_kitchen?.name || "-"}
        </span>
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
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSelected(row);
          setIsModalOpen(true);
        }}
        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
        title="Edit Return"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelected(null);
  };

  const handleSave = async (returnData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(returnData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateReturn(payload.id, payload);
      } else {
        await createReturn(payload);
      }
      setRefresh((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save return: " + error.message);
    }
  };

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.client_ids?.length) count += filters.client_ids.length;
    if (filters.ck_ids?.length) count += filters.ck_ids.length;
    if (filters.product_ids?.length) count += filters.product_ids.length;
    if (filters.design_ids?.length) count += filters.design_ids.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">
            Return Management
          </h1>
          <p className="text-secondary-text">
            Track and manage product returns from clients and deliveries.
          </p>
        </div>

        {/* Active Date Filter Info */}
        {dateRange && (
          <div className="p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">📅 Date Range:</span>{" "}
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
          <div className="p-3 mb-4 border border-orange-200 rounded-lg bg-orange-50">
            <p className="text-sm text-orange-800">
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
              {filters.product_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.product_ids.length} Product(s)
                </span>
              )}
              {filters.design_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.design_ids.length} Design(s)
                </span>
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

        <ReturnForm
          entry={selected}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
