import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import Dropdown from "../../ui/dropdown/Dropdown";
import { useAuthStore } from "../../../stores/useAuthStore";

export default function ProfileDropdown() {
  const { user, logout } = useAuthStore();

  const name = user?.full_name || user?.username || "User";
  const role = user?.roles?.[0]?.name || "User";
  const initial = name.charAt(0).toUpperCase();

  const menuItems = [
    { icon: <User size={16} />, label: "Profile" },
    { icon: <Settings size={16} />, label: "Settings" },
  ];

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100">
          {/* Initial Avatar */}
          <div className="flex items-center justify-center w-8 h-8 text-sm font-semibold text-white bg-blue-600 rounded-full">
            {initial}
          </div>

          <span className="hidden text-sm font-medium text-gray-900 sm:block">
            {name}
          </span>

          <ChevronDown size={16} className="text-gray-500" />
        </button>
      }
    >
      {/* Header Section */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-lg font-semibold text-white bg-blue-600 rounded-full">
            {initial}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {menuItems.map((item, i) => (
          <button
            key={i}
            className="flex items-center w-full gap-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="py-2 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center w-full gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </Dropdown>
  );
}
