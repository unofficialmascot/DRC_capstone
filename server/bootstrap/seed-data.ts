import { storage } from "../storage";

export async function seedData(): Promise<void> {
  try {
    const existingScholar = await storage.getUserByScholarId("GITAM-SCH-2020-118").catch(() => null);
    if (existingScholar) {
      return;
    }
  } catch (_error) {
    console.log("Note: Schema migration may be pending. Continuing with application startup...");
  }

  try {
    console.log("Seeding database with dummy accounts...");

    const scholar1User = await storage.createUser({
      password: "password123",
      role: "scholar",
      name: "Thirupathi Kumar",
      email: "thirupathi@gitam.in",
      phone: "9876543210",
    });

    const scholar1Profile = await storage.createScholarProfile({
      userId: scholar1User.id,
      scholarId: "GITAM-SCH-2020-118",
      batch: "June 2022",
      status: "Active",
      department: "Computer Science",
      researchArea: "Applied Machine Learning",
      researchTitle: "Context-Aware Diagnosis for Healthcare Records",
      joiningDate: "2020-08-15",
      phase: "Phase I",
      programme: "Full Time",
      location: "Visakhapatnam",
      fatherName: "Ramakrishna Kumar",
      parentMobile: "9876500011",
      aadhaar: "1234-5678-9012",
      nationality: "Indian",
      address: "D.No. 9-14, MVP Colony, Visakhapatnam",
      tenthBoard: "CBSE",
      tenthPercentage: "92%",
      interBoard: "State Board",
      interPercentage: "89%",
    });

    const scholar2User = await storage.createUser({
      password: "password123",
      role: "scholar",
      name: "Priya Reddy",
      email: "priya.reddy@gitam.in",
      phone: "9876543220",
    });

    const scholar2Profile = await storage.createScholarProfile({
      userId: scholar2User.id,
      scholarId: "GITAM-SCH-2021-204",
      batch: "June 2023",
      status: "Active",
      department: "Biotechnology",
      researchArea: "Molecular Biology",
      researchTitle: "RNA Signatures in Pediatric Care",
      joiningDate: "2021-07-21",
      phase: "Phase II",
      programme: "Full Time",
      location: "Hyderabad",
      fatherName: "Prabhakar Reddy",
      parentMobile: "9876500022",
      aadhaar: "2345-6789-0123",
      nationality: "Indian",
      address: "Plot 12, Jubilee Hills, Hyderabad",
      tenthBoard: "ICSE",
      tenthPercentage: "91%",
      interBoard: "State Board",
      interPercentage: "88%",
    });

    const supervisorUser = await storage.createUser({
      password: "password123",
      role: "supervisor",
      name: "Dr. Ramesh Kumar",
      email: "ramesh.kumar@gitam.edu",
      phone: "9876543230",
    });

    const supervisorEmployee = await storage.createEmployee({
      employeeId: "EMP-SUPERVISOR-001",
      userId: supervisorUser.id,
      designation: "Associate Professor",
      department: "Computer Science",
    });

    await storage.updateScholarProfile("GITAM-SCH-2020-118", {
      supervisorId: supervisorEmployee.employeeId,
    });

    await storage.updateScholarProfile("GITAM-SCH-2021-204", {
      supervisorId: supervisorEmployee.employeeId,
    });

    const drcUser = await storage.createUser({
      password: "password123",
      role: "drc",
      name: "Dr. Lakshmi Narayana",
      email: "lakshmi.drc@gitam.edu",
      phone: "9876543240",
    });

    await storage.createEmployee({
      employeeId: "EMP-DRC-001",
      userId: drcUser.id,
      designation: "Professor",
      department: "Computer Science",
    });

    const ircUser = await storage.createUser({
      password: "password123",
      role: "irc",
      name: "Dr. Venkatesh Rao",
      email: "venkatesh.irc@gitam.edu",
      phone: "9876543250",
    });

    await storage.createEmployee({
      employeeId: "EMP-IRC-001",
      userId: ircUser.id,
      designation: "Associate Professor",
      department: "Biotechnology",
    });

    const doaaUser = await storage.createUser({
      password: "password123",
      role: "doaa",
      name: "Prof. Srinivas Reddy",
      email: "srinivas.doaa@gitam.edu",
      phone: "9876543260",
    });

    await storage.createEmployee({
      employeeId: "EMP-DOAA-001",
      userId: doaaUser.id,
      designation: "Professor",
      department: "Administration",
    });

    await storage.createApplication({
      scholarId: scholar1Profile.scholarId,
      type: "Extension",
      status: "Pending",
      currentStage: "supervisor",
      details: {
        candidateName: "Thirupathi Kumar",
        registrationDate: "15-08-2020",
        durationEligible: "5 years",
        extensionDuration: "6 months",
        reason: "Additional time needed for experimental validation",
        timeline:
          "Complete experiments by June 2026, thesis submission by December 2026",
      },
    });

    await storage.createResearchProgress({
      scholarId: scholar1Profile.scholarId,
      completedReviews: 4,
      pendingReports: 1,
      publications: 3,
    });

    await storage.createResearchProgress({
      scholarId: scholar2Profile.scholarId,
      completedReviews: 2,
      pendingReports: 0,
      publications: 1,
    });

    console.log("Seeding complete! Created accounts:");
    console.log("  - GITAM-SCH-2020-118 / password123 (Scholar)");
    console.log("  - GITAM-SCH-2021-204 / password123 (Scholar)");
    console.log("  - EMP-SUPERVISOR-001 / password123 (Supervisor)");
    console.log("  - EMP-DRC-001 / password123 (DRC Member)");
    console.log("  - EMP-IRC-001 / password123 (IRC Member)");
    console.log("  - EMP-DOAA-001 / password123 (DoAA Officer)");
  } catch (seedError: any) {
    console.error("Error during seed:", seedError.message);
    console.log("This may be due to pending schema migrations. Run 'npm run db:push' to apply schema changes.");
  }
}
