import type { ApplicationsRepository } from "./applications.repo";
import type { DocumentsRepository } from "./documents.repo";
import type { ResearchRepository } from "./research.repo";
import type { UsersRepository } from "./users.repo";

export interface IStorage
  extends UsersRepository,
    ApplicationsRepository,
    ResearchRepository,
    DocumentsRepository {}
