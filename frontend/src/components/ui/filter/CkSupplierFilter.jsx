import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "../../../utils/cn";
import { searchSupplierCk } from "../../../services/supplier_service";
import { useTheme } from "../../../contexts/ThemeContext";

export default function CkSupplierFilter({ value = [], onChange }) {
  const { colors } = useTheme();

  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await searchSupplierCk({
          q: search,
          page: 1,
          page_size: 100,
        });
        setSuppliers(res.data.data || []);
      } catch (err) {
        console.error("Failed to load suppliers", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search]);

  const toggle = (id) => {
    const newSelected = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange(newSelected);
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-2 text-sm">Suppliers</h3>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 pr-2 py-1.5 w-full text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* List */}
      <div
        className={cn(
          "border rounded-lg divide-y max-h-50 overflow-y-auto bg-gray-50",
          loading && "opacity-60"
        )}
        style={{
          borderColor: colors.border.secondary,
        }}
      >
        {suppliers.length === 0 && !loading ? (
          <div className="p-2 text-xs text-gray-500 italic">
            No suppliers found
          </div>
        ) : (
          suppliers.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 p-2 text-xs cursor-pointer hover:bg-gray-100"
              title={s.name}
            >
              <input
                type="checkbox"
                checked={value.includes(s.id)}
                onChange={() => toggle(s.id)}
                className="flex-shrink-0 accent-blue-600"
              />
              <span className="text-gray-700 truncate">{s.name}</span>
            </label>
          ))
        )}
      </div>

      {/* Selected count */}
      {value.length > 0 && (
        <p className="text-[11px] text-gray-500 mt-1.5">
          {value.length} supplier{value.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
