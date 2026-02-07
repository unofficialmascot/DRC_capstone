import type { IStorage } from "../storage";
import { verifyPassword } from "../storage";
import { AppError } from "../errors";

export class AuthService {
  constructor(private readonly storage: IStorage) {}

  async login(input: { scholarId?: string; employeeId?: string; password: string }) {
    const scholarId = input.scholarId?.trim().toUpperCase();
    const employeeId = input.employeeId?.trim().toUpperCase();

    if (!scholarId && !employeeId) {
      throw new AppError("Either scholarId or employeeId is required", 400);
    }

    let user;
    if (scholarId) {
      user = await this.storage.getUserByScholarId(scholarId);
    } else if (employeeId) {
      user = await this.storage.getUserByEmployeeId(employeeId);
    }

    if (!user) {
      throw new AppError("Invalid ID or password", 401);
    }

    // Verify password
    let passwordValid = await verifyPassword(input.password, user.password);
    
    // Fallback for legacy plaintext passwords
    if (!passwordValid && user.password === input.password) {
      await this.storage.updateUser(user.id, { password: input.password });
      passwordValid = true;
    }

    if (!passwordValid) {
      throw new AppError("Invalid ID or password", 401);
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getCurrentUser(userId: number) {
    const user = await this.storage.getUserWithScholar(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
