import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Anchor,
  UserCircle,
  LogOut,
  ScrollText,
  Settings,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { publicFileUrl } from "../api/rpc";

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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
    }
  };

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

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <NavItem to="/dashboard" icon={<LayoutDashboard size={17} />} label="Dashboard" end />

        <SectionLabel>Vehicles</SectionLabel>
        <div className="space-y-1">
          <NavItem to="/vehicles" icon={<Car size={17} />} label="Vehicle Dashboard" end />
          <NavItem to="/vehicles/list" icon={<Car size={17} />} label="Vehicle List" />
          {(user?.role === "admin" || user?.canAddRecords) && (
            <NavItem to="/vehicles/new" icon={<Car size={17} />} label="Add Vehicle" />
          )}
          <NavItem to="/vehicles/categories" icon={<Car size={17} />} label="Vehicle Categories" />
        </div>

        <SectionLabel>Vessels</SectionLabel>
        <div className="space-y-1">
          <NavItem to="/vessels" icon={<Anchor size={17} />} label="Vessel Dashboard" end />
          <NavItem to="/vessels/list" icon={<Anchor size={17} />} label="Vessel List" />
          {(user?.role === "admin" || user?.canAddRecords) && (
            <NavItem to="/vessels/new" icon={<Anchor size={17} />} label="Add Vessel" />
          )}
          <NavItem to="/vessels/categories" icon={<Anchor size={17} />} label="Vessel Categories" />
        </div>

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

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f7fb]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{sidebar}</aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-full w-64">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-16 shrink-0 items-center justify-between border-b border-[#e5e8f0] bg-white px-4"
          style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(4rem + env(safe-area-inset-top))" }}
        >
          <button className="rounded-lg p-2 text-navy-900 hover:bg-gray-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
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

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
