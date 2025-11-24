import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GlobalFilterProvider } from "./contexts/GlobalFilterContext.jsx";
import "./assets/styles/tailwind.css";
import {
  Dashboard,
  AccountsPage,
  DesignsPage,
  DesignTypesPage,
  SuppliersPage,
  PurchasingsPage,
  ProductsPage,
  StockMovementsPage,
  ColorKitchensPage,
  StockOpnamePage,
  PurchasingReportsPage,
  OverviewNew,
  DashboardPurchasing,
  DashboardColorKitchen,
  ColorKitchenDetailPage,
  PurchasingDetailPage,
} from "./pages";
import GlobalFilterDrawer from "./components/common/GlobalFilterDrawer.jsx";
import AccountCategoryBoard from "./pages/account/AccountCategoryBoard.jsx";
import { MainLayout } from "./layouts/index.js";
import { FilterServiceProvider } from "./contexts/FilterServiceContext.jsx";
import LoginPage from "./pages/auth/Loginpage.jsx";
import { useAuthStore } from "./stores/useAuthStore.js";

function PublicRoute({ children }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  // ✅ Jika sudah login, redirect ke dashboard
  if (accessToken && user) {
    // return <Navigate to="/login" replace />;
    return <Navigate to="/dashboard/overview" replace />;
  }

  return children;
}

function ProtectedRoute({ children }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  // ✅ Cek keduanya harus ada
  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <GlobalFilterProvider>
        <FilterServiceProvider>
          <Routes>
            {/* Public */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* PROTECTED ROUTES */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Inside MainLayout: all protected pages */}
              <Route path="dashboard/overview" element={<OverviewNew />} />
              <Route
                path="dashboard/purchasings"
                element={<DashboardPurchasing />}
              />
              <Route
                path="dashboard/color-kitchens"
                element={<DashboardColorKitchen />}
              />

              <Route path="products" element={<ProductsPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />

              <Route path="accounts" element={<AccountsPage />} />
              <Route
                path="accounts/category-board"
                element={<AccountCategoryBoard />}
              />

              <Route path="designs" element={<DesignsPage />} />
              <Route path="design-types" element={<DesignTypesPage />} />

              <Route path="purchasings" element={<PurchasingsPage />} />
              <Route
                path="purchasings/detail/:id"
                element={<PurchasingDetailPage />}
              />

              <Route path="stock-movements" element={<StockMovementsPage />} />
              <Route path="color-kitchens" element={<ColorKitchensPage />} />
              <Route
                path="color-kitchens/detail/:id"
                element={<ColorKitchenDetailPage />}
              />
              <Route path="stock-opnames" element={<StockOpnamePage />} />

              <Route
                path="reports/purchasings"
                element={<PurchasingReportsPage />}
              />
            </Route>

            {/* Forbidden */}
            <Route path="403" element={<Forbidden />} />

            {/* Redirect all unknown routes */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </FilterServiceProvider>
      </GlobalFilterProvider>
    </BrowserRouter>
  );
}
