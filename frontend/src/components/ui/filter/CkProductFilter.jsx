import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "../../../utils/cn";
import { searchCkProduct } from "../../../services/product_service";
import { useTheme } from "../../../contexts/ThemeContext";

export default function CkProductFilter({ value = [], onChange }) {
  const { colors } = useTheme();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchCkProduct({
          q: search,
          page: 1,
          page_size: 1000,
        });
        setProducts(res.data.data || []);
      } catch (err) {
        console.error("Failed to load products", err);
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
      <h3 className="font-semibold text-gray-800 mb-3">Products</h3>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search products..."
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
        {products.length === 0 && !loading ? (
          <div className="p-3 text-xs text-gray-500 italic">
            No products found
          </div>
        ) : (
          products.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 p-2.5 text-xs cursor-pointer hover:bg-gray-100"
              title={p.name}
            >
              <input
                type="checkbox"
                checked={value.includes(p.id)}
                onChange={() => toggle(p.id)}
                className="flex-shrink-0 accent-blue-600"
              />
              <span className="text-gray-700 truncate">{p.name}</span>
            </label>
          ))
        )}
      </div>

      {/* Selected count */}
      {value.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          {value.length} product{value.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
