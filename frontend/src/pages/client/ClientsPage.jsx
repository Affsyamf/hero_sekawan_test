import { Edit2, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import ClientForm from "../../components/features/client/ClientForm";
import Table from "../../components/ui/table/Table";
import {
  createClient,
  deleteClient,
  searchClient,
  updateClient,
} from "../../services/client_service";

export default function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch function for Table component
  // const fetchClients = async (params) => {
  //   const { page, pageSize, search, sortBy, sortDir } = params;

  //   let filtered = [...clients];

  //   // Search filter
  //   if (search) {
  //     const searchLower = search.toLowerCase();
  //     filtered = filtered.filter(
  //       (s) =>
  //         s.code?.toLowerCase().includes(searchLower) ||
  //         s.name?.toLowerCase().includes(searchLower) ||
  //         s.contact_info?.toLowerCase().includes(searchLower)
  //     );
  //   }

  //   // Sorting
  //   if (sortBy) {
  //     filtered.sort((a, b) => {
  //       let aVal = a[sortBy] || "";
  //       let bVal = b[sortBy] || "";

  //       if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
  //       if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
  //       return 0;
  //     });
  //   }

  //   // Pagination
  //   const total = filtered.length;
  //   const start = (page - 1) * pageSize;
  //   const rows = filtered.slice(start, start + pageSize);

  //   return { rows, total };
  // };

  const columns = [
    {
      key: "name",
      label: "Client Name",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
    {
      key: "contact_info",
      label: "Contact Info",
      sortable: false,
      render: (value) => (
        <span className="text-secondary-text">{value || "-"}</span>
      ),
    },
    {
      key: "address",
      label: "Client Address",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
  ];

  // CRUD Handlers
  const handleAdd = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedClient(row);
    setIsModalOpen(true);
  };

  const handleDetail = (row) => {
    setSelectedClient(row);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  // Save handler
  const handleSave = async (clientData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(clientData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateClient(payload.id, payload);
      } else {
        await createClient(payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save client: " + error.message);
    }
  };

  const handleDelete = async (row) => {
    if (
      window.confirm(`Are you sure you want to delete client ${row.name}?`)
    ) {
      try {
        await deleteClient(row.id);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        alert("Failed to delete: " + error.message);
      }
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

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-bold text-primary-text">
          Client Management
        </h1>
        <p className="mb-6 text-secondary-text">
          Manage your clients with contact information and details.
        </p>

        <Table
          key={refreshKey}
          columns={columns}
          fetchData={searchClient}
          actions={renderActions}
          onCreate={handleAdd}
          pageSizeOptions={[10, 20, 50, 100]}
          showDateRangeFilter={false}
        />

        <ClientForm
          client={selectedClient}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
