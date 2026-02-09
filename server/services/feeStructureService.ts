import type { FeeStructure } from "../domain/types";
import type { IStorage } from "../storage";

export class FeeStructureService {
  constructor(private readonly storage: IStorage) {}

  async listFeeStructure(): Promise<FeeStructure[]> {
    return this.storage.getFeeStructure();
  }
}
