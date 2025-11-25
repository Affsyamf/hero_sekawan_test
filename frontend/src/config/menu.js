import {
  ClipboardCheck,
  FileBarChart2,
  FlaskConical,
  Package,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";

export const menuItems = [
  { isHeader: true, text: "Main" },

  {
    label: "Reports",
    icon: FileBarChart2,
    perm: "dashboard.read",
    children: [
      {
        label: "Dashboard",
        path: "/dashboard/overview",
        perm: "dashboard.read",
      },
      {
        label: "Purchasing",
        path: "/dashboard/purchasings",
        perm: "dashboard.read",
      },
      {
        label: "Color Kitchen",
        path: "/dashboard/color-kitchens",
        perm: "dashboard.read",
      },
    ],
  },

  { isHeader: true, text: "Master Data" },

  {
    label: "Master Data",
    icon: ShoppingBag,
    children: [
      { label: "Products", path: "/products", perm: "product.read" },
      { label: "Suppliers", path: "/suppliers", perm: "supplier.read" },
      { label: "Accounts", path: "/accounts", perm: "account.read" },
      { label: "Design", path: "/designs", perm: "design.read" },
    ],
  },

  { isHeader: true, text: "Transactions" },

  {
    label: "Purchasing",
    icon: ShoppingCart,
    path: "/purchasings",
    perm: "purchasing.read",
  },
  {
    label: "Stock Movement",
    icon: Package,
    path: "/stock-movements",
    perm: "stock_movement.read",
  },
  {
    label: "Color Kitchen",
    icon: FlaskConical,
    path: "/color-kitchens",
    perm: "color_kitchen.read",
  },
  {
    label: "Stock Opname",
    icon: ClipboardCheck,
    path: "/stock-opnames",
    perm: "stock_opname.read",
  },
];
