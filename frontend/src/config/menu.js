import {
  CircleDollarSign,
  ClipboardCheck,
  Database,
  FileBarChart2,
  FlaskConical,
  Package,
  Shell,
  ShoppingBag,
  ShoppingCart,
  TestTubeDiagonal,
  Truck,
  Wallet2,
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
    icon: Database,
    children: [
      { label: "Products", path: "/products", perm: "product.read" },
      { label: "Suppliers", path: "/suppliers", perm: "supplier.read" },
      { label: "Clients", path: "/clients", perm: "client.read" },
      { label: "Accounts", path: "/accounts", perm: "account.read" },
      { label: "Design", path: "/designs", perm: "design.read" },
    ],
  },

  { isHeader: true, text: "Process" },

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
    perm: "color_kitchen_batch.read",
  },
  {
    label: "Stock Opname",
    icon: ClipboardCheck,
    path: "/stock-opnames",
    perm: "stock_opname.read",
  },

  { isHeader: true, text: "Sales" },
  {
    label: "Opj",
    icon: CircleDollarSign,
    path: "/opj",
    perm: "opj.read",
  },
  {
    label: "Sales",
    icon: CircleDollarSign,
    path: "/sales",
    perm: "sales.read",
  },
  {
    label: "Delivery",
    icon: Truck,
    path: "/delivery",
    perm: "delivery.read",
  },
  {
    label: "Return",
    icon: Shell,
    path: "/return",
    perm: "return.read",
  },
  
  {
    label: "Payment",
    icon: Wallet2,
    path: "/payment",
    perm: "payment.read",
  },
  {
    label: "Test",
    icon: TestTubeDiagonal,
    path: "/sampling",
    perm: "sampling.read",
  },
];
