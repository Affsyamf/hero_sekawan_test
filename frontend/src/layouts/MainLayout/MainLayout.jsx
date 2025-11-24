import { useState } from "react";
import { Navbar, Sidebar, Footer } from "../../components/layout";
import GlobalFilterDrawer from "../../components/common/GlobalFilterDrawer";
import { Filter } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "../../utils/cn";
import { useFilterService } from "../../contexts/FilterServiceContext";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const { colors } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const { hasActiveFilters } = useFilterService();

  const drawerWidth = 288; // px
  const navbarHeight = 64; // px, same as h-16 in Navbar

  return (
    <div
      style={{ background: colors.background.primary }}
      className="flex min-h-screen transition-all duration-300"
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Column */}
      <div
        className={cn(
          "relative flex flex-col flex-1 min-h-screen transition-all duration-300 overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
        style={{
          marginRight: filterOpen ? `${drawerWidth}px` : 0,
          transition: "margin-right 0.3s ease-in-out",
        }}
      >
        {/* Fixed Navbar */}
        <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
        </div>

        {/* Scrollable main content area */}
        <div
          className="flex flex-col flex-1 overflow-hidden"
          style={{
            paddingTop: `${navbarHeight}px`,
          }}
        >
          {/* Inner scrollable content */}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />{" "}
          </main>
          <Footer />
        </div>

        {/* Fixed Drawer on the right */}
        <GlobalFilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          width={drawerWidth}
          topOffset={navbarHeight}
        />

        {/* Floating filter button — sticks to drawer edge */}
        <button
          onClick={() => setFilterOpen((p) => !p)}
          className={cn(
            "fixed flex items-center gap-2 px-4 py-3 text-sm font-medium text-white transition-all duration-300 rounded-l-xl shadow-lg hover:pr-6 group bg-blue-600 z-40"
          )}
          style={{
            top: "50%",
            right: filterOpen ? `${drawerWidth}px` : 0,
            transform: "translateY(-50%)",
            transition: "right 0.3s ease-in-out",
          }}
        >
          <Filter className="w-5 h-5" />
          <span className="hidden group-hover:inline">
            {filterOpen ? "Close" : "Filters"}
          </span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          )}
        </button>
      </div>
    </div>
  );
}
