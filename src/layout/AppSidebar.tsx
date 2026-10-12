"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
  }[];
};

type MenuType = "main" | "others";

type SubmenuPosition = {
  type: MenuType;
  index: number;
};

type SubmenuState = SubmenuPosition & {
  pathname: string;
  manuallyClosed?: boolean;
};

/*
 * Cloud Analytics CRM navigation
 *
 * NOTE:
 * CRM routes such as /leads, /opportunities, /reports, etc.
 * will be created in their corresponding development steps.
 *
 * Until those pages exist, the existing working dashboard routes
 * are used as temporary destinations so the sidebar does not create
 * broken links.
 */
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [
      {
        name: "Overview",
        path: "/",
      },
    ],
  },

  {
    icon: <UserCircleIcon />,
    name: "Sales",
    subItems: [
      {
        name: "Leads",
        path: "/leads",
      },
      {
        name: "Opportunities & Pipelines",
        path: "/opportunities",
      },
    
      {
        name: "Follow-ups",
        path: "/calendar",
      },
    ],
  },

  {
    icon: <CalenderIcon />,
    name: "Meetings",
    path: "/calendar",
  },

  {
    icon: <TableIcon />,
    name: "Clients",
    path: "/basic-tables",
  },

  {
    icon: <ListIcon />,
    name: "Tasks",
    path: "/form-elements",
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Reports",
    subItems: [
      {
        name: "Sales Reports",
        path: "/line-chart",
      },
      {
        name: "Pipeline Reports",
        path: "/bar-chart",
      },
    ],
  },

  {
    icon: <BoxCubeIcon />,
    name: "Management",
    subItems: [
      {
        name: "Team",
        path: "/team",
      },
      {
        name: "Documents",
        path: "/blank",
      },
      {
        name: "Settings",
        path: "/profile",
      },
    ],
  },

  {
    icon: <PageIcon />,
    name: "Workspace",
    subItems: [
      {
        name: "My Profile",
        path: "/profile",
      },
      {
        name: "Calendar",
        path: "/calendar",
      },
    ],
  },
];

/**
 * Finds the submenu that contains the current pathname.
 *
 * This avoids synchronously updating submenu state inside
 * a pathname effect and keeps the existing active-submenu behavior.
 */
const getActiveSubmenu = (
  pathname: string
): SubmenuPosition | null => {
  const menuGroups: {
    type: MenuType;
    items: NavItem[];
  }[] = [
    {
      type: "main",
      items: navItems,
    },
    {
      type: "others",
      items: othersItems,
    },
  ];

  for (const group of menuGroups) {
    for (let index = 0; index < group.items.length; index++) {
      const nav = group.items[index];

      if (
        nav.subItems?.some(
          (subItem) => subItem.path === pathname
        )
      ) {
        return {
          type: group.type,
          index,
        };
      }
    }
  }

  return null;
};

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
  } = useSidebar();

  const pathname = usePathname();

  const [submenuState, setSubmenuState] =
    useState<SubmenuState | null>(null);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/session").then(response => response.json()).then(session => setRole(session?.user?.role || "")).catch(() => setRole(""));
  }, []);

  const [subMenuHeight, setSubMenuHeight] = useState<
    Record<string, number>
  >({});

  const subMenuRefs = useRef<
    Record<string, HTMLDivElement | null>
  >({});

  /**
   * Determine the submenu associated with the current route.
   */
  const activeSubmenu = useMemo(
    () => getActiveSubmenu(pathname),
    [pathname]
  );

  /**
   * Determine which submenu should be visible.
   *
   * Manual interaction has priority on the current pathname.
   * Otherwise, the submenu containing the active pathname opens.
   */
  const openSubmenu = useMemo(() => {
    if (submenuState?.pathname === pathname) {
      if (submenuState.manuallyClosed) {
        return null;
      }

      return {
        type: submenuState.type,
        index: submenuState.index,
      };
    }

    return activeSubmenu;
  }, [submenuState, pathname, activeSubmenu]);

  const isActive = (path: string) => path === pathname;

  const handleSubmenuToggle = (
    index: number,
    menuType: MenuType
  ) => {
    const currentlyOpen =
      openSubmenu?.type === menuType &&
      openSubmenu?.index === index;

    if (currentlyOpen) {
      setSubmenuState({
        type: menuType,
        index,
        pathname,
        manuallyClosed: true,
      });

      return;
    }

    setSubmenuState({
      type: menuType,
      index,
      pathname,
      manuallyClosed: false,
    });
  };

  useEffect(() => {
    /**
     * Measure the opened submenu so the existing transition
     * and height animation continue to work.
     */
    if (openSubmenu === null) {
      return;
    }

    const key = `${openSubmenu.type}-${openSubmenu.index}`;
    const submenuElement = subMenuRefs.current[key];

    if (submenuElement) {
      const height = submenuElement.scrollHeight;

      setSubMenuHeight((prevHeights) => {
        if (prevHeights[key] === height) {
          return prevHeights;
        }

        return {
          ...prevHeights,
          [key]: height,
        };
      });
    }
  }, [openSubmenu]);

  const renderMenuItems = (
    items: NavItem[],
    menuType: MenuType
  ) => (
    <ul className="flex flex-col gap-4">
      {items.filter(nav => nav.name !== "Management" || role === "admin" || role === "super_admin").map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() =>
                handleSubmenuToggle(index, menuType)
              }
              className={`menu-item group ${
                openSubmenu?.type === menuType &&
                openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`${
                  openSubmenu?.type === menuType &&
                  openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>

              {(isExpanded ||
                isHovered ||
                isMobileOpen) && (
                <span className="menu-item-text">
                  {nav.name}
                </span>
              )}

              {(isExpanded ||
                isHovered ||
                isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path)
                    ? "menu-item-active"
                    : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>

                {(isExpanded ||
                  isHovered ||
                  isMobileOpen) && (
                  <span className="menu-item-text">
                    {nav.name}
                  </span>
                )}
              </Link>
            )
          )}

          {nav.subItems &&
            (isExpanded ||
              isHovered ||
              isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[
                    `${menuType}-${index}`
                  ] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? `${
                          subMenuHeight[
                            `${menuType}-${index}`
                          ] ?? 0
                        }px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}

                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              new
                            </span>
                          )}

                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
          ? "w-[290px]"
          : "w-[90px]"
      } ${
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full"
      } lg:translate-x-0`}
      onMouseEnter={() =>
        !isExpanded && setIsHovered(true)
      }
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered
            ? "lg:justify-center"
            : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded ||
          isHovered ||
          isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={175}
                height={50}
              />

              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={175}
                height={50}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded ||
                isHovered ||
                isMobileOpen ? (
                  "Sales"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>

              {renderMenuItems(
                navItems,
                "main"
              )}
            </div>

            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded ||
                isHovered ||
                isMobileOpen ? (
                  "Management"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>

              {renderMenuItems(
                othersItems,
                "others"
              )}
            </div>
          </div>
        </nav>

        {isExpanded ||
        isHovered ||
        isMobileOpen ? (
          <SidebarWidget />
        ) : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
