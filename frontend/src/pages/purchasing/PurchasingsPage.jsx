import Table from "../../components/ui/table/Table";
import PurchasingForm from "../../components/features/purchasing/PurchasingForm";
import ImportPurchasingTransactionModal from "../../components/features/purchasing/ImportPurchasingTransactionModal";
import GuideImportPurchasingModal from "../../components/features/purchasing/GuideImportPurchasingModal";
import ImportOpeningBalanceModal from "../../components/features/purchasing/ImportOpeningBalance";
import { useState, useEffect, useCallback } from "react";
import { Edit2, Trash2, Eye, Upload, BookOpen } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import {
  createPurchasing,
  deletePurchasing,
  searchPurchasing,
  updatePurchasing,
} from "../../services/purchasing_service";
import Button from "../../components/ui/button/Button";
import useDateFilterStore from "../../stores/useDateFilterStore";
import { useFilterService } from "../../contexts/FilterServiceContext";
import { useNavigate } from "react-router-dom";
import SupplierFilter from "../../components/ui/filter/SupplierFilter";
import ProductFilter from "../../components/ui/filter/ProductFilter";
import AccountParentFilter from "../../components/ui/filter/AccountParentFilter";
import AccountFilter from "../../components/ui/filter/AccountFilter";

export default function PurchasingsPage() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportTrxOpen, setIsImportTrxOpen] = useState(false);
  const [isImportOpenBalOpen, setIsImportOpenBalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedPurchasing, setSelectedPurchasing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const dateRange = useDateFilterStore((state) => state.dateRange);
  const { filters, setFilter, registerFilters } = useFilterService();

  // Register filters untuk Purchasing page
  useEffect(() => {
    registerFilters([
      <SupplierFilter
        key="supplier-filter"
        value={filters.supplier_ids || []}
        onChange={(v) => setFilter("supplier_ids", v)}
      />,
      <ProductFilter
        key="product-filter"
        value={filters.product_ids || []}
        onChange={(v) => setFilter("product_ids", v)}
      />,
      <AccountParentFilter
        key="account-parent-filter"
        value={filters.account_parent_ids || []}
        onChange={(v) => setFilter("account_parent_ids", v)}
      />,
      <AccountFilter
        key="account-filter"
        value={filters.account_ids || []}
        onChange={(v) => setFilter("account_ids", v)}
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
        if (filters.supplier_ids?.length) {
          payload.supplier_ids = filters.supplier_ids;
        }
        if (filters.product_ids?.length) {
          payload.product_ids = filters.product_ids;
        }
        if (filters.account_parent_ids?.length) {
          payload.account_parent_ids = filters.account_parent_ids;
        }
        if (filters.account_ids?.length) {
          payload.account_ids = filters.account_ids;
        }

        const response = await searchPurchasing(payload);
        return response;
      } catch (error) {
        console.error("Failed to fetch purchasings:", error);
        throw error;
      }
    },
    [dateRange, filters]
  );

  const columns = [
    {
      key: "code",
      label: "No Bukti",
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
      key: "purchase_order",
      label: "PO Number",
      sortable: true,
      render: (v) => <span className="text-secondary-text">{v || "-"}</span>,
    },
    {
      key: "supplier_name",
      label: "Supplier",
      sortable: true,
    },
    {
      key: "total_amount",
      label: "Total Amount",
      sortable: false,
      render: (v) => (
        <span className="font-medium text-primary">
          {formatCurrency(v || 0)}
        </span>
      ),
    },
  ];

  const renderActions = (row) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setSelectedPurchasing(row);
          navigate(`/purchasings/detail/${row.id}`);
        }}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSelectedPurchasing(row);
          setIsModalOpen(true);
        }}
        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-all"
        title="Edit"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(row)}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const handleSave = async (purchasingData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(purchasingData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updatePurchasing(payload.id, payload);
      } else {
        await createPurchasing(payload);
      }

      setRefreshKey((prev) => prev + 1);
      setIsModalOpen(false);
      setSelectedPurchasing(null);
    } catch (error) {
      alert("Failed to save: " + error.message);
    }
  };

  const handleDelete = async (row) => {
    if (window.confirm(`Delete purchasing ${row.code}?`)) {
      try {
        await deletePurchasing(row.id);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        alert("Failed to delete: " + error.message);
      }
    }
  };

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.supplier_ids?.length) count += filters.supplier_ids.length;
    if (filters.product_ids?.length) count += filters.product_ids.length;
    if (filters.account_parent_ids?.length) count += filters.account_parent_ids.length;
    if (filters.account_ids?.length) count += filters.account_ids.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-bold text-primary-text">
          Purchasing Management
        </h1>
        <p className="mb-2 text-secondary-text">
          Manage product purchases with global date filter
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
              {filters.supplier_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.supplier_ids.length} Supplier(s)
                </span>
              )}
              {filters.product_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.product_ids.length} Product(s)
                </span>
              )}
              {filters.account_parent_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.account_parent_ids.length} Account Parent(s)
                </span>
              )}
              {filters.account_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.account_ids.length} Account(s)
                </span>
              )}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              icon={Upload}
              label="Import from Excel"
              onClick={() => setIsImportTrxOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            />

            <Button
              icon={Upload}
              label="Import Opening Balance"
              onClick={() => setIsImportOpenBalOpen(true)}
              variant="secondary"
            />
          </div>

          {/* Import Guide Button */}
          <Button
            icon={BookOpen}
            label="Import Guide"
            onClick={() => setIsGuideOpen(true)}
            variant="neutral"
          />
        </div>

        <Table
          key={`${refreshKey}-${JSON.stringify(filters)}`}
          columns={columns}
          fetchData={fetchDataWithDateFilter}
          actions={renderActions}
          onCreate={() => {
            setSelectedPurchasing(null);
            setIsModalOpen(true);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          showNumbering={true}
          showDateRangeFilter={false}
        />

        <PurchasingForm
          purchasing={selectedPurchasing}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPurchasing(null);
          }}
          onSave={handleSave}
        />

        <ImportPurchasingTransactionModal
          isOpen={isImportTrxOpen}
          onClose={() => setIsImportTrxOpen(false)}
          onImportSuccess={() => setRefreshKey((p) => p + 1)}
        />

        <ImportOpeningBalanceModal
          isOpen={isImportOpenBalOpen}
          onClose={() => setIsImportOpenBalOpen(false)}
          onImportSuccess={() => setRefreshKey((p) => p + 1)}
        />

        <GuideImportPurchasingModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />
      </div>
    </div>
  );
}