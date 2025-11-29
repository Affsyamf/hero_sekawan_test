import { Edit2, Eye, Trash2, Upload } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import ImportStockOpnameModal from "../../components/features/stock-opname/ImportStockOpnameModal";
import StockOpnameForm from "../../components/features/stock-opname/StockOpnameForm";
import Table from "../../components/ui/table/Table";
import {
  createStockOpname,
  searchStockOpname,
  updateStockOpname,
} from "../../services/stock_opname_service";
import { formatDate } from "../../utils/helpers";
import Button from "../../components/ui/button/Button";
import useDateFilterStore from "../../stores/useDateFilterStore";

export default function StockOpnamePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const dateRange = useDateFilterStore((state) => state.dateRange);

  // useEffect(() => {
  //   setRefresh((prev) => prev + 1);
  // }, [dateRange]);

  const fetchDataWithDateFilter = useCallback(
    async (params) => {
      try {
        const queryParams = { ...params };

        if (dateRange?.dateFrom && dateRange?.dateTo) {
          queryParams.start_date = dateRange.dateFrom;
          queryParams.end_date = dateRange.dateTo;
        }

        const response = await searchStockOpname(queryParams);
        return response;
      } catch (error) {
        console.error("Failed to fetch stock movements:", error);
        throw error;
      }
    },
    [dateRange]
  );

  const columns = [
    {
      key: "code",
      label: "Code",
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
      key: "details",
      label: "Items",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.length || 0}</span>
      ),
    },
    {
      key: "system_qty",
      label: "System Qty",
      sortable: false,
      render: (_, row) => {
        const total = row.details?.reduce(
          (sum, d) => sum + (parseFloat(d.system_quantity) || 0),
          0
        );
        return (
          <span className="text-secondary-text">
            {total?.toFixed(2) || "0.00"}
          </span>
        );
      },
    },
    {
      key: "physical_qty",
      label: "Physical Qty",
      sortable: false,
      render: (_, row) => {
        const total = row.details?.reduce(
          (sum, d) => sum + (parseFloat(d.physical_quantity) || 0),
          0
        );
        return (
          <span className="text-secondary-text">
            {total?.toFixed(2) || "0.00"}
          </span>
        );
      },
    },
    {
      key: "difference",
      label: "Difference",
      sortable: false,
      render: (_, row) => {
        const systemTotal = row.details?.reduce(
          (sum, d) => sum + (parseFloat(d.system_quantity) || 0),
          0
        );
        const physicalTotal = row.details?.reduce(
          (sum, d) => sum + (parseFloat(d.physical_quantity) || 0),
          0
        );
        const diff = systemTotal - physicalTotal;
        return (
          <span
            className={`font-medium ${
              diff > 0
                ? "text-red-600"
                : diff < 0
                ? "text-green-600"
                : "text-secondary-text"
            }`}
          >
            {diff?.toFixed(2) || "0.00"}
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
      {/* <button
        onClick={() => {
          if (confirm(`Delete stock opname ${row.code}?`))
            setEntries((p) => p.filter((e) => e.id !== row.id));
        }}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button> */}
    </div>
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelected(null);
  };

  const handleSave = async (stockOpnameData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(stockOpnameData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateStockOpname(payload.id, payload);
      } else {
        await createStockOpname(payload);
      }
      setRefresh((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save stock opname: " + error.message);
    }
  };

  return (
    <div className=" bg-background">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-bold text-primary-text">
          Stock Opname Management
        </h1>
        <p className="mb-2 text-secondary-text">
          Record and manage physical inventory counts with system quantity
          comparison.
        </p>

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

        <div className="mb-4">
          <Button
            icon={Upload}
            label="Import from Excel"
            onClick={() => setIsImportOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          />
        </div>

        <Table
          key={refresh}
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

        <StockOpnameForm
          entry={selected}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelected(null);
          }}
          onSave={handleSave}
        />

        <ImportStockOpnameModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportSuccess={() => setRefresh((p) => p + 1)}
        />
      </div>
    </div>
  );
}
