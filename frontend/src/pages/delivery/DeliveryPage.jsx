import { Edit2, Eye, Package } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import DeliveryForm from "../../components/features/delivery/DeliveryForm";
import Table from "../../components/ui/table/Table";
import ClientFilter from "../../components/ui/filter/ClientFilter";
import ColorKitchenFilter from "../../components/ui/filter/ColorKitchenFilter";
import ProductFilter from "../../components/ui/filter/ProductFilter";
import {
  createDelivery,
  searchDelivery,
  updateDelivery,
} from "../../services/delivery_service";
import { formatDate } from "../../utils/helpers";
import useDateFilterStore from "../../stores/useDateFilterStore";
import { useFilterService } from "../../contexts/FilterServiceContext";

export default function DeliveryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const dateRange = useDateFilterStore((state) => state.dateRange);
  const { filters, setFilter, registerFilters } = useFilterService();

  // Register filters untuk Delivery page
  useEffect(() => {
    registerFilters([
      <ClientFilter
        key="client-filter"
        value={filters.client_ids || []}
        onChange={(v) => setFilter("client_ids", v)}
      />,
      // <ColorKitchenFilter
      //   key="ck-filter"
      //   value={filters.ck_ids || []}
      //   onChange={(v) => setFilter("ck_ids", v)}
      // />,
      // <ProductFilter
      //   key="product-filter"
      //   value={filters.product_ids || []}
      //   onChange={(v) => setFilter("product_ids", v)}
      // />,
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
        // if (filters.ck_ids?.length) {
        //   payload.ck_ids = filters.ck_ids;
        // }
        // if (filters.product_ids?.length) {
        //   payload.product_ids = filters.product_ids;
        // }

        const response = await searchDelivery(payload);
        return response;
      } catch (error) {
        console.error("Failed to fetch deliveries:", error);
        throw error;
      }
    },
    [dateRange, filters]
  );

  const columns = [
    {
      key: "code",
      label: "Delivery Code",
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-primary-text">{v}</span>
        </div>
      ),
    },
    {
      key: "date",
      label: "Delivery Date",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">{formatDate(v)}</span>
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: true,
      render: (v) => (
        <span className="font-medium text-secondary-text">
          {v !== null && v !== undefined ? parseFloat(v).toFixed(2) : "-"}
        </span>
      ),
    },
    {
      key: "sale_code",
      label: "Sale Reference",
      sortable: false,
      render: (v) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-gray-700">
            {v || "-"}
          </span>
        </div>
      ),
    },
    // {
    //   key: "color_kitchen",
    //   label: "Color Kitchen",
    //   sortable: false,
    //   render: (v, row) => (
    //     <span className="text-secondary-text">
    //       {row.sale?.color_kitchen?.name || "-"}
    //     </span>
    //   ),
    // },
    {
      key: "return_status",
      label: "Return Status",
      sortable: false,
      render: (v, row) => {
        const hasReturn = row.return_id !== null && row.return_id !== undefined;
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              hasReturn
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {hasReturn ? "Has Return" : "No Return"}
          </span>
        );
      },
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
        title="Edit Delivery"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelected(null);
  };

  const handleSave = async (deliveryData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(deliveryData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateDelivery(payload.id, payload);
      } else {
        await createDelivery(payload);
      }
      setRefresh((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save delivery: " + error.message);
    }
  };

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.client_ids?.length) count += filters.client_ids.length;
    if (filters.ck_ids?.length) count += filters.ck_ids.length;
    if (filters.product_ids?.length) count += filters.product_ids.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">
            Delivery Management
          </h1>
          <p className="text-secondary-text">
            Track and manage delivery orders, quantities, and returns.
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
              {filters.product_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.product_ids.length} Product(s)
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

        <DeliveryForm
          entry={selected}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}