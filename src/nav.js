import {
  LayoutDashboard, Package, FolderTree, Tag, Boxes, ShoppingCart, Undo2,
  Ticket, Gift, Zap, Users, Star, FileText, Megaphone, Image, Percent,
  Truck, CreditCard, BarChart3, TrendingUp, ShieldCheck, Bell, ScrollText,
  KeyRound, Settings,
} from "lucide-react";

export const NAV = [
  {
    group: null,
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    group: "Catalog",
    items: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/categories", label: "Categories", icon: FolderTree },
      { to: "/brands", label: "Brands", icon: Tag },
      { to: "/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    group: "Sales",
    items: [
      { to: "/orders", label: "Orders", icon: ShoppingCart },
      { to: "/returns", label: "Returns", icon: Undo2 },
      { to: "/coupons", label: "Coupons", icon: Ticket },
      { to: "/gift-cards", label: "Gift Cards", icon: Gift },
      { to: "/flash-sales", label: "Flash Sales", icon: Zap },
    ],
  },
  {
    group: "Customers",
    items: [
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    group: "Content",
    items: [
      { to: "/cms", label: "CMS", icon: FileText },
      { to: "/marketing", label: "Marketing", icon: Megaphone },
      { to: "/banners", label: "Hero & Banners", icon: Image },
    ],
  },
  {
    group: "Finance",
    items: [
      { to: "/taxes", label: "Taxes", icon: Percent },
      { to: "/shipping", label: "Shipping", icon: Truck },
      { to: "/payment-settings", label: "Payment Settings", icon: CreditCard },
    ],
  },
  {
    group: "Insights",
    items: [
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/analytics", label: "Analytics", icon: TrendingUp },
    ],
  },
  {
    group: "System",
    items: [
      { to: "/user-roles", label: "User Roles", icon: ShieldCheck },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/audit-logs", label: "Audit Logs", icon: ScrollText },
      { to: "/api-management", label: "API Management", icon: KeyRound },
      { to: "/settings", label: "System Settings", icon: Settings },
    ],
  },
];
