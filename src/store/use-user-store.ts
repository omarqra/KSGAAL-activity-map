import { create } from "zustand";

import { PERMS } from "@/configs/all-permissions";
import { MeData } from "@/types/apis-types";

export interface UserStore {
  user: MeData | null;
  permissions: PERMS[];
  setUser: (user: MeData) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPermissions: (permissions: any[]) => void;
  clearUser: () => void;
  // Admin permissions methods
  hasPerm: (action: PERMS) => boolean;
  hasAnyPerm: (actions: PERMS[]) => boolean;
  hasAllPerm: (actions: PERMS[]) => boolean;
  isPermitted: (actions: PERMS | PERMS[]) => boolean;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  permissions: [],
  setUser: (user) => set({ user }),
  setPermissions: (permissions) => set({ permissions }),
  clearUser: () => set({ user: null, permissions: [] }),

  // Admin permissions methods
  hasPerm: (action: PERMS) => {
    const { permissions } = get();
    return permissions.includes(action);
  },

  hasAnyPerm: (actions: PERMS[]) => {
    const { permissions } = get();
    return actions.some((perm) => permissions.includes(perm)) || false;
  },

  hasAllPerm: (actions: PERMS[]) => {
    const { permissions } = get();
    return actions.every((perm) => permissions.includes(perm)) || false;
  },

  isPermitted: (actions: PERMS | PERMS[]) => {
    const { permissions } = get();
    if (typeof actions === "string") {
      return permissions.includes(actions);
    }
    if (actions.length === 0) {
      return true;
    }
    return actions.some((perm) => permissions.includes(perm)) || false;
  },
}));
