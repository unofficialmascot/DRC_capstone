import type {
  CreateEmployeeInput,
  CreateScholarProfileInput,
  CreateUserInput,
  Employee,
  Scholar,
  ScholarSupervisor,
  UpdateUserInput,
  User,
} from "../domain/types";

export interface UsersRepository {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserWithScholar(id: number): Promise<(User & Partial<Scholar>) | undefined>;
  getUserByScholarId(scholarId: string): Promise<(User & Partial<Scholar>) | undefined>;
  getUserByEmployeeId(employeeId: string): Promise<(User & Partial<Employee>) | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: CreateUserInput): Promise<User>;
  updateUser(id: number, updates: UpdateUserInput): Promise<User>;

  // Employees
  getEmployee(employeeId: string): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: number): Promise<Employee | undefined>;
  createEmployee(emp: CreateEmployeeInput): Promise<Employee>;

  // Scholars
  getScholarsBySupervisor(supervisorId: number | string): Promise<(Scholar & Partial<User>)[]>;
  createScholarProfile(profile: CreateScholarProfileInput): Promise<Scholar>;
  updateScholarPhase(userId: number, phase: string): Promise<Scholar>;
  updateScholarSupervisorAssignment(userId: number, supervisorId: number): Promise<ScholarSupervisor>;
  getScholarById(id: number): Promise<Scholar | undefined>;
  getScholarByScholarId(scholarId: string): Promise<Scholar | undefined>;
}
