import { storage } from "../storage";
import { ApplicationDocumentService } from "./applicationDocumentService";
import { ApplicationService } from "./applicationService";
import { AuthService } from "./authService";
import { DocumentStorageProvider } from "./documentStorageProvider";
import { ExtensionEligibilityService } from "./extensionEligibilityService";
import { FeeStructureService } from "./feeStructureService";
import { ResearchProgressService } from "./researchProgressService";
import { ReviewService } from "./reviewService";
import { ScholarService } from "./scholarService";
import { SeedService } from "./seedService";
import { UserService } from "./userService";

const extensionEligibilityService = new ExtensionEligibilityService(storage);
const documentStorageProvider = new DocumentStorageProvider();
const applicationDocumentService = new ApplicationDocumentService(
  storage,
  documentStorageProvider,
);
const applicationService = new ApplicationService(
  storage,
  extensionEligibilityService,
  applicationDocumentService,
);
const authService = new AuthService(storage);
const feeStructureService = new FeeStructureService(storage);
const reviewService = new ReviewService(storage);
const researchProgressService = new ResearchProgressService(storage);
const scholarService = new ScholarService(storage);
const seedService = new SeedService(storage);
const userService = new UserService(storage);

export {
  applicationDocumentService,
  applicationService,
  authService,
  documentStorageProvider,
  feeStructureService,
  extensionEligibilityService,
  researchProgressService,
  reviewService,
  scholarService,
  seedService,
  userService,
};
