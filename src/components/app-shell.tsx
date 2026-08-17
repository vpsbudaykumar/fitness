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

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

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

        <nav
          aria-label="Primary navigation"
          className="nav-links hidden sm:flex"
        >
          {links.map(({ href, label }) => {
            const active = isActive(pathname, href);

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
      </header>

      <main className="min-h-[calc(100vh-76px)]">
        {children}
      </main>

      <nav
        aria-label="Mobile primary navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#14171F]/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {links.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-[58px] flex-col items-center justify-center rounded-xl px-1 transition ${
                  active
                    ? "text-white"
                    : "text-[#565C6C]"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={1.7}
                  className={
                    active
                      ? "text-[#3D5AFE]"
                      : "text-[#8B90A0] group-hover:text-white"
                  }
                />

                <span
                  className={`mt-1 text-[10px] font-medium transition ${
                    active
                      ? "text-[#3D5AFE]"
                      : "text-[#565C6C] group-hover:text-[#8B90A0]"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}