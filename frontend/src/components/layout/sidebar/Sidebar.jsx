import {
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  FileBarChart2,
  ShoppingCart,
  Package,
  FlaskConical,
  ClipboardCheck,
} from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import { useEffect, useState } from "react";
import SidebarItem from "./SidebarItem";
import SidebarFooter from "./SidebarFooter";
import { usePermission } from "../../../hooks/usePermission";
import { menuItems } from "../../../config/menu";

export default function Sidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}) {
  const { colors } = useTheme();
  const [openDropdowns, setOpenDropdowns] = useState({});

  const { hasPermission } = usePermission();

  useEffect(() => {
    const initial = {};
    menuItems.forEach((item) => {
      if (item.children) initial[item.label] = true;
    });
    setOpenDropdowns(initial);
  }, []);

  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-60 lg:hidden"
          style={{ backgroundColor: colors.background.overlay }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-60 flex flex-col justify-between h-screen border-r transform transition-all duration-300 overflow-visible lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20" : "w-64"}`}
        style={{
          backgroundColor: colors.background.sidebar,
          borderColor: colors.border.secondary,
        }}
      >
        {/* Header */}
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-start gap-3 px-6"
          } pt-6 pb-4`}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              backgroundColor: colors.primary,
              color: colors.text.inverse,
            }}
          >
            <ShoppingBag size={16} />
          </div>
          {!collapsed && (
            <h1
              className="text-xl font-semibold"
              style={{ color: colors.text.primary }}
            >
              Hero Sekawan
            </h1>
          )}
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto px-4">
          <nav className="pb-4 space-y-1" role="navigation">
            {menuItems
              .filter((item) => {
                // Do not filter headers
                if (item.isHeader) return true;

                // If item has no children, check its own perm
                if (!item.children) return hasPermission(item.perm);

                // If item has children → keep only children with permission
                item.children = item.children.filter((child) =>
                  hasPermission(child.perm)
                );

                // If all children filtered out → remove the whole parent
                return item.children.length > 0;
              })
              .map((item, idx) =>
                item.isHeader ? (
                  !collapsed && (
                    <div
                      key={idx}
                      className="px-2 pt-4 pb-2 text-xs font-semibold tracking-wider uppercase"
                      style={{ color: colors.text.tertiary }}
                    >
                      {item.text}
                    </div>
                  )
                ) : (
                  <SidebarItem
                    key={idx}
                    item={item}
                    open={!collapsed && !!openDropdowns[item.label]}
                    toggleDropdown={() => toggleDropdown(item.label)}
                    collapsed={collapsed}
                  />
                )
              )}
          </nav>
        </div>

        {/* Footer */}
        {/* <SidebarFooter
          user={{ name: "MarcelE", role: "Admin" }}
          collapsed={collapsed}
        /> */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center absolute top-[2rem] -right-3 shadow-md transition-all duration-300 cursor-pointer"
          style={{
            width: "1.75rem",
            height: "1.75rem",
            borderRadius: "9999px",
            backgroundColor: colors.background.primary,
            border: `2px solid ${colors.border.secondary}`,
            color: colors.text.secondary,
            zIndex: 60,
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
}
