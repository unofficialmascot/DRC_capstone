import type { IStorage } from "../storage";
import type { UpdateUserInput } from "../domain/types";

export class UserService {
  constructor(private readonly storage: IStorage) {}

  async getUserById(id: number) {
    const user = await this.storage.getUserWithScholar(id);
    if (!user) {
      throw new Error("User not found");
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getAllUsers() {
    const users = await this.storage.getAllUsers();
    return users.map((u) => {
      const { password: _, ...rest } = u;
      return rest;
    });
  }

  async updateUser(id: number, updates: UpdateUserInput) {
    const updatedUser = await this.storage.updateUser(id, updates);
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async getEmployeeByUserId(userId: number) {
    return this.storage.getEmployeeByUserId(userId);
  }
}
