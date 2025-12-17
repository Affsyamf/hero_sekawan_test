import { Edit2, Eye, Map, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import AccountForm from "../../components/features/account/AccountForm";
import Table from "../../components/ui/table/Table";
import {
  createAccount,
  deleteAccount,
  searchAccount,
  updateAccount,
} from "../../services/account_service";
import Button from "../../components/ui/button/Button";
import { useNavigate } from "react-router-dom";
import { useFilterService } from "../../contexts/FilterServiceContext";
import ProductFilter from "../../components/ui/filter/ProductFilter";
import SupplierFilter from "../../components/ui/filter/SupplierFilter";

export default function AccountsPage() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { filters, setFilter, registerFilters } = useFilterService();

  // Register filters untuk Account page
  useEffect(() => {
    registerFilters([
      <ProductFilter
        key="product-filter"
        value={filters.product_ids || []}
        onChange={(v) => setFilter("product_ids", v)}
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

        if (filters.product_ids?.length) {
          payload.product_ids = filters.product_ids;
        }
        if (filters.supplier_ids?.length) {
          payload.supplier_ids = filters.supplier_ids;
        }

        const response = await searchAccount(payload);
        return response;
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
        throw error;
      }
    },
    [filters]
  );

  const columns = [
    {
      key: "account_no",
      label: "Account No",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
    {
      key: "name",
      label: "Account Name",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedAccount(row);
    setIsModalOpen(true);
  };

  const handleDetail = (row) => {
    setSelectedAccount(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (
      window.confirm(`Are you sure you want to delete account ${row.name}?`)
    ) {
      try {
        await deleteAccount(row.id);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        alert("Failed to delete: " + error.message);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const handleSave = async (accountData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(accountData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateAccount(payload.id, payload);
      } else {
        await createAccount(payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save account: " + error.message);
    }
  };

  const renderActions = (row) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleDetail(row)}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all duration-200"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleEdit(row)}
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
    if (filters.product_ids?.length) count += filters.product_ids.length;
    if (filters.supplier_ids?.length) count += filters.supplier_ids.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-bold text-primary-text">
          Account Management
        </h1>
        <p className="mb-2 text-secondary-text">Manage accounts</p>

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
              {filters.supplier_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.supplier_ids.length} Supplier(s)
                </span>
              )}
            </p>
          </div>
        )}

        <div className="flex items-center mb-4">
          <Button
            icon={Map}
            label="Account Mapping"
            onClick={() => navigate(`/accounts/category-board`)}
            variant="success"
          >
            Account Mapping
          </Button>
        </div>

        <Table
          key={`${refreshKey}-${JSON.stringify(filters)}`}
          columns={columns}
          fetchData={fetchDataWithFilters}
          actions={renderActions}
          onCreate={handleAdd}
          pageSizeOptions={[10, 20, 50, 100]}
          showDateRangeFilter={false}
        />

        {/* <AccountForm
          account={selectedAccount}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        /> */}
      </div>
    </div>
  );
}
