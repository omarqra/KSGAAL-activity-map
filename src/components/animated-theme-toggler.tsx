"use client";

import { useRef, useState } from "react";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useCookies } from "next-client-cookies";
import { useLocale } from "next-intl";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

type props = {
  className?: string;
};

export const AnimatedThemeToggler = ({ className }: props) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const locale = useLocale();
  const cookies = useCookies();

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const changeTheme = async () => {
    if (!buttonRef.current) return;

    await document.startViewTransition(() => {
      flushSync(async () => {
        const dark = document.documentElement.classList.toggle("dark");
        setIsDarkMode(dark);
        cookies.set("theme", dark ? "dark" : "light");
      });
    }).ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const y = top + height / 2;
    const x = left + width / 2;

    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRad}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  };
  return (
    <Button
      ref={buttonRef}
      onClick={changeTheme}
      variant={"ghost"}
      className={cn("hover:bg-accent/15 flex items-center gap-1", className)}
    >
      <Icon
        icon={"flowbite:moon-solid"}
        className={cn(
          "size-6",
          isDarkMode ? "text-primary" : "text-muted-foreground"
        )}
      />
      {locale === "ar" ? (
        <Icon
          icon={
            isDarkMode
              ? "line-md:switch-off-twotone-to-switch-twotone-transition"
              : "line-md:switch-twotone-to-switch-off-twotone-transition"
          }
          className="text-primary size-8"
        />
      ) : (
        <Icon
          icon={
            !isDarkMode
              ? "line-md:switch-off-twotone-to-switch-twotone-transition"
              : "line-md:switch-twotone-to-switch-off-twotone-transition"
          }
          className="text-primary size-8"
        />
      )}
      <Icon
        icon={"ri:sun-fill"}
        className={cn(
          "size-6",
          !isDarkMode ? "text-primary" : "text-muted-foreground"
        )}
      />
      {/* <SunDim /> */}
    </Button>
  );
};
