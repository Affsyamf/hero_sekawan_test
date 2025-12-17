import Table from "../../components/ui/table/Table";
import ColorKitchenForm from "../../components/features/color-kitchen/ColorKitchenForm";
import ImportColorKitchenModal from "../../components/features/color-kitchen/ImportColorKitchenModal";
import { useState, useEffect, useCallback } from "react";
import { Edit2, Trash2, Eye, Upload, BookOpen } from "lucide-react";
import { formatDate } from "../../utils/helpers";
import {
  createColorKitchen,
  searchColorKitchen,
  updateColorKitchen,
} from "../../services/color_kitchen_service";
import Button from "../../components/ui/button/Button";
import useDateFilterStore from "../../stores/useDateFilterStore";
import GuideImportColorKitchenModal from "../../components/features/color-kitchen/GuideImportColorKitchenModal";
import { useFilterService } from "../../contexts/FilterServiceContext";
import AccountFilter from "../../components/ui/filter/AccountFilter";
import SupplierFilter from "../../components/ui/filter/SupplierFilter";
import ProductFilter from "../../components/ui/filter/ProductFilter";

export default function ColorKitchensPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const dateRange = useDateFilterStore((state) => state.dateRange);
  const { filters, setFilter, registerFilters } = useFilterService();

  // Register filters untuk Color Kitchen page
  useEffect(() => {
    registerFilters([
      <AccountFilter
        key="account-filter"
        value={filters.account_ids || []}
        onChange={(v) => setFilter("account_ids", v)}
      />,
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
    ]);
  }, [registerFilters, setFilter, JSON.stringify(filters)]);

  const fetchDataWithDateFilter = useCallback(
    async (params) => {
      try {
        const payload = { ...params };
        
        // Date filter
        if (dateRange?.dateFrom) {
          payload.start_date = dateRange.dateFrom;
        }
        if (dateRange?.dateTo) {
          payload.end_date = dateRange.dateTo;
        }

        // Dynamic multi-select filters (as arrays)
        if (filters.account_ids?.length) {
          payload.account_ids = filters.account_ids;
        }
        if (filters.supplier_ids?.length) {
          payload.supplier_ids = filters.supplier_ids;
        }
        if (filters.product_ids?.length) {
          payload.product_ids = filters.product_ids;
        }

        const response = await searchColorKitchen(payload);
        return response;
      } catch (error) {
        console.error("Failed to fetch color kitchen:", error);
        throw error;
      }
    },
    [dateRange, filters]
  );

  const columns = [
    {
      key: "code",
      label: "No OPJ",
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
      key: "design_name",
      label: "Design",
      sortable: true,
    },
    {
      key: "rolls",
      label: "Roll",
      sortable: true,
      render: (v) => <span className="text-secondary-text">{v}</span>,
    },
    {
      key: "paste_quantity",
      label: "Paste Qty",
      sortable: true,
      render: (v) => <span className="text-secondary-text">{v}</span>,
    },
    {
      key: "details",
      label: "Items",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.length || 0}</span>
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
      <button
        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelected(null);
  };

  const handleSave = async (colorKitchenData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(colorKitchenData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateColorKitchen(payload.id, payload);
      } else {
        await createColorKitchen(payload);
      }
      setRefresh((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save color kitchen: " + error.message);
    }
  };

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.account_ids?.length) count += filters.account_ids.length;
    if (filters.supplier_ids?.length) count += filters.supplier_ids.length;
    if (filters.product_ids?.length) count += filters.product_ids.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-bold text-primary-text">
          Color Kitchen Management
        </h1>
        <p className="mb-2 text-secondary-text">
          Manage color kitchen entries with design and product details.
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
                  ).toLocaleDateString("en-US", {
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
              {filters.account_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.account_ids.length} Account(s)
                </span>
              )}
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
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              icon={Upload}
              label="Import from Excel"
              onClick={() => setIsImportOpen(true)}
              className="bg-green-600 hover:bg-green-700"
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

        <ColorKitchenForm
          entry={selected}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelected(null);
          }}
          onSave={handleSave}
        />
        
        <ImportColorKitchenModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportSuccess={() => setRefresh((p) => p + 1)}
        />

        <GuideImportColorKitchenModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />
      </div>
    </div>
  );
}