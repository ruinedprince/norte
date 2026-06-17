"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "Painel" },
  { href: "/transactions", label: "Transações" },
  { href: "/categories", label: "Categorias" },
  { href: "/accounts", label: "Contas" },
  { href: "/investments", label: "Investimentos" },
  { href: "/analysis", label: "Análise" },
  { href: "/rules", label: "Regras" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    cn(
      "rounded-md px-3 py-1.5 transition-colors duration-150",
      isActive(href)
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-primary"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <polygon
              points="15.5 8.5 11 11 8.5 15.5 13 13 15.5 8.5"
              fill="currentColor"
              stroke="none"
            />
          </svg>
          <span className="font-medium tracking-wide">Norte</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-6 py-3 text-sm md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={linkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
