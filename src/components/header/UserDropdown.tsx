"use client";

import React, { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

type CurrentUser = {
  name: string;
  email: string;
  role: string;
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  sales_executive: "Sales Executive",
};

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => response.json())
      .then((profile) => {
        if (profile?.name) {
          setUser({
            name: profile.name,
            email: profile.email || "",
            role: profile.role || "",
          });
        }
      })
      .catch(() => setUser(null));
  }, []);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setIsOpen((previous) => !previous);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    closeDropdown();
    await signOut({ callbackUrl: "/signin" });
  }

  const displayName = user?.name || "Account";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-label="Open user profile menu"
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          {initials || "U"}
        </span>
        <span className="mr-1 block max-w-36 truncate font-medium text-theme-sm">
          {displayName}
        </span>
        <svg
          className={`stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${isOpen ? "rotate-180" : ""}`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M4.3125 8.65625L9 13.3437L13.6875 8.65625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="border-b border-gray-200 px-3 pb-3 dark:border-gray-800">
          <span className="block truncate font-medium text-gray-700 text-theme-sm dark:text-gray-200">
            {displayName}
          </span>
          {user?.email && (
            <span className="mt-0.5 block truncate text-theme-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </span>
          )}
          {user?.role && (
            <span className="mt-1 block text-theme-xs capitalize text-gray-500 dark:text-gray-400">
              {roleLabels[user.role] || user.role.replaceAll("_", " ")}
            </span>
          )}
        </div>

        <ul className="flex flex-col gap-1 pt-3">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12c0 2.1526.8002 4.1184 2.1194 5.616C6.1728 15.3096 8.2485 13.5955 10.7246 13.5955h2.55c2.4763 0 4.5519 1.7145 5.1054 4.0212C19.6996 16.119 20.5 14.153 20.5 12c0-4.6944-3.8056-8.5-8.5-8.5ZM17.0246 18.8566v-.0111c0-2.0711-1.6789-3.75-3.75-3.75h-2.55c-2.07106 0-3.75 1.6789-3.75 3.75v.0105C8.3822 19.8895 10.1198 20.5 12 20.5c1.8798 0 3.6171-.6102 5.0246-1.6434ZM2 12C2 6.47715 6.47715 2 12 2s10 4.47715 10 10-4.47715 10-10 10S2 17.5228 2 12Z" />
              </svg>
              My profile
            </DropdownItem>
          </li>
        </ul>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-left font-medium text-gray-700 group text-theme-sm hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <svg className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M15.1007 19.247c-.4142 0-.75-.3358-.75-.75v-4.252h-1.5v4.252c0 1.2426 1.0074 2.25 2.25 2.25h3.4c1.2427 0 2.25-1.0074 2.25-2.25V5.4961c0-1.24265-1.0074-2.25-2.25-2.25h-3.4c-1.2426 0-2.25 1.00735-2.25 2.25v4.2489h1.5V5.4961c0-.41422.3358-.75.75-.75h3.4c.4142 0 .75.33578.75.75V18.497c0 .4142-.3358.75-.75.75h-3.4ZM3.2507 11.9984c0 .216.0913.4112.2374.5481l4.6067 4.6096c.2928.2929.7677.2931 1.0607.0003.293-.2928.2931-.7677.0003-1.0607l-3.3447-3.3468h10.1896c.4142 0 .75-.3357.75-.75s-.3358-.75-.75-.75H5.8153l3.3406-3.3429c.2928-.293.2926-.7679-.0004-1.0607-.293-.2928-.7679-.2926-1.0607.0004l-4.5717 4.575c-.1664.1375-.2724.3457-.2724.5784Z" />
          </svg>
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </Dropdown>
    </div>
  );
}
