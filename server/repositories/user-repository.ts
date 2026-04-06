import bcrypt from "bcryptjs";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  scholars,
  employees,
  employeeRoles,
  type Scholar,
  type User,
  type InsertUser,
} from "@shared/schema";
import { getScholarSelectFields, sanitizeScholarWrite } from "./scholar-compat";

const EMPLOYEE_ROLES = [
  "supervisor",
  "drc",
  "drc_convener",
  "drc_chairman",
  "irc",
  "doaa",
  "admin",
] as const;

type EmployeeRoleName = (typeof EMPLOYEE_ROLES)[number];

function isEmployeeRole(role: string): role is EmployeeRoleName {
  return (EMPLOYEE_ROLES as readonly string[]).includes(role);
}

export interface SupervisorOption {
  employeeId: string;
  name: string;
  department: string | null;
  designation: string | null;
}

export interface AssignedScholarSummary {
  scholarId: string;
  name: string;
  department: string | null;
  researchArea: string | null;
  phase: string | null;
  status: string | null;
}

export class UserRepository {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserWithScholar(
    id: number,
  ): Promise<(User & Partial<Scholar> & Partial<typeof employees.$inferSelect>) | undefined> {
    const scholarFields = await getScholarSelectFields();
    const [record] = await db
      .select({
        users,
        scholars: scholarFields,
        employees,
      })
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
    const scholarFields = await getScholarSelectFields();
    const [record] = await db
      .select({
        users,
        scholars: scholarFields,
      })
      .from(users)
      .leftJoin(scholars, eq(scholars.userId, users.id))
      .where(eq(scholars.scholarId, scholarId));

    if (!record) {
      return undefined;
    }

    return { ...record.scholars, ...record.users };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
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

  private async ensureSupervisorHasSingleScholar(employeeId: string, currentScholarId?: string) {
    if (!employeeId) {
      return;
    }

    const assignedCount = await this.countAssignedScholars(employeeId);
    if (assignedCount > 0) {
      if (currentScholarId) {
        const scholarFields = await getScholarSelectFields();
        const [currentScholar] = await db
          .select(scholarFields)
          .from(scholars)
          .where(eq(scholars.scholarId, currentScholarId));

        if (
          currentScholar &&
          (currentScholar.supervisorId === employeeId || currentScholar.coSupervisorId === employeeId)
        ) {
          return;
        }
      }

      throw new Error("Supervisor is already assigned to a scholar and cannot be assigned to another scholar");
    }
  }

  async createScholarProfile(
    profile: typeof scholars.$inferInsert,
  ): Promise<typeof scholars.$inferSelect> {
    const scholarFields = await getScholarSelectFields();
    const writeProfile = await sanitizeScholarWrite(profile);

    if (profile.supervisorId) {
      await this.ensureSupervisorHasSingleScholar(profile.supervisorId);
    }
    if (profile.coSupervisorId) {
      await this.ensureSupervisorHasSingleScholar(profile.coSupervisorId);
    }

    const [newProfile] = await db
      .insert(scholars)
      .values(writeProfile)
      .returning(scholarFields);
    return newProfile;
  }

  async updateScholarProfile(
    scholarId: string,
    updates: Partial<typeof scholars.$inferInsert>,
  ): Promise<typeof scholars.$inferSelect> {
    const scholarFields = await getScholarSelectFields();
    const writeUpdates = await sanitizeScholarWrite(updates);

    if (updates.supervisorId) {
      await this.ensureSupervisorHasSingleScholar(updates.supervisorId, scholarId);
    }
    if (updates.coSupervisorId) {
      await this.ensureSupervisorHasSingleScholar(updates.coSupervisorId, scholarId);
    }

    const [updatedProfile] = await db
      .update(scholars)
      .set(writeUpdates)
      .where(eq(scholars.scholarId, scholarId))
      .returning(scholarFields);
    return updatedProfile;
  }

  async isSupervisorForScholar(employeeId: string, scholarId: string): Promise<boolean> {
    const scholarFields = await getScholarSelectFields();
    const [scholar] = await db
      .select(scholarFields)
      .from(scholars)
      .where(eq(scholars.scholarId, scholarId));

    if (!scholar) {
      return false;
    }

    return scholar.supervisorId === employeeId || scholar.coSupervisorId === employeeId;
  }

  async listSupervisors(): Promise<SupervisorOption[]> {
    const rows = await db
      .select({
        employeeId: employees.employeeId,
        name: users.name,
        department: employees.department,
        designation: employees.designation,
      })
      .from(employees)
      .innerJoin(users, eq(users.id, employees.userId))
      .leftJoin(employeeRoles, and(eq(employeeRoles.userId, users.id), eq(employeeRoles.role, "supervisor")))
      .where(sql`${users.role} = 'supervisor' OR ${employeeRoles.id} IS NOT NULL`);

    return rows;
  }

  async getEmployeeRolesByUserId(userId: number, baseRole?: string): Promise<string[]> {
    const rows = await db
      .select({ role: employeeRoles.role })
      .from(employeeRoles)
      .where(eq(employeeRoles.userId, userId));

    const dedupedRoles = new Set<string>();
    for (const row of rows) {
      if (row.role) {
        dedupedRoles.add(row.role);
      }
    }

    if (baseRole && isEmployeeRole(baseRole)) {
      dedupedRoles.add(baseRole);
    }

    return Array.from(dedupedRoles);
  }

  async userHasAnyRole(userId: number, roles: string[], baseRole?: string): Promise<boolean> {
    if (roles.length === 0) {
      return false;
    }

    if (baseRole && roles.includes(baseRole)) {
      return true;
    }

    const [match] = await db
      .select({ id: employeeRoles.id })
      .from(employeeRoles)
      .where(and(eq(employeeRoles.userId, userId), inArray(employeeRoles.role, roles)))
      .limit(1);

    return Boolean(match);
  }

  async countAssignedScholars(employeeId: string): Promise<number> {
    const [row] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(scholars)
      .where(
        or(
          eq(scholars.supervisorId, employeeId),
          eq(scholars.coSupervisorId, employeeId),
        ),
      );

    return Number(row?.count ?? 0);
  }

  async listAssignedScholars(employeeId: string): Promise<AssignedScholarSummary[]> {
    const rows = await db
      .select({
        scholarId: scholars.scholarId,
        name: users.name,
        department: scholars.department,
        researchArea: scholars.researchArea,
        phase: scholars.phase,
        status: scholars.status,
      })
      .from(scholars)
      .innerJoin(users, eq(users.id, scholars.userId))
      .where(
        or(
          eq(scholars.supervisorId, employeeId),
          eq(scholars.coSupervisorId, employeeId),
        ),
      )
      .limit(1);

    return rows;
  }

  async createSupervisorChangeHistory(entry: {
    scholarId: string;
    applicationId: number;
    previousSupervisorId?: string | null;
    newSupervisorId: string;
  }): Promise<void> {
    const historyEntry = {
      applicationId: entry.applicationId,
      previousSupervisorId: entry.previousSupervisorId || null,
      newSupervisorId: entry.newSupervisorId,
      changedAt: new Date().toISOString(),
    };

    await db
      .update(scholars)
      .set({
        supervisorChangeHistory: sql`supervisor_change_history || ${JSON.stringify([historyEntry])}::jsonb`,
      })
      .where(eq(scholars.scholarId, entry.scholarId));
  }
}
