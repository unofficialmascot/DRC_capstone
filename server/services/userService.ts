import { storage } from "../storage";
import type { InsertUser } from "@shared/schema";

export class UserService {
  async getUserById(id: number) {
    const user = await storage.getUserWithScholar(id);
    if (!user) {
      throw new Error("User not found");
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getAllUsers() {
    const users = await storage.getAllUsers();
    return users.map((u) => {
      const { password: _, ...rest } = u;
      return rest;
    });
  }

  async updateUser(id: number, updates: Partial<InsertUser>) {
    const updatedUser = await storage.updateUser(id, updates);
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}

export const userService = new UserService();
