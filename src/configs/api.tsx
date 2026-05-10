import Cookies from "js-cookie";

import { env } from "@/env/client";
import { Apis } from "@/types/apis-types";
import { handleError } from "@/utils/error-handler/index";

export const ClientPublic = env.NEXT_PUBLIC_FRONTEND_URL;
export const BaseUrl = env.NEXT_PUBLIC_BACKEND_URL;
export const ApiBaseUrl = BaseUrl;
export const ImageBaseUrl = `${BaseUrl}/public`;

export const auth = {
  admin: "a_accessToken",
  user: "u_accessToken",
  guest: "g_accessToken",
} as const;

export const saveToken = (token: string) => {
  localStorage.setItem(auth.admin, token);
};

export const saveGuestToken = (token: string) => {
  localStorage.setItem(auth.guest, token);
};

export const getToken = (key: (typeof auth)[keyof typeof auth]) => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

export const Client = {
  admin: () => {
    if (typeof window !== "undefined") {
      const token = getToken(auth.admin);
      return initClient({ token: token || undefined });
    }
    return initClient();
  },
  user: () => {
    if (typeof window !== "undefined") {
      const token = getToken(auth.user);
      return initClient({ token: token || undefined });
    }
    return initClient();
  },
  guest: () => {
    if (typeof window !== "undefined") {
      const token = getToken(auth.guest);
      return initClient({ token: token || undefined });
    }
    return initClient();
  },
};

function initClient(props?: { token?: string }) {
  const { token } = props || {};
  const apis = new Apis({
    baseURL: ApiBaseUrl,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      "accept-language":
        typeof window !== "undefined"
          ? Cookies.get("NEXT_LOCALE") || "en"
          : "en",
    },
  });
  apis.instance.interceptors.response.use(
    (response) => response,
    (error) => {
      handleError(error);
      return Promise.reject(error);
    }
  );
  return apis;
}
