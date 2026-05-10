import { create } from "zustand";

import {
  Activity,
  ActivitySubtype,
  ActivityType,
  Country,
  ID,
  Organization,
} from "@/types/admin";

import {
  seedActivities,
  seedActivityTypes,
  seedCountries,
  seedOrganizations,
  seedSubtypes,
} from "./seed";
import { VisitorStat, seedVisitorStats } from "./visitor-stats";

let __nextId = 1_000_000;
const newId = () => __nextId++;

interface AdminState {
  organizations: Organization[];
  countries: Country[];
  activityTypes: ActivityType[];
  subtypes: ActivitySubtype[];
  activities: Activity[];
  visitorStats: VisitorStat[];
  // organization
  addOrganization: (org: Omit<Organization, "id">) => void;
  updateOrganization: (id: ID, patch: Partial<Organization>) => void;
  deleteOrganization: (id: ID) => void;
  // country
  addCountry: (c: Omit<Country, "id">) => void;
  updateCountry: (id: ID, patch: Partial<Country>) => void;
  deleteCountry: (id: ID) => void;
  // activity type
  addActivityType: (t: Omit<ActivityType, "id">) => void;
  updateActivityType: (id: ID, patch: Partial<ActivityType>) => void;
  deleteActivityType: (id: ID) => void;
  // subtype
  addSubtype: (s: Omit<ActivitySubtype, "id">) => void;
  updateSubtype: (id: ID, patch: Partial<ActivitySubtype>) => void;
  deleteSubtype: (id: ID) => void;
  // activity
  addActivity: (a: Omit<Activity, "id">) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  organizations: seedOrganizations,
  countries: seedCountries,
  activityTypes: seedActivityTypes,
  subtypes: seedSubtypes,
  activities: seedActivities,
  visitorStats: seedVisitorStats,

  addOrganization: (org) =>
    set((s) => ({
      organizations: [...s.organizations, { ...org, id: newId() }],
    })),
  updateOrganization: (id, patch) =>
    set((s) => ({
      organizations: s.organizations.map((o) =>
        o.id === id ? { ...o, ...patch } : o
      ),
    })),
  deleteOrganization: (id) =>
    set((s) => ({
      organizations: s.organizations.filter((o) => o.id !== id),
      activities: s.activities.map((a) =>
        a.organizationId === id ? { ...a, organizationId: undefined } : a
      ),
    })),

  addCountry: (c) =>
    set((s) => ({
      countries: [...s.countries, { ...c, id: newId() }],
    })),
  updateCountry: (id, patch) =>
    set((s) => ({
      countries: s.countries.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    })),
  deleteCountry: (id) =>
    set((s) => ({
      countries: s.countries.filter((c) => c.id !== id),
    })),

  addActivityType: (t) =>
    set((s) => ({
      activityTypes: [...s.activityTypes, { ...t, id: newId() }],
    })),
  updateActivityType: (id, patch) =>
    set((s) => ({
      activityTypes: s.activityTypes.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      ),
    })),
  deleteActivityType: (id) =>
    set((s) => ({
      activityTypes: s.activityTypes.filter((t) => t.id !== id),
      subtypes: s.subtypes.filter((sub) => sub.parentTypeId !== id),
    })),

  addSubtype: (sub) =>
    set((s) => ({
      subtypes: [...s.subtypes, { ...sub, id: newId() }],
    })),
  updateSubtype: (id, patch) =>
    set((s) => ({
      subtypes: s.subtypes.map((sub) =>
        sub.id === id ? { ...sub, ...patch } : sub
      ),
    })),
  deleteSubtype: (id) =>
    set((s) => ({
      subtypes: s.subtypes.filter((sub) => sub.id !== id),
    })),

  addActivity: (a) =>
    set((s) => ({
      activities: [...s.activities, { ...a, id: newId() }],
    })),
}));
