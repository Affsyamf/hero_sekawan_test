import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Forbidden from "./pages/forbidden/ForbiddenPage.jsx";
import { useEffect } from "react";
import ProtectedRoute from "./components/router/ProtectedRoute.jsx";
import PublicRoute from "./components/router/PublicRoute.jsx";
import { protectedRoutes } from "./config/route.js";
import PermissionRoute from "./components/router/PermissionRoute.jsx";

export default function AppRouter() {
  const initialized = useAuthStore((s) => s.initialized);
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, []);

  if (!initialized) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-gray-500">
        Loading session...
      </div>
    );
  }

  return (
    <BrowserRouter>
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
            {/* AUTO-GENERATED PERMISSION ROUTES */}
            {protectedRoutes.map(({ path, element: Comp, permission }) => (
              <Route
                key={path}
                path={path}
                element={
                  <PermissionRoute permission={permission}>
                    <Comp />
                  </PermissionRoute>
                }
              />
            ))}

            {/* Forbidden */}
            <Route path="403" element={<Forbidden />} />
          </Route>

          {/* Redirect all unknown routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </FilterServiceProvider>
    </BrowserRouter>
  );
}
