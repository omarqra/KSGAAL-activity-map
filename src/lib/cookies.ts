import Cookies from "js-cookie";

export function getCookie(name: string): string | undefined {
  return Cookies.get(name);
}

export function setCookie(name: string, value: string, maxAge?: number): void {
  Cookies.set(name, value, { expires: maxAge ? new Date(Date.now() + maxAge * 1000) : undefined });
}
