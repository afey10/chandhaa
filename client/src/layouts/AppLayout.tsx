import React, { useState } from "react";
import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Anchor,
  Users,
  UserCircle,
  LogOut,
  ScrollText,
  Settings,
  ChevronDown,
  LayoutGrid,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { publicFileUrl } from "../api/rpc";

interface ModuleItem {
  to: string;
  label: string;
  end?: boolean;
  gated?: boolean; // only shown to admins / users with add permission
}

interface ModuleDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  dashboard: string;
  items: ModuleItem[];
}

const MODULES: ModuleDef[] = [
  {
    key: "vehicles",
    label: "Vehicles",
    icon: Car,
    dashboard: "/vehicles",
    items: [
      { to: "/vehicles", label: "Dashboard", end: true },
      { to: "/vehicles/list", label: "Vehicle List" },
      { to: "/vehicles/new", label: "Add Vehicle", gated: true },
      { to: "/vehicles/categories", label: "Categories" },
    ],
  },
  {
    key: "vessels",
    label: "Vessels",
    icon: Anchor,
    dashboard: "/vessels",
    items: [
      { to: "/vessels", label: "Dashboard", end: true },
      { to: "/vessels/list", label: "Vessel List" },
      { to: "/vessels/new", label: "Add Vessel", gated: true },
      { to: "/vessels/categories", label: "Categories" },
    ],
  },
  {
    key: "bidheyseenge",
    label: "Bidheyseenge",
    icon: Users,
    dashboard: "/bidheyseenge",
    items: [
      { to: "/bidheyseenge", label: "Dashboard", end: true },
      { to: "/bidheyseenge/foreigners", label: "Foreigner List" },
      { to: "/bidheyseenge/foreigners/add", label: "Add Foreigner", gated: true },
    ],
  },
];

function useCurrentModule(): ModuleDef | undefined {
  const location = useLocation();
  return MODULES.find((m) => location.pathname === m.dashboard || location.pathname.startsWith(m.dashboard + "/"));
}

function NavItem({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/90"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-3 pt-4 pb-1 text-[10px] font-mono-reg uppercase tracking-widest text-white/35">{children}</div>;
}

/** Row of module icons for switching between Vehicles / Vessels / Bidheyseenge. */
function ModuleSwitcherRow({ currentKey, onNavigate }: { currentKey?: string; onNavigate?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex gap-2 px-3 py-3">
      {MODULES.map((m) => {
        const Icon = m.icon;
        const active = m.key === currentKey;
        return (
          <button
            key={m.key}
            onClick={() => {
              navigate(m.dashboard);
              onNavigate?.();
            }}
            title={m.label}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors ${
              active ? "bg-gold-500/15 text-gold-400" : "text-white/50 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            <Icon size={18} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [switcherSheetOpen, setSwitcherSheetOpen] = useState(false);
  const navigate = useNavigate();
  const currentModule = useCurrentModule();

  const canAdd = user?.role === "admin" || user?.canAddRecords;

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
    }
  };

  const visibleItems = (m: ModuleDef) => m.items.filter((i) => !i.gated || canAdd);

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950">
      <div
        className="flex items-center gap-3 px-4 py-5 border-b border-white/10"
        style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}
      >
        <img src="/police-logo.png" alt="Maldives Police Service" className="h-11 w-auto shrink-0" />
        <div className="leading-tight">
          <div className="font-display text-sm font-semibold text-white">Tha. Veymandoo</div>
          <div className="text-[11px] text-white/50">Police Station Dhaftharu</div>
        </div>
      </div>

      <div className="border-b border-white/10">
        <ModuleSwitcherRow currentKey={currentModule?.key} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <NavItem to="/dashboard" icon={<LayoutDashboard size={17} />} label="Home" end />

        {currentModule && (
          <>
            <SectionLabel>{currentModule.label}</SectionLabel>
            <div className="space-y-1">
              {visibleItems(currentModule).map((item) => {
                const Icon = currentModule.icon;
                return <NavItem key={item.to} to={item.to} icon={<Icon size={17} />} label={item.label} end={item.end} />;
              })}
            </div>
          </>
        )}

        <SectionLabel>Account</SectionLabel>
        <div className="space-y-1">
          <NavItem to="/profile" icon={<UserCircle size={17} />} label="Profile" />
          {user?.role === "admin" && <NavItem to="/audit-log" icon={<ScrollText size={17} />} label="Audit Log" />}
          {user?.role === "admin" && <NavItem to="/settings" icon={<Settings size={17} />} label="Settings" />}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={17} />
          Log Out
        </button>
      </div>
    </div>
  );

  // Mobile bottom bar: the current module's own pages, or (when not inside a
  // module - e.g. on the hub/profile/settings) the module switcher itself.
  const bottomBarItems = currentModule ? visibleItems(currentModule) : [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f7fb]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{sidebar}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-16 shrink-0 items-center justify-between border-b border-[#e5e8f0] bg-white px-4"
          style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(4rem + env(safe-area-inset-top))" }}
        >
          <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
            <img src="/police-logo.png" alt="" className="h-8 w-auto" />
            <span className="font-display text-sm font-semibold text-navy-900">
              {currentModule ? currentModule.label : "Dhaftharu"}
            </span>
          </Link>
          <div className="hidden font-display text-base font-semibold text-navy-900 lg:block">
            Vehicles &amp; Vessels Dhaftharu
          </div>

          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-[#e5e8f0] py-1 pl-1 pr-3 hover:bg-gray-50"
            >
              {user?.profilePicture ? (
                <img src={publicFileUrl(user.profilePicture) || ""} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-800 text-xs font-semibold text-white">
                  {user?.fullName?.slice(0, 1) || "U"}
                </div>
              )}
              <div className="hidden text-left sm:block">
                <div className="text-sm font-medium leading-tight text-navy-900">{user?.fullName}</div>
                <div className="text-[11px] leading-tight text-gray-500">{user?.serviceNumber}</div>
              </div>
              <ChevronDown size={15} className="text-gray-400" />
            </button>

            {profileMenuOpen && (
              <div
                className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-[#e5e8f0] bg-white shadow-lg"
                onMouseLeave={() => setProfileMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserCircle size={16} /> My Profile
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate("/audit-log");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ScrollText size={16} /> Audit Log
                  </button>
                )}
                {user?.role === "admin" && (
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate("/settings");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings size={16} /> Settings
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6">{children}</main>

        {/* Mobile bottom navigation */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#e5e8f0] bg-white lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {currentModule ? (
            <>
              {bottomBarItems.map((item) => {
                const Icon = currentModule.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                        isActive ? "text-navy-900" : "text-gray-400"
                      }`
                    }
                  >
                    <Icon size={19} />
                    {item.label}
                  </NavLink>
                );
              })}
              <button
                onClick={() => setSwitcherSheetOpen(true)}
                className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-gray-400"
              >
                <LayoutGrid size={19} />
                Modules
              </button>
            </>
          ) : (
            MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => navigate(m.dashboard)}
                  className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-gray-400"
                >
                  <Icon size={19} />
                  {m.label}
                </button>
              );
            })
          )}
        </nav>
      </div>

      {/* Module switcher bottom sheet (mobile) */}
      {switcherSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSwitcherSheetOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-navy-950 p-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-white">Switch Module</span>
              <button onClick={() => setSwitcherSheetOpen(false)} className="text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <ModuleSwitcherRow currentKey={currentModule?.key} onNavigate={() => setSwitcherSheetOpen(false)} />
            <button
              onClick={() => {
                navigate("/dashboard");
                setSwitcherSheetOpen(false);
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5"
            >
              <LayoutDashboard size={16} /> Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
