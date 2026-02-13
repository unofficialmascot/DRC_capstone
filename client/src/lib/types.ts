import type { User as DbUser, Scholar } from "@shared/schema";

export type PublicUser = Omit<DbUser, "password"> &
  Partial<Scholar> & {
    username?: string;
  };
