import { z } from "zod";
import { storage } from "../storage";
import { verifyPassword } from "../storage";

export class AuthService {
  async login(input: { scholarId?: string; employeeId?: string; password: string }) {
    const scholarId = input.scholarId?.trim().toUpperCase();
    const employeeId = input.employeeId?.trim().toUpperCase();

    if (!scholarId && !employeeId) {
      throw new Error("Either scholarId or employeeId is required");
    }

    let user;
    if (scholarId) {
      user = await storage.getUserByScholarId(scholarId);
    } else if (employeeId) {
      user = await storage.getUserByEmployeeId(employeeId);
    }

    if (!user) {
      throw new Error("Invalid ID or password");
    }

    // Verify password
    let passwordValid = await verifyPassword(input.password, user.password);
    
    // Fallback for legacy plaintext passwords
    if (!passwordValid && user.password === input.password) {
      await storage.updateUser(user.id, { password: input.password });
      passwordValid = true;
    }

    if (!passwordValid) {
      throw new Error("Invalid ID or password");
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getCurrentUser(userId: number) {
    const user = await storage.getUserWithScholar(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
