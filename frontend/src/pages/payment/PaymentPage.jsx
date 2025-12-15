import { Edit2, Eye, Package } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import PaymentForm from "../../components/features/payment/PaymentForm";
import Table from "../../components/ui/table/Table";
import ClientFilter from "../../components/ui/filter/ClientFilter";
import ColorKitchenFilter from "../../components/ui/filter/ColorKitchenFilter";
import ProductFilter from "../../components/ui/filter/ProductFilter";
import {
  createPayment,
  searchPayment,
  updatePayment,
} from "../../services/payment_service";
import { formatDate } from "../../utils/helpers";
import useDateFilterStore from "../../stores/useDateFilterStore";
import { useFilterService } from "../../contexts/FilterServiceContext";

export default function PaymentPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const dateRange = useDateFilterStore((state) => state.dateRange);
  const { filters, setFilter, registerFilters } = useFilterService();

  // Register filters untuk Payment page
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
    ]);
  }, [registerFilters, setFilter, JSON.stringify(filters)]);

  const fetchDataWithDateFilter = useCallback(
    async (params) => {
      try {
        const queryParams = { ...params };

        const filtersPayload = {};

        // Date range (ALWAYS array per backend requirement)
        if (dateRange?.dateFrom && dateRange?.dateTo) {
          filtersPayload.start_date = [dateRange.dateFrom];
          filtersPayload.end_date = [dateRange.dateTo];
        }

        // Map FE → backend filter keys
        const filterMapping = {
          client_ids: filters.client_ids,
          ck_ids: filters.ck_ids,
          design_ids: filters.design_ids,
          opj_ids: filters.opj_ids,
          product_ids: filters.product_ids,
        };

        // Apply only non-empty filters
        Object.entries(filterMapping).forEach(([key, value]) => {
          if (value?.length) {
            filtersPayload[key] = value;
          }
        });

        // Attach filters
        if (Object.keys(filtersPayload).length > 0) {
          queryParams.filters = filtersPayload;
        }

        const response = await searchPayment(queryParams);
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
      key: "date",
      label: "Payment Date",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">{formatDate(v)}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (v) => (
        <span className="font-medium text-secondary-text">
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
          {row.sale?.client && (
            <span className="text-xs text-gray-500">
              {row.sale.client.name}
            </span>
          )}
        </div>
      ),
    }
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
        title="Edit Payment"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelected(null);
  };

  const handleSave = async (paymentData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(paymentData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updatePayment(payload.id, payload);
      } else {
        await createPayment(payload);
      }
      setRefresh((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save payment: " + error.message);
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
            Payment Management
          </h1>
          <p className="text-secondary-text">
            Track and manage payment orders.
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

        <PaymentForm
          entry={selected}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
