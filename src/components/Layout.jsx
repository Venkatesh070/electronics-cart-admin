import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, LogOut } from "lucide-react";
import { NAV } from "../nav";
import clsx from "clsx";
import { useAuth } from "../auth/AuthContext";
import { settingsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { initials, mediaUrl, titleCase } from "../utils/format";
import { useEffect } from "react";

function pageTitleFromPath(pathname) {
  if (pathname === "/products/new") return "Add Product";
  if (/^\/products\/[^/]+\/edit$/.test(pathname)) return "Edit Product";
  if (pathname === "/categories/new") return "Add Category";
  if (/^\/categories\/[^/]+\/edit$/.test(pathname)) return "Edit Category";
  if (pathname === "/brands/new") return "Add Brand";
  if (/^\/brands\/[^/]+\/edit$/.test(pathname)) return "Edit Brand";
  if (pathname === "/flash-sales/new") return "Create Flash Sale";
  if (/^\/flash-sales\/[^/]+\/edit$/.test(pathname)) return "Edit Flash Sale";
  if (pathname === "/marketing/new") return "Create Campaign";
  if (/^\/marketing\/[^/]+\/edit$/.test(pathname)) return "Edit Campaign";
  for (const g of NAV) {
    for (const item of g.items) {
      if (item.end ? pathname === item.to : pathname.startsWith(item.to)) return item.label;
    }
  }
  return "Dashboard";
}

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: settingsRes, reload: reloadSettings } = useAsync(() => settingsApi.get(), []);
  const title = pageTitleFromPath(location.pathname);
  const name = user?.name || "Admin";
  const role = titleCase(user?.role || "admin");
  const storeName = settingsRes?.data?.storeName || "Electronics Cart";
  const logo = settingsRes?.data?.logo;

  useEffect(() => {
    const onChange = () => reloadSettings();
    window.addEventListener("store-settings-changed", onChange);
    return () => window.removeEventListener("store-settings-changed", onChange);
  }, [reloadSettings]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="w-60 shrink-0 bg-sidebar text-white flex flex-col h-screen sticky top-0">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebarline">
          {logo ? (
            <img src={mediaUrl(logo)} alt="" className="w-7 h-7 rounded object-contain bg-white/10" />
          ) : (
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center relative">
              <span className="font-display font-bold text-xs">EC</span>
              <span className="absolute -right-0.5 -top-0.5 w-1.5 h-1.5 rounded-full bg-success ring-2 ring-sidebar" />
            </div>
          )}
          <div className="leading-tight min-w-0">
            <div className="font-display font-semibold text-sm truncate">{storeName}</div>
            <div className="text-[10px] text-white/40 font-mono tracking-wide">ADMIN CONSOLE</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-3">
          {NAV.map((g, gi) => (
            <div key={gi} className="mb-4">
              {g.group && (
                <div className="px-2 mb-1 text-[10px] font-mono uppercase tracking-wider text-white/35">
                  {g.group}
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {g.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors",
                        isActive
                          ? "bg-primary text-white"
                          : "text-white/65 hover:bg-sidebarhover hover:text-white"
                      )
                    }
                  >
                    <item.icon size={15} strokeWidth={2} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebarline">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
            <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center text-[11px] font-semibold">
              {initials(name)}
            </div>
            <div className="leading-tight flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{name}</div>
              <div className="text-[10px] text-white/40 truncate">{role}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-sidebarhover text-white/50 hover:text-white"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 border-b border-border bg-surface flex items-center justify-between px-6 sticky top-0 z-30">
          <div>
            <div className="text-[11px] font-mono text-muted tracking-wide">ADMIN / {title.toUpperCase()}</div>
            <div className="font-display font-semibold text-ink text-sm">{title}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                placeholder="Search orders, products, customers…"
                className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-md bg-bg w-72 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="relative w-9 h-9 rounded-md border border-border bg-white flex items-center justify-center hover:bg-bg"
            >
              <Bell size={15} className="text-ink" />
            </button>
            <div className="w-9 h-9 rounded-full bg-primary-light text-primary-dark flex items-center justify-center text-xs font-semibold border border-primary/20">
              {initials(name)}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
