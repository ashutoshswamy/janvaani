// Shared by client pages and server routes (no Firebase SDK imports here).

/** Official role, stored as Firebase custom claims (set only by the server). */
export interface Official {
  role: "superadmin" | "admin";
  state?: string | null; // null / missing = all of India (superadmin)
  district?: string | null; // null / missing = whole state
}

export const areaLabel = (o: Pick<Official, "state" | "district">) =>
  o.state ? [o.district ?? "All districts", o.state].join(", ") : "All India";

/** Superadmins see everything; admins only their state (and district, if set). */
export const inArea = (o: Official, r: { state: string; district: string }) =>
  o.role === "superadmin" || ((!o.state || o.state === r.state) && (!o.district || o.district === r.district));
