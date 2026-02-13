import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  scholars,
  employees,
  type Scholar,
  type User,
  type InsertUser,
} from "@shared/schema";

export class UserRepository {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserWithScholar(
    id: number,
  ): Promise<(User & Partial<Scholar> & Partial<typeof employees.$inferSelect>) | undefined> {
    const [record] = await db
      .select()
      .from(users)
      .leftJoin(scholars, eq(scholars.userId, users.id))
      .leftJoin(employees, eq(employees.userId, users.id))
      .where(eq(users.id, id));

    if (!record) {
      return undefined;
    }

    const result = { ...record.users };
    if (record.scholars) {
      Object.assign(result, record.scholars);
    }
    if (record.employees) {
      Object.assign(result, record.employees);
    }

    return result;
  }

  async getUserByScholarId(
    scholarId: string,
  ): Promise<(User & Partial<Scholar>) | undefined> {
    const [record] = await db
      .select()
      .from(users)
      .leftJoin(scholars, eq(scholars.userId, users.id))
      .where(eq(scholars.scholarId, scholarId));

    if (!record) {
      return undefined;
    }

    return { ...record.scholars, ...record.users };
  }

  async getUserByEmployeeId(
    employeeId: string,
  ): Promise<(User & Partial<typeof employees.$inferSelect>) | undefined> {
    const [record] = await db
      .select()
      .from(users)
      .leftJoin(employees, eq(employees.userId, users.id))
      .where(eq(employees.employeeId, employeeId));

    if (!record) {
      return undefined;
    }

    return { ...record.employees, ...record.users };
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password || "password123", 10);
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        password: hashedPassword,
      })
      .returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const updateData = { ...updates };
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getEmployee(employeeId: string): Promise<typeof employees.$inferSelect | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.employeeId, employeeId));
    return employee;
  }

  async createEmployee(emp: typeof employees.$inferInsert): Promise<typeof employees.$inferSelect> {
    const [newEmployee] = await db.insert(employees).values(emp).returning();
    return newEmployee;
  }

  async createScholarProfile(
    profile: typeof scholars.$inferInsert,
  ): Promise<typeof scholars.$inferSelect> {
    const [newProfile] = await db.insert(scholars).values(profile).returning();
    return newProfile;
  }

  async updateScholarProfile(
    scholarId: string,
    updates: Partial<typeof scholars.$inferInsert>,
  ): Promise<typeof scholars.$inferSelect> {
    const [updatedProfile] = await db
      .update(scholars)
      .set(updates)
      .where(eq(scholars.scholarId, scholarId))
      .returning();
    return updatedProfile;
  }

  async isSupervisorForScholar(employeeId: string, scholarId: string): Promise<boolean> {
    const [scholar] = await db
      .select()
      .from(scholars)
      .where(eq(scholars.scholarId, scholarId));

    if (!scholar) {
      return false;
    }

    return scholar.supervisorId === employeeId || scholar.coSupervisorId === employeeId;
  }
}
