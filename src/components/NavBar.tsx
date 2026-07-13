"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Upload" },
  { href: "/dashboard", label: "Executive Dashboard" },
];

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="var(--accent)" />
      <rect x="8" y="8" width="12" height="12" rx="2.5" fill="var(--surface)" />
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <div>
      <div className="h-[3px] w-full bg-[var(--accent)]" />
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-base font-semibold leading-tight text-[var(--foreground)]">
                Portfolio Risk Dashboard
              </p>
              <p className="text-xs leading-tight text-[var(--muted)]">
                Lending &amp; credit risk prototype
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? "rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
                      : "rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[#f2f6fa]"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    </div>
  );
}
