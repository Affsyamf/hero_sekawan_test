import { Edit2, Eye, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import DesignForm from "../../components/features/design/DesignForm";
import ImportDesignModal from "../../components/features/design/ImportDesignModal";
import Table from "../../components/ui/table/Table";
import {
  createDesign,
  deleteDesign,
  searchDesign,
  updateDesign,
} from "../../services/design_service";
import { searchDesignType } from "../../services/design_type_service";
import Button from "../../components/ui/button/Button";

export default function DesignsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [designTypes, setDesignType] = useState([]);

  useEffect(() => {
    const fetchDesignTypes = async () => {
      try {
        const response = await searchDesignType({}); // bisa tambahkan filter jika ada
        setDesignType(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch design type:", error);
      }
    };
    fetchDesignTypes();
  }, []);

  const columns = [
    {
      key: "code",
      label: "Design Code",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
    {
      key: "type_id",
      label: "Design Type",
      sortable: true,
      render: (value) => {
        const designType = (designTypes || []).find((a) => a.id === value);
        return (
          <span className="text-primary-text">
            {designType ? `${designType.name}` : "-"}
          </span>
        );
      },
    },
  ];

  const handleAdd = () => {
    setSelectedDesign(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedDesign(row);
    setIsModalOpen(true);
  };

  const handleDetail = (row) => {
    setSelectedDesign(row);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDesign(null);
  };

  const handleImport = () => {
    setIsImportModalOpen(true);
  };

  const handleImportSuccess = (result) => {
    // Refresh table data after successful import
    setRefreshKey((prev) => prev + 1);

    // Show success notification (you can use your notification system)
    console.log("Import successful:", result);

    // Optionally reload designs from API if you have one
    // Or you can fetch the updated list here
  };

  // Save handler
  const handleSave = async (designData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(designData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateDesign(payload.id, payload);
      } else {
        await createDesign(payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save design: " + error.message);
    }
  };

  const handleDelete = async (row) => {
    if (window.confirm(`Are you sure you want to delete design ${row.name}?`)) {
      try {
        await deleteDesign(row.id);
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
          Design Management
        </h1>
        <p className="mb-6 text-secondary-text">
          Manage designs with codes and type classifications.
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              icon={Upload}
              label="Import from Excel"
              onClick={handleImport}
              className="bg-green-600 hover:bg-green-700"
            />
          </div>
        </div>

        <Table
          key={refreshKey}
          columns={columns}
          fetchData={searchDesign}
          actions={renderActions}
          onCreate={handleAdd}
          pageSizeOptions={[10, 20, 50, 100]}
          showDateRangeFilter={false}
        />

        <DesignForm
          design={selectedDesign}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />

        <ImportDesignModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      </div>
    </div>
  );
}
