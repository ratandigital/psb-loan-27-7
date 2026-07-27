"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const navLinks = [
  { href: "/upload", label: "📤 রিপোর্ট আপলোড" },
  { href: "/dashboard", label: "📊 ড্যাশবোর্ড" },
  { href: "/employee/list", label: "👥 কর্মী তালিকা" },
  { href: "/employee/upload", label: "➕ কর্মী আপলোড" },
  { href: "/employee/manage", label: "⚙️ কর্মী ম্যানেজ" },
  { href: "/branch-report", label: "🏢 শাখা রিপোর্ট" },
  { href: "/branch-report/manage", label: "🗂 শাখা ম্যানেজ" },
  { href: "/monthly-report", label: "📅 মাসিক রিপোর্ট" },
  { href: "/tomorrow-alert", label: "⚠️ খেলাপি এলার্ট" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  const router = useRouter();
  const pathname = usePathname();

  /* ✅ Auth + Alert Fetch */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await res.json();

        setIsLoggedIn(data.loggedIn);
        setRole(data.role || null);

        if (data.loggedIn) {
          try {
            const resAlert = await fetch("/api/loan/tomorrow-alert", {
              cache: "no-store",
            });

            const alertJson = await resAlert.json();

            if (alertJson.success && alertJson.data) {
              const total = alertJson.data.reduce(
                (sum, fa) => sum + fa.totalLoan,
                0
              );
              setAlertCount(total);
            } else {
              setAlertCount(0);
            }
          } catch {
            setAlertCount(0);
          }
        }
      } catch {
        setIsLoggedIn(false);
        setRole(null);
        setAlertCount(0);
      }
    };

    checkAuth();
  }, [pathname]);

  /* ✅ Browser Tab Alert Count */
  useEffect(() => {
    if (alertCount > 0) {
      document.title = `(${alertCount}) LoanTrack`;
    } else {
      document.title = "LoanTrack";
    }
  }, [alertCount]);

  /* ✅ Logout */
  const handleLogout = async () => {
    await fetch("/api/auth/logout");
    setIsLoggedIn(false);
    setRole(null);
    setAlertCount(0);
    router.push("/login");
  };

  /* ✅ Restricted Links */
  const restrictedLinks = ["/branch-report", "/upload", "/employee/upload"];

  const filteredLinks = navLinks.filter((link) => {
    if (!isLoggedIn) return false;

    const isRestricted = restrictedLinks.some((path) =>
      link.href.startsWith(path)
    );

    if (isRestricted) {
      return role === "Branch Manager" || role === "Admin";
    }

    return true;
  });

  return (
    <nav className="sticky top-0 z-50 bg-black/70 backdrop-blur-lg border-b border-white/10 shadow-lg">
      <div className="flex items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2"
        >
          <span className="text-2xl">🏦</span>
          <span className="text-white font-bold text-xl tracking-wide">
            LoanTrack
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          {filteredLinks.map((link) => {
            const isActive = pathname === link.href;
            const isAlertLink = link.href === "/tomorrow-alert";
            const hasAlert = isAlertLink && alertCount > 0;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative transition px-2 py-1 rounded-md ${
                  hasAlert
                    ? "text-red-500 font-bold animate-pulse"
                    : isActive
                    ? "text-yellow-400"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}

                {/* ✅ Alert Badge */}
                {hasAlert && (
                  <span className="absolute -top-2 -right-3 bg-red-600 shadow-lg shadow-red-500/50 text-white text-xs px-1.5 py-0.5 rounded-full animate-bounce">
                    {alertCount}
                  </span>
                )}
              </Link>
            );
          })}

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              🚪 লগআউট
            </button>
          ) : (
            <Link
              href="/login"
              className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-4 py-2 rounded-xl text-sm font-bold transition shadow-md"
            >
              🔐 লগইন
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-white p-2 rounded-md hover:bg-white/10 transition"
        >
          {menuOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 flex flex-col gap-2 border-t border-white/10">
          {filteredLinks.map((link) => {
            const isActive = pathname === link.href;
            const isAlertLink = link.href === "/tomorrow-alert";
            const hasAlert = isAlertLink && alertCount > 0;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`relative px-3 py-2.5 rounded-xl text-sm transition ${
                  hasAlert
                    ? "bg-red-600/20 text-red-400 font-bold animate-pulse"
                    : isActive
                    ? "bg-white/10 text-yellow-400"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}

                {hasAlert && (
                  <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {alertCount}
                  </span>
                )}
              </Link>
            );
          })}

          {isLoggedIn ? (
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="mt-2 bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              🚪 লগআউট
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-4 py-2 rounded-xl text-sm font-bold text-center transition"
            >
              🔐 লগইন
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}