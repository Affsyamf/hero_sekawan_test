import Table from "../../components/ui/table/Table";
import Button from "../../components/ui/button/Button";
import ProductForm from "../../components/features/product/ProductForm";
import ImportProductModal from "../../components/features/product/ImportProductModal";
import { useState, useEffect, useCallback } from "react";
import { Edit2, Trash2, Eye, Upload, BookOpen } from "lucide-react";
import {
  createProduct,
  deleteProduct,
  searchProduct,
  updateProduct,
} from "../../services/product_service";
import ImportDataMasterModal from "../../components/features/import/ImportDataMasterModal";
import GuideImportMasterDataModal from "../../components/features/product/GuideImportMasterDataModal";
import { useFilterService } from "../../contexts/FilterServiceContext";
import AccountFilter from "../../components/ui/filter/AccountFilter";
import AccountParentFilter from "../../components/ui/filter/AccountParentFilter";
import SupplierFilter from "../../components/ui/filter/SupplierFilter";

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { filters, setFilter, registerFilters } = useFilterService();

  // Register filters untuk Product page
  useEffect(() => {
    registerFilters([
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

  const fetchDataWithFilters = useCallback(
    async (params) => {
      try {
        const payload = { ...params };

        if (filters.account_ids?.length) {
          payload.account_ids = filters.account_ids;
        }
        if (filters.account_parent_ids?.length) {
          payload.account_parent_ids = filters.account_parent_ids;
        }
        if (filters.supplier_ids?.length) {
          payload.supplier_ids = filters.supplier_ids;
        }

        const response = await searchProduct(payload);
        return response;
      } catch (error) {
        console.error("Failed to fetch products:", error);
        throw error;
      }
    },
    [filters]
  );

  const columns = [
    {
      key: "code",
      label: "Product Code",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value || "-"}</span>
      ),
    },
    {
      key: "name",
      label: "Product Name",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: false,
      render: (value, row) => {
        return <span className="font-semibold">{value}</span>;
      },
    },
    {
      key: "unit",
      label: "Unit",
      sortable: true,
      render: (value) => (
        <span className="text-secondary-text">{value || "-"}</span>
      ),
    },
    {
      key: "account_name",
      label: "Account",
      sortable: true,
    },
  ];

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSave = async (productData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(productData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateProduct(payload.id, payload);
      } else {
        await createProduct(payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save product: " + error.message);
    }
  };

  const handleDelete = async (row) => {
    if (
      window.confirm(`Are you sure you want to delete product ${row.name}?`)
    ) {
      try {
        await deleteProduct(row.id);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        alert("Failed to delete: " + error.message);
      }
    }
  };

  const handleImport = () => {
    setIsImportModalOpen(true);
  };

  const handleImportSuccess = (result) => {
    setRefreshKey((prev) => prev + 1);
  };

  const renderActions = (row) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setSelectedProduct(row);
          setIsModalOpen(true);
        }}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all duration-200"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSelectedProduct(row);
          setIsModalOpen(true);
        }}
        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-all duration-200"
        title="Edit"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(row)}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all duration-200"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.account_ids?.length) count += filters.account_ids.length;
    if (filters.account_parent_ids?.length) count += filters.account_parent_ids.length;
    if (filters.supplier_ids?.length) count += filters.supplier_ids.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-bold text-primary-text">
          Product Management
        </h1>
        <p className="mb-2 text-secondary-text">
          Manage your products with codes, units, and account associations.
        </p>

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

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              icon={Upload}
              label="Import from Excel"
              onClick={handleImport}
              className="bg-green-600 hover:bg-green-700"
            />
          </div>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border rounded-lg hover:shadow-md group"
            style={{
              borderColor: "#e5e7eb",
              backgroundColor: "white",
              color: "#6b7280",
            }}
            title="Panduan Import Data"
          >
            <BookOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Import Guide</span>
          </button>
        </div>

        <Table
          key={`${refreshKey}-${JSON.stringify(filters)}`}
          columns={columns}
          fetchData={fetchDataWithFilters}
          actions={renderActions}
          onCreate={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          showDateRangeFilter={false}
        />

        <ProductForm
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />

        <ImportDataMasterModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />

        <GuideImportMasterDataModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />
      </div>
    </div>
  );
}