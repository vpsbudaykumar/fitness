"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Home,
  Dumbbell,
  ShoppingBag,
  ChartNoAxesCombined,
  MessageCircle,
  User,
} from "lucide-react";

const links = [
  {
    href: "/home",
    label: "Home",
    Icon: Home,
  },
  {
    href: "/workout",
    label: "Workout",
    Icon: Dumbbell,
  },
  {
    href: "/shop",
    label: "Shop",
    Icon: ShoppingBag,
  },
  {
    href: "/progress",
    label: "Progress",
    Icon: ChartNoAxesCombined,
  },
  {
    href: "/coach",
    label: "Coach",
    Icon: MessageCircle,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === "/" || pathname === "/home";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const profileActive = isActive(
    pathname,
    "/profile"
  );

  return (
    <div className="app-shell">
      <header className="app-nav">
        <Link
          href="/home"
          className="brand"
          aria-label="FORM Coach home"
        >
          <span>FORM</span>
          <span className="brand-accent">{`//`}</span>
          <span>COACH</span>
        </Link>

        <div className="flex items-center gap-2">
          <nav
            aria-label="Primary navigation"
            className="nav-links hidden sm:flex"
          >
            {links.map(({ href, label }) => {
              const active = isActive(
                pathname,
                href
              );

              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link ${
                    active ? "active" : ""
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/profile"
            aria-label="Profile"
            title="Profile"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
              profileActive
                ? "border-[#08A6A6]/25 bg-[#08A6A6]/10 text-[#078B8B]"
                : "border-[#E7ECEA] bg-white text-[#66727F] shadow-sm hover:border-[#08A6A6]/30 hover:bg-[#F1F6F5] hover:text-[#078B8B]"
            }`}
          >
            <User
              size={19}
              strokeWidth={1.8}
            />
          </Link>
        </div>
      </header>

      <main className="min-h-[calc(100vh-76px)]">
        {children}
      </main>

      <nav
        aria-label="Mobile primary navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E7ECEA] bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(23,33,43,0.06)] backdrop-blur-xl sm:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {links.map(
            ({ href, label, Icon }) => {
              const active = isActive(
                pathname,
                href
              );

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={
                    active ? "page" : undefined
                  }
                  className={`group flex min-h-[58px] flex-col items-center justify-center rounded-xl px-1 transition ${
                    active
                      ? "bg-[#08A6A6]/10 text-[#078B8B]"
                      : "text-[#8A959F] hover:bg-[#F1F6F5] hover:text-[#17212B]"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.8}
                    className={
                      active
                        ? "text-[#08A6A6]"
                        : "text-[#8A959F] group-hover:text-[#17212B]"
                    }
                  />

                  <span
                    className={`mt-1 text-[10px] font-semibold transition ${
                      active
                        ? "text-[#078B8B]"
                        : "text-[#8A959F]"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            }
          )}
        </div>
      </nav>
    </div>
  );
}