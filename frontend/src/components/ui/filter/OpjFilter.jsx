import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "../../../utils/cn";
import { searchOpj } from "../../../services/opj_service";
import { useTheme } from "../../../contexts/ThemeContext";

export default function OpjFilter({ value = [], onChange }) {
  const { colors } = useTheme();

  const [opjs, setOpjs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await searchOpj({
          q: search,
          page: 1,
          page_size: 100,
        });
        setOpjs(res.data.data || []);
      } catch (err) {
        console.error("Failed to load opjs", err);
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
      <h3 className="mb-2 text-sm font-semibold text-gray-800">Opjs</h3>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search opjs..."
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
        {opjs.length === 0 && !loading ? (
          <div className="p-2 text-xs italic text-gray-500">
            No opjs found
          </div>
        ) : (
          opjs.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 p-2 text-xs cursor-pointer hover:bg-gray-100"
              title={c.code}
            >
              <input
                type="checkbox"
                checked={value.includes(c.id)}
                onChange={() => toggle(c.id)}
                className="flex-shrink-0 accent-blue-600"
              />
              <span className="text-gray-700 truncate">{c.code}</span>
            </label>
          ))
        )}
      </div>

      {/* Selected count */}
      {value.length > 0 && (
        <p className="text-[11px] text-gray-500 mt-1.5">
          {value.length} opj{value.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}