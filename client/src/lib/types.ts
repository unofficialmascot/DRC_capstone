import type { User as DbUser, Scholar } from "@shared/schema";

export type PublicUser = Omit<DbUser, "password"> &
  Partial<Scholar> & {
    employeeId?: string | null;
    username?: string;
  };
