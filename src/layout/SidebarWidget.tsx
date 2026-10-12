import Link from "next/link";
import React, { useState } from "react";
import {
  CalenderIcon,
  ListIcon,
  PieChartIcon,
  UserCircleIcon,
} from "../icons/index";

const quickActions = [
  {
    name: "Lead",
    href: "/leads",
    icon: UserCircleIcon,
  },
  {
    name: "Task",
    href: "/tasks",
    icon: ListIcon,
  },
  {
    name: "Meeting",
    href: "/meetings",
    icon: CalenderIcon,
  },
  {
    name: "Report",
    href: "/reports",
    icon: PieChartIcon,
  },
];

export default function SidebarWidget() {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  return (
    <div className="mx-auto mb-6 w-full max-w-[240px] px-1">
      {/* =========================================================
          PREMIUM QUICK TOOLS PANEL
      ========================================================== */}
      <div
        className="
          relative
          overflow-visible
          rounded-[18px]

          border
          border-gray-100/80

          bg-gradient-to-br
          from-white
          via-white
          to-gray-50/70

          px-3
          py-3

          shadow-[0_4px_18px_rgba(15,23,42,0.045)]
          ring-1
          ring-inset
          ring-white/80

          dark:border-gray-800
          dark:bg-gradient-to-br
          dark:from-gray-900
          dark:via-gray-900
          dark:to-gray-950

          dark:shadow-[0_4px_18px_rgba(0,0,0,0.20)]
          dark:ring-gray-800/50
        "
      >
        {/* =======================================================
            PREMIUM TOP ACCENT
        ======================================================== */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            left-5
            right-5
            top-0
            h-px

            bg-gradient-to-r
            from-transparent
            via-brand-500/40
            to-transparent

            dark:via-brand-400/30
          "
        />

        {/* =======================================================
            SUBTLE TOP BRAND GLOW
        ======================================================== */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            left-1/2
            top-0

            h-[55px]
            w-[120px]

            -translate-x-1/2

            rounded-full

            bg-brand-500/[0.025]

            blur-2xl

            dark:bg-brand-400/[0.025]
          "
        />

        {/* =======================================================
            HEADER
        ======================================================== */}
        <div
          className="
            relative
            flex
            items-center
            justify-between

            px-1
            pb-3
          "
        >
          <div className="flex items-center gap-2.5">
            {/* =================================================
                PREMIUM BRAND INDICATOR
            ================================================== */}
            <span
              className="
                relative
                flex
                h-[20px]
                w-[20px]
                items-center
                justify-center

                rounded-[6px]

                border
                border-brand-500/10

                bg-brand-50

                shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]

                dark:border-brand-400/10
                dark:bg-brand-500/[0.07]
              "
            >
              <span
                className="
                  absolute
                  h-[9px]
                  w-[9px]
                  rounded-full

                  bg-brand-500/10
                "
              />

              <span
                className="
                  relative
                  h-[5px]
                  w-[5px]
                  rounded-full

                  bg-brand-500

                  shadow-[0_0_7px_rgba(99,102,241,0.45)]

                  dark:bg-brand-400
                "
              />
            </span>

            {/* =================================================
                TITLE
            ================================================== */}
            <div className="flex flex-col">
              {/* <span
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]

                  text-gray-600

                  dark:text-gray-300
                "
              >
                Quick Tools
              </span> */}

              <span
                className="
                  mt-[2px]

                  text-[8px]
                  font-medium
                  leading-none

                  text-gray-400

                  dark:text-gray-500
                "
              >
                Quick access
              </span>
            </div>
          </div>

          {/* =================================================
              PREMIUM TOOL COUNT
          ================================================== */}
          <div
            className="
              relative
              flex
              h-[20px]
              min-w-[20px]
              items-center
              justify-center

              rounded-full

              border
              border-gray-200/90

              bg-gray-50

              px-1.5

              text-[9px]
              font-semibold
              leading-none

              text-gray-400

              shadow-[inset_0_1px_2px_rgba(15,23,42,0.025)]

              dark:border-gray-700
              dark:bg-gray-800/80
              dark:text-gray-500
            "
          >
            <span className="relative z-10">4</span>
          </div>
        </div>

        {/* =======================================================
            HEADER SEPARATOR
        ======================================================== */}
        <div
          aria-hidden="true"
          className="
            relative
            mb-3
            h-px
            w-full

            bg-gradient-to-r
            from-transparent
            via-gray-200
            to-transparent

            dark:via-gray-800
          "
        />

        {/* =======================================================
            TOOLS GRID
            Layout intentionally unchanged
        ======================================================== */}
        <div
          className="relative w-full"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gridAutoRows: "44px",
            gap: "10px",
            overflow: "visible",
          }}
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isActive = activeAction === action.name;

            return (
              <div
                key={action.name}
                className="
                  group/tool
                  relative
                  flex
                  h-full
                  w-full
                  items-center
                  justify-center
                "
                style={{
                  overflow: "visible",
                }}
                onMouseEnter={() => setActiveAction(action.name)}
                onMouseLeave={() => setActiveAction(null)}
              >
                {/* =================================================
                    TOOLTIP
                    Preserved
                ================================================== */}
                <div
                  aria-hidden={!isActive}
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "calc(100% + 9px)",

                    transform: `translateX(-50%) ${
                      isActive ? "translateY(0)" : "translateY(4px)"
                    }`,

                    zIndex: 99999,
                    pointerEvents: "none",

                    opacity: isActive ? 1 : 0,
                    visibility: isActive ? "visible" : "hidden",

                    whiteSpace: "nowrap",

                    transition:
                      "opacity 160ms ease, transform 160ms ease, visibility 160ms ease",
                  }}
                >
                  <div
                    className="
                      relative

                      rounded-[8px]

                      border
                      border-gray-200/90

                      bg-white

                      px-2.5
                      py-1.5

                      shadow-[0_8px_24px_rgba(15,23,42,0.12)]

                      dark:border-gray-700
                      dark:bg-gray-800
                      dark:shadow-[0_8px_24px_rgba(0,0,0,0.30)]
                    "
                  >
                    <span
                      className="
                        text-[10px]
                        font-medium
                        leading-none

                        text-gray-700

                        dark:text-gray-100
                      "
                    >
                      {action.name}
                    </span>

                    {/* Tooltip Arrow */}
                    <span
                      className="
                        absolute
                        left-1/2
                        top-full

                        h-0
                        w-0

                        -translate-x-1/2

                        border-l-[4px]
                        border-r-[4px]
                        border-t-[4px]

                        border-l-transparent
                        border-r-transparent

                        border-t-white

                        dark:border-t-gray-800
                      "
                    />
                  </div>
                </div>

                {/* =================================================
                    ACTION BUTTON
                    Dimensions preserved: 38 × 38
                ================================================== */}
                <Link
                  href={action.href}
                  aria-label={action.name}
                  className="
                    group/button
                    relative

                    flex
                    h-[38px]
                    w-[38px]
                    shrink-0

                    items-center
                    justify-center

                    rounded-full

                    border
                    border-gray-200/90

                    bg-white

                    text-brand-500

                    shadow-[0_2px_6px_rgba(15,23,42,0.045)]

                    transition-all
                    duration-200
                    ease-out

                    hover:border-brand-500/25
                    hover:bg-brand-50/30
                    hover:shadow-[0_7px_18px_rgba(79,70,229,0.11)]

                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-brand-500/20
                    focus-visible:ring-offset-2

                    active:scale-[0.96]

                    dark:border-gray-700
                    dark:bg-gray-900
                    dark:text-brand-400

                    dark:hover:border-brand-400/25
                    dark:hover:bg-brand-500/[0.055]
                  "
                  style={{
                    transform: isActive
                      ? "translateY(-1.5px)"
                      : "translateY(0)",
                  }}
                >
                  {/* =================================================
                      PREMIUM OUTER HALO
                  ================================================== */}
                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute

                      inset-[-4px]

                      rounded-full

                      border
                      border-brand-500/0

                      opacity-0

                      transition-all
                      duration-200

                      group-hover/button:border-brand-500/15
                      group-hover/button:opacity-100

                      dark:group-hover/button:border-brand-400/15
                    "
                  />

                  {/* =================================================
                      OUTER LIGHT EDGE
                  ================================================== */}
                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute

                      inset-[1px]

                      rounded-full

                      border
                      border-white/90

                      opacity-80

                      dark:border-gray-800
                    "
                  />

                  {/* =================================================
                      INNER BUTTON SURFACE
                  ================================================== */}
                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute

                      inset-[4px]

                      rounded-full

                      border
                      border-gray-100

                      bg-gradient-to-br
                      from-gray-50
                      via-white
                      to-gray-50

                      shadow-[inset_0_1px_2px_rgba(255,255,255,0.95)]

                      transition-all
                      duration-200

                      group-hover/button:border-brand-500/10
                      group-hover/button:from-brand-50/70
                      group-hover/button:via-white
                      group-hover/button:to-brand-50/30

                      dark:border-gray-800
                      dark:from-gray-800
                      dark:via-gray-900
                      dark:to-gray-800

                      dark:group-hover/button:border-brand-400/10
                      dark:group-hover/button:from-brand-500/[0.07]
                      dark:group-hover/button:via-gray-900
                      dark:group-hover/button:to-gray-900
                    "
                  />

                  {/* =================================================
                      SOFT ICON GLOW
                  ================================================== */}
                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute

                      h-[23px]
                      w-[23px]

                      rounded-full

                      bg-brand-500/[0.045]

                      opacity-0
                      scale-75

                      transition-all
                      duration-200

                      group-hover/button:scale-100
                      group-hover/button:opacity-100

                      dark:bg-brand-400/[0.06]
                    "
                  />

                  {/* =================================================
                      ICON
                  ================================================== */}
                  <span
                    className="
                      relative
                      z-10

                      flex
                      h-[20px]
                      w-[20px]
                      shrink-0

                      items-center
                      justify-center

                      overflow-visible

                      leading-none
                    "
                    style={{
                      color: isActive
                        ? "rgb(67, 56, 202)"
                        : "rgb(99, 102, 241)",

                      transform: isActive
                        ? "scale(1.07)"
                        : "scale(1)",

                      transition:
                        "color 180ms ease, transform 180ms ease",
                    }}
                  >
                    <Icon
                      style={{
                        width: "18px",
                        height: "18px",

                        minWidth: "18px",
                        minHeight: "18px",

                        maxWidth: "18px",
                        maxHeight: "18px",

                        display: "block",

                        flexShrink: 0,

                        overflow: "visible",

                        color: "currentColor",
                      }}
                    />
                  </span>

                  {/* =================================================
                      ACTIVE DOT
                  ================================================== */}
                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none

                      absolute
                      right-[2px]
                      top-[2px]

                      z-20

                      h-[5px]
                      w-[5px]

                      rounded-full

                      bg-brand-500
                    "
                    style={{
                      opacity: isActive ? 1 : 0,

                      transform: isActive
                        ? "scale(1)"
                        : "scale(0.5)",

                      boxShadow:
                        "0 0 0 2px rgba(255,255,255,0.92), 0 0 7px rgba(99,102,241,0.35)",

                      transition:
                        "opacity 160ms ease, transform 160ms ease",
                    }}
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {/* =======================================================
            PREMIUM BOTTOM DETAIL
        ======================================================== */}
        <div
          aria-hidden="true"
          className="
            mt-3
            flex
            items-center
            justify-center
          "
        >
          <div className="flex items-center gap-1.5">
            <span
              className="
                h-[3px]
                w-[3px]
                rounded-full

                bg-brand-500/25

                dark:bg-brand-400/25
              "
            />

            <span
              className="
                h-px
                w-8

                bg-gradient-to-r
                from-transparent
                via-gray-200
                to-transparent

                dark:via-gray-700
              "
            />

            <span
              className="
                h-[3px]
                w-[3px]
                rounded-full

                bg-brand-500/25

                dark:bg-brand-400/25
              "
            />
          </div>
        </div>
      </div>
    </div>
  );
}