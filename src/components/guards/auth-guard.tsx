"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Client, auth, getToken } from "@/configs/api";
import { useRouter } from "@/i18n/routing";
import { useUserStore } from "@/store/use-user-store";
import decorateToaster from "@/utils/decorate-toaster";

import ClientLoading from "src/components/guards/client-loading";

interface AuthGuardProps {
  children: React.ReactNode;
  mode?: "admin" | "guest";
}

export default function AuthGuard({
  children,
  mode = "admin",
}: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { setUser, setPermissions } = useUserStore();
  const last_refresh_time = useRef<Date | null>(null);
  const isGuestMode = mode === "guest";

  const me = useCallback(async () => {
    const mePromise = isGuestMode
      ? Client.guest().userProfile.me({})
      : Client.admin().userProfile.me({});

    await decorateToaster(mePromise, {
      afterSuccess: (response) => {
        setUser(response.data);
        setPermissions(
          response.data.user_types
            .map((type) => type.permissions.map((perm) => perm.code))
            .flat()
        );
        last_refresh_time.current = new Date();
        setIsLoading(false);
      },
      disabled: true,
    });
  }, [isGuestMode, setUser, setPermissions]);

  useEffect(() => {
    const tokenKey = isGuestMode ? auth.guest : auth.admin;
    const token = getToken(tokenKey);
    if (!token) {
      last_refresh_time.current = null;
      router.push("/auth/login");
    } else if (
      !last_refresh_time.current ||
      new Date().getTime() - last_refresh_time.current.getTime() >
        1000 * 60 * 30 // debounce me request to 30 minutes
    ) {
      me();
    }
  }, [isGuestMode, me, router]);

  if (isLoading) {
    return <ClientLoading />;
  }
  return children;
}
