"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const links = [{ href:"/home", label:"Home" }, { href:"/coach", label:"Coach" }];
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div className="app-shell"><header className="mb-8 flex items-center justify-between"><Link href="/home" className="font-[Space_Grotesk] text-lg font-bold">FORM<span className="text-accent">{`//`}</span>COACH</Link><nav className="hidden gap-2 sm:flex">{links.map(link => <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm ${pathname.startsWith(link.href) ? "bg-accent/20 text-white" : "text-white/50"}`}>{link.label}</Link>)}</nav></header>{children}<nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-[#1B1F29]/95 px-5 py-3 backdrop-blur sm:hidden"><div className="mx-auto flex max-w-sm justify-around">{links.map(link => <Link key={link.href} href={link.href} className={`min-h-11 px-4 py-2 text-sm ${pathname.startsWith(link.href) ? "text-white" : "text-white/50"}`}>{link.label}</Link>)}<span className="px-4 py-2 text-sm text-white/30">Progress</span></div></nav></div>;
}
