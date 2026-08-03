import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Returns from "./pages/Returns";
import Coupons from "./pages/Coupons";
import GiftCards from "./pages/GiftCards";
import FlashSales from "./pages/FlashSales";
import Customers from "./pages/Customers";
import Reviews from "./pages/Reviews";
import CMS from "./pages/CMS";
import Marketing from "./pages/Marketing";
import Banners from "./pages/Banners";
import Taxes from "./pages/Taxes";
import Shipping from "./pages/Shipping";
import PaymentSettings from "./pages/PaymentSettings";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import UserRoles from "./pages/UserRoles";
import Notifications from "./pages/Notifications";
import AuditLogs from "./pages/AuditLogs";
import ApiManagement from "./pages/ApiManagement";
import SystemSettings from "./pages/SystemSettings";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/gift-cards" element={<GiftCards />} />
          <Route path="/flash-sales" element={<FlashSales />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/cms" element={<CMS />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/banners" element={<Banners />} />
          <Route path="/taxes" element={<Taxes />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/payment-settings" element={<PaymentSettings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/user-roles" element={<UserRoles />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/api-management" element={<ApiManagement />} />
          <Route path="/settings" element={<SystemSettings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
