import { Edit2, Eye } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import OpjForm from "../../components/features/opj/OpjForm";
import Table from "../../components/ui/table/Table";
import DesignFilter from "../../components/ui/filter/DesignFilter";
import { createOpj, searchOpj, updateOpj } from "../../services/opj_service";
import { formatDate } from "../../utils/helpers";
import useDateFilterStore from "../../stores/useDateFilterStore";
import { useFilterService } from "../../contexts/FilterServiceContext";

// Enum untuk filter
const PRINTING_MACHINE_OPTIONS = [
  { value: "rotary", label: "Rotary" },
  { value: "flat", label: "Flat" },
];

const PROCESS_TYPE_OPTIONS = [
  { value: "disperse", label: "DISPERSE" },
  { value: "reactive", label: "REACTIVE" },
  { value: "pigment", label: "PIGMENT" },
];

// Custom Filter Components
function PrintingMachineFilter({ value = [], onChange }) {
  const handleToggle = (machineValue) => {
    const newValue = value.includes(machineValue)
      ? value.filter((v) => v !== machineValue)
      : [...value, machineValue];
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-secondary-text">
        Printing Machine
      </label>
      <div className="flex flex-wrap gap-2">
        {PRINTING_MACHINE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleToggle(option.value)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
              value.includes(option.value)
                ? "bg-primary text-white"
                : "bg-surface text-secondary-text border border-default hover:bg-background"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProcessTypeFilter({ value = [], onChange }) {
  const handleToggle = (typeValue) => {
    const newValue = value.includes(typeValue)
      ? value.filter((v) => v !== typeValue)
      : [...value, typeValue];
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-secondary-text">
        Process Type
      </label>
      <div className="flex flex-wrap gap-2">
        {PROCESS_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleToggle(option.value)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
              value.includes(option.value)
                ? "bg-primary text-white"
                : "bg-surface text-secondary-text border border-default hover:bg-background"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OpjPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const dateRange = useDateFilterStore((state) => state.dateRange);
  const { filters, setFilter, registerFilters } = useFilterService();

  // Register filters untuk OPJ page
  useEffect(() => {
    registerFilters([
      <DesignFilter
        key="design-filter"
        value={filters.design_ids || []}
        onChange={(v) => setFilter("design_ids", v)}
      />,
      <PrintingMachineFilter
        key="printing-machine-filter"
        value={filters.printing_machine || []}
        onChange={(v) => setFilter("printing_machine", v)}
      />,
      <ProcessTypeFilter
        key="process-type-filter"
        value={filters.processes_type || []}
        onChange={(v) => setFilter("processes_type", v)}
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

        // Dynamic multi-select filters (as arrays)
        if (filters.design_ids?.length) {
          payload.design_ids = filters.design_ids;
        }
        if (filters.printing_machine?.length) {
          payload.printing_machine = filters.printing_machine;
        }
        if (filters.processes_type?.length) {
          payload.processes_type = filters.processes_type;
        }

        const response = await searchOpj(payload);
        return response;
      } catch (error) {
        console.error("Failed to fetch OPJ:", error);
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
      key: "client",
      label: "Client",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.name || "-"}</span>
      ),
    },
    {
      key: "design",
      label: "Design",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.name || "-"}</span>
      ),
    },
    {
      key: "process_type",
      label: "Process Type",
      sortable: true,
      render: (v) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
          {v || "-"}
        </span>
      ),
    },
    {
      key: "printing_machine",
      label: "Machine",
      sortable: true,
      render: (v) => <span className="text-secondary-text">{v || "-"}</span>,
    },
    {
      key: "jenis_kain",
      label: "Jenis Kain",
      sortable: false,
      render: (v) => <span className="text-secondary-text">{v || "-"}</span>,
    },
    {
      key: "details",
      label: "Total Rolls",
      sortable: false,
      render: (v) => {
        const totalRolls = (v || []).reduce(
          (sum, detail) => sum + (parseFloat(detail.roll) || 0),
          0
        );
        return (
          <span className="font-medium text-secondary-text">
            {totalRolls.toFixed(2)}
          </span>
        );
      },
    },
    {
      key: "details",
      label: "Total Qty (KG)",
      sortable: false,
      render: (v) => {
        const totalQty = (v || []).reduce(
          (sum, detail) => sum + (parseFloat(detail.quantity) || 0),
          0
        );
        return (
          <span className="font-medium text-secondary-text">
            {totalQty.toFixed(2)}
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
    </div>
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelected(null);
  };

  const handleSave = async (opjData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(opjData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateOpj(payload.id, payload);
      } else {
        await createOpj(payload);
      }
      setRefresh((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save OPJ: " + error.message);
    }
  };

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.design_ids?.length) count += filters.design_ids.length;
    if (filters.printing_machine?.length)
      count += filters.printing_machine.length;
    if (filters.processes_type?.length) count += filters.processes_type.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-bold text-primary-text">
          OPJ Management
        </h1>
        <p className="mb-2 text-secondary-text">
          Manage Order Produksi Jadi (OPJ) for production orders.
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
              {filters.design_ids?.length > 0 && (
                <span className="mr-2">
                  {filters.design_ids.length} Design(s)
                </span>
              )}
              {filters.printing_machine?.length > 0 && (
                <span className="mr-2">
                  {filters.printing_machine.length} Machine(s)
                </span>
              )}
              {filters.processes_type?.length > 0 && (
                <span className="mr-2">
                  {filters.processes_type.length} Process Type(s)
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

        <OpjForm
          opj={selected}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
