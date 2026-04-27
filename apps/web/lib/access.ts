export type Role = "guest" | "user" | "admin";

export const ACCESS_MATRIX = {
  zones: { read: ["guest", "user", "admin"], write: ["admin"] },
  wait_reports: { read: ["guest", "user", "admin"], write: ["user", "admin"] },
  users: { read: ["user", "admin"], write: ["user", "admin"] },
  admin_stats: { read: ["admin"], write: ["admin"] },
  admin_actions: { read: ["admin"], write: ["admin"] },
} as const;

export const ADMIN_ROUTES = ["/admin", "/admin/users", "/admin/reports", "/admin/stats"];
