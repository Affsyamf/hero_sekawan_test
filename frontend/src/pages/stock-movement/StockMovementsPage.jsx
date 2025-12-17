import { Edit2, Eye, TrendingUp } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import StockMovementForm from "../../components/features/stock-movement/StockMovementForm";
import Table from "../../components/ui/table/Table";
import ProductFilter from "../../components/ui/filter/ProductFilter";
import AccountFilter from "../../components/ui/filter/AccountFilter";
import AccountParentFilter from "../../components/ui/filter/AccountParentFilter";
import SupplierFilter from "../../components/ui/filter/SupplierFilter";
import {
  createStockMovement,
  searchStockMovement,
  updateStockMovement,
} from "../../services/stock_movement_service";
import { formatDate } from "../../utils/helpers";
import useDateFilterStore from "../../stores/useDateFilterStore";
import { useFilterService } from "../../contexts/FilterServiceContext";

export default function StockMovementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const dateRange = useDateFilterStore((state) => state.dateRange);
  const { filters, setFilter, registerFilters } = useFilterService();

  // Register filters untuk Stock Movement page
  useEffect(() => {
    registerFilters([
      <ProductFilter
        key="product-filter"
        value={filters.product_ids || []}
        onChange={(v) => setFilter("product_ids", v)}
      />,
      <AccountFilter
        key="account-filter"
        value={filters.account_ids || []}
        onChange={(v) => setFilter("account_ids", v)}
      />,
      <AccountParentFilter
        key="account-parent-filter"
        value={filters.account_parent_ids || []}
        onChange={(v) => setFilter("account_parent_ids", v)}
      />,
      <SupplierFilter
        key="supplier-filter"
        value={filters.supplier_ids || []}
        onChange={(v) => setFilter("supplier_ids", v)}
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
        if (filters.product_ids?.length) {
          payload.product_ids = filters.product_ids;
        }
        if (filters.account_ids?.length) {
          payload.account_ids = filters.account_ids;
        }
        if (filters.account_parent_ids?.length) {
          payload.account_parent_ids = filters.account_parent_ids;
        }
        if (filters.supplier_ids?.length) {
          payload.supplier_ids = filters.supplier_ids;
        }

        const response = await searchStockMovement(payload);
        return response;
      } catch (error) {
        console.error("Failed to fetch stock movements:", error);
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
      render: (v) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-primary-text">{v}</span>
        </div>
      ),
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
      key: "product",
      label: "Product",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.name || "-"}</span>
      ),
    },
    {
      key: "account",
      label: "Account",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.name || "-"}</span>
      ),
    },
    {
      key: "supplier",
      label: "Supplier",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.name || "-"}</span>
      ),
    },
    {
      key: "quantity_in",
      label: "Qty In",
      sortable: true,
      render: (v) => (
        <span className="font-medium text-green-600">
          {v !== null && v !== undefined ? parseFloat(v).toFixed(2) : "-"}
        </span>
      ),
    },
    {
      key: "quantity_out",
      label: "Qty Out",
      sortable: true,
      render: (v) => (
        <span className="font-medium text-red-600">
          {v !== null && v !== undefined ? parseFloat(v).toFixed(2) : "-"}
        </span>
      ),
    },
    {
      key: "balance",
      label: "Balance",
      sortable: false,
      render: (_, row) => {
        const qtyIn = parseFloat(row.quantity_in) || 0;
        const qtyOut = parseFloat(row.quantity_out) || 0;
        const balance = qtyIn - qtyOut;
        return (
          <span
            className={`font-medium ${
              balance > 0
                ? "text-green-600"
                : balance < 0
                ? "text-red-600"
                : "text-secondary-text"
            }`}
          >
            {balance.toFixed(2)}
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

  const handleSave = async (stockMovementData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(stockMovementData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateStockMovement(payload.id, payload);
      } else {
        await createStockMovement(payload);
      }
      setRefresh((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save stock movement: " + error.message);
    }
  };

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.product_ids?.length) count += filters.product_ids.length;
    if (filters.account_ids?.length) count += filters.account_ids.length;
    if (filters.account_parent_ids?.length)
      count += filters.account_parent_ids.length;
    if (filters.supplier_ids?.length) count += filters.supplier_ids.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">
            Stock Movement Management
          </h1>
          <p className="text-secondary-text">
            Track and manage stock movements, inventory in/out transactions.
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
              {filters.product_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.product_ids.length} Product(s)
                </span>
              )}
              {filters.account_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.account_ids.length} Account(s)
                </span>
              )}
              {filters.account_parent_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.account_parent_ids.length} Account Parent(s)
                </span>
              )}
              {filters.supplier_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.supplier_ids.length} Supplier(s)
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

        <StockMovementForm
          stockMovement={selected}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
