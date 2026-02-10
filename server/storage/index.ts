import { DatabaseStorage } from "./dbStorage";
import { FileStorage } from "./fileStorage";

const useFileStorage = process.env.DEMO_FILE_STORAGE === "true";

export const storage = useFileStorage
  ? new FileStorage()
  : new DatabaseStorage();

export type { IStorage } from "./types";
export { verifyPassword } from "./password";
