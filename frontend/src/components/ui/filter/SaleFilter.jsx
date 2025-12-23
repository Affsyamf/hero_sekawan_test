import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "../../../utils/cn";
import { searchSales } from "../../../services/sale_service";
import { useTheme } from "../../../contexts/ThemeContext";

export default function SaleFilter({ value = [], onChange }) {
  const { colors } = useTheme();

  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchSales({
          q: search,
          page: 1,
          page_size: 100,
        });
        setSales(res.data.data || []);
      } catch (err) {
        console.error("Failed to load sales", err);
      } finally {
        setLoading(false);
      }
    }, 600);

    // cleanup: cancel previous timeout when user types again
    return () => clearTimeout(timeout);
  }, [search]);

  const toggle = (id) => {
    const newSelected = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange(newSelected);
  };

  return (
    <div>
      <h3 className="mb-3 font-semibold text-gray-800">Sale</h3>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search sales..."
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
        {sales.length === 0 && !loading ? (
          <div className="p-3 text-xs italic text-gray-500">
            No sales found
          </div>
        ) : (
          sales.map((sale) => (
            <label
              key={sale.id}
              className="flex items-center gap-2 p-2.5 text-xs cursor-pointer hover:bg-gray-100"
              title={sale.code}
            >
              <input
                type="checkbox"
                checked={value.includes(sale.id)}
                onChange={() => toggle(sale.id)}
                className="flex-shrink-0 accent-blue-600"
              />
              <span className="text-gray-700 truncate">{sale.code}</span>
            </label>
          ))
        )}
      </div>

      {/* Selected count */}
      {value.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {value.length} sale{value.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}