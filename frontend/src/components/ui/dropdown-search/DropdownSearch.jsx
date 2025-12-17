import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * DropdownSearch Component with Server-Side Search
 *
 * @param {Function} apiService - API service function that returns data
 * @param {string} placeholder - Input placeholder text
 * @param {Function} onChange - Callback when item is selected, returns the value based on valueKey
 * @param {any} value - Current selected value (ID or full object)
 * @param {string} name - Input name attribute
 * @param {string|Function} contentItem - Display content (column name or render function)
 * @param {string} valueKey - Key to return as value (default: 'id')
 * @param {string} displayKey - Key to display in input (default: 'name')
 *
 * @example
 * <DropdownSearch
 *   contentItem="name"
 *   valueKey="id"
 *   displayKey="name"
 *   onChange={(value) => console.log(value)} // Returns only ID
 * />
 */
const DropdownSearch = ({
  apiService,
  placeholder = "Ketik untuk mencari...",
  onChange,
  value,
  name,
  contentItem,
  valueKey = "id",
  displayKey = "name",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const listRef = useRef(null);
  const searchTimeout = useRef(null);
  const itemRefs = useRef([]);

  if (!contentItem) {
    console.error("contentItem is required");
    return null;
  }

  // Fetch data from API
  const fetchData = async (currentPage, searchQuery, reset = false) => {
    if (!apiService) {
      console.error("apiService is required");
      return;
    }

    setLoading(true);
    try {
      const filter = {
        page: currentPage,
        page_size: 10,
        ...(searchQuery && { q: searchQuery }),
      };

      const response = await apiService(filter);
      const result = response.data;

      if (reset) {
        setItems(result.data);
        setHighlightedIndex(0);
      } else {
        setItems((prev) => [...prev, ...result.data]);
      }

      setHasMore(result.meta.pagination.has_next);
    } catch (error) {
      console.error("Error fetching data:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial value jika value sudah ada (untuk edit mode)
  useEffect(() => {
    const loadInitialValue = async () => {
      if (value && !selectedItem) {
        // Jika value adalah object lengkap
        if (typeof value === "object" && value !== null) {
          setSelectedItem(value);
          setInputValue(value[displayKey] || "");
          return;
        }

        // Jika value adalah ID, fetch data untuk mendapatkan detail
        try {
          const filter = { page: 1, page_size: 10 };
          const response = await apiService(filter);
          const result = response.data;

          const foundItem = result.data.find(
            (item) => item[valueKey] === value
          );

          if (foundItem) {
            setSelectedItem(foundItem);
            setInputValue(foundItem[displayKey] || "");
          }
        } catch (error) {
          console.error("Error loading initial value:", error);
        }
      }
    };

    loadInitialValue();
  }, [value, apiService, valueKey, displayKey]);

  // Initial load 10 items
  useEffect(() => {
    if (!initialLoad) {
      fetchData(1, "", true);
      setInitialLoad(true);
    }
  }, [initialLoad]);

  // Handle search dengan debounce
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchData(1, search, true);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search]);

  // Handle scroll untuk infinite loading
  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;

    if (bottom && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, search, false);
    }
  };

  // Close dropdown saat click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setSearch(value);
    setShowDropdown(true);

    // Reset selected item jika user mengetik manual
    if (selectedItem && value !== selectedItem[displayKey]) {
      setSelectedItem(null);
      if (onChange) {
        onChange(null);
      }
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || items.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const newIndex = prev < items.length - 1 ? prev + 1 : prev;
          scrollToHighlighted(newIndex);
          return newIndex;
        });
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : 0;
          scrollToHighlighted(newIndex);
          return newIndex;
        });
        break;

      case "Enter":
        e.preventDefault();
        if (items[highlightedIndex]) {
          handleSelect(items[highlightedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        break;

      case "Tab":
        setShowDropdown(false);
        break;
    }
  };

  const scrollToHighlighted = (index) => {
    const element = itemRefs.current[index];
    if (element && listRef.current) {
      const container = listRef.current;
      const elementTop = element.offsetTop;
      const elementBottom = elementTop + element.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;

      if (elementTop < containerTop) {
        container.scrollTop = elementTop;
      } else if (elementBottom > containerBottom) {
        container.scrollTop = elementBottom - container.clientHeight;
      }
    }
  };

  const handleSelect = (item) => {
    setSelectedItem(item);
    setInputValue(item[displayKey] || "");
    setShowDropdown(false);
    setSearch("");

    if (onChange) {
      // Return value berdasarkan valueKey (default: id)
      const returnValue = item[valueKey];
      onChange(returnValue);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSelectedItem(null);
    setSearch("");
    setShowDropdown(false);

    if (onChange) {
      onChange(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
          autoComplete="off"
        />

        {/* Clear Button */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Recommendations */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg">
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="overflow-y-auto max-h-72"
          >
            {items.length === 0 && !loading ? (
              <div className="px-4 py-8 text-sm text-center text-gray-400">
                Tidak ada data ditemukan
              </div>
            ) : (
              <>
                {items.map((item, index) => {
                  const isHighlighted = index === highlightedIndex;

                  // Render content berdasarkan tipe contentItem
                  let content;

                  if (typeof contentItem === "function") {
                    // Custom render dengan function
                    content = contentItem(item, index, isHighlighted);
                  } else {
                    // Simple render dengan nama kolom
                    content = (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-900">
                          {item[contentItem]}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item[valueKey] || item.id || index}
                      ref={(el) => (itemRefs.current[index] = el)}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3.5 py-2.5 cursor-pointer transition-colors ${
                        isHighlighted ? "bg-gray-50" : "hover:bg-gray-50"
                      }`}
                    >
                      {content}
                    </div>
                  );
                })}
              </>
            )}

            {/* Loading Spinner */}
            {loading && (
              <div className="flex items-center justify-center px-4 py-3 border-t border-gray-100">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                <span className="ml-2 text-xs text-gray-500">Memuat...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownSearch;
