// -----------------------------
// DEFINE ALL ROUTES HERE

import {
  AccountsPage,
  ColorKitchenDetailPage,
  ColorKitchensPage,
  DashboardColorKitchen,
  DashboardPurchasing,
  DesignsPage,
  DesignTypesPage,
  OverviewNew,
  ProductsPage,
  PurchasingDetailPage,
  PurchasingReportsPage,
  PurchasingsPage,
  StockMovementsPage,
  StockOpnamePage,
  SuppliersPage,
} from "../pages";
import AccountCategoryBoard from "../pages/account/AccountCategoryBoard";

// -----------------------------
export const protectedRoutes = [
  {
    path: "dashboard/overview",
    element: OverviewNew,
    permission: "dashboard.read",
  },
  {
    path: "dashboard/purchasings",
    element: DashboardPurchasing,
    permission: "dashboard.read",
  },
  {
    path: "dashboard/color-kitchens",
    element: DashboardColorKitchen,
    permission: "dashboard.read",
  },

  { path: "products", element: ProductsPage, permission: "product.read" },
  { path: "suppliers", element: SuppliersPage, permission: "supplier.read" },

  { path: "accounts", element: AccountsPage, permission: "account.read" },
  {
    path: "accounts/category-board",
    element: AccountCategoryBoard,
    permission: "account.read",
  },

  { path: "designs", element: DesignsPage, permission: "design.read" },
  {
    path: "design-types",
    element: DesignTypesPage,
    permission: "design.read",
  },

  {
    path: "purchasings",
    element: PurchasingsPage,
    permission: "purchasing.read",
  },
  {
    path: "purchasings/detail/:id",
    element: PurchasingDetailPage,
    permission: "purchasing.read",
  },

  {
    path: "stock-movements",
    element: StockMovementsPage,
    permission: "stock_movement.read",
  },
  {
    path: "color-kitchens",
    element: ColorKitchensPage,
    permission: "color_kitchen_batch.read",
  },
  {
    path: "color-kitchens/detail/:id",
    element: ColorKitchenDetailPage,
    permission: "color_kitchen_batch.read",
  },
  {
    path: "stock-opnames",
    element: StockOpnamePage,
    permission: "stock_opname.read",
  },

  //   {
  //     path: "reports/purchasings",
  //     element: PurchasingReportsPage,
  //     permission: "dashboard.read",
  //   },
];
