import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "../../../utils/cn";
import { searchDesign } from "../../../services/design_service";
import { useTheme } from "../../../contexts/ThemeContext";

export default function DesignFilter({ value = [], onChange }) {
  const { colors } = useTheme();

  const [designs, setDesigns] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await searchDesign({
          q: search,
          page: 1,
          page_size: 100,
        });
        setDesigns(res.data.data || []);
      } catch (err) {
        console.error("Failed to load designs", err);
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
      <h3 className="mb-2 text-sm font-semibold text-gray-800">Designs</h3>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search designs..."
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
        {designs.length === 0 && !loading ? (
          <div className="p-2 text-xs italic text-gray-500">
            No designs found
          </div>
        ) : (
          designs.map((d) => (
            <label
              key={d.id}
              className="flex items-center gap-2 p-2 text-xs cursor-pointer hover:bg-gray-100"
              title={d.code}
            >
              <input
                type="checkbox"
                checked={value.includes(d.id)}
                onChange={() => toggle(d.id)}
                className="flex-shrink-0 accent-blue-600"
              />
              <span className="text-gray-700 truncate">{d.code}</span>
            </label>
          ))
        )}
      </div>

      {/* Selected count */}
      {value.length > 0 && (
        <p className="text-[11px] text-gray-500 mt-1.5">
          {value.length} design{value.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}