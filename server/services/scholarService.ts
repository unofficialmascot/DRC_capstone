import type { IStorage } from "../storage";

export class ScholarService {
  constructor(private readonly storage: IStorage) {}

  async getScholarById(id: number) {
    return this.storage.getScholarById(id);
  }

  async getScholarsBySupervisor(supervisorId: number | string) {
    return this.storage.getScholarsBySupervisor(supervisorId);
  }
}
