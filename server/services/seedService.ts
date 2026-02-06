import { storage } from "../storage";

export class SeedService {
  async seedDatabase() {
    try {
      // Check if data already exists
      const existingScholar = await storage.getUserByScholarId("GITAM-SCH-2020-118").catch(() => null);
      if (existingScholar) {
        console.log("Database already seeded, skipping seed data...");
        return;
      }
    } catch (_err) {
      console.log("Note: Schema migration may be pending. Continuing with application startup...");
    }

    console.log("Seeding database with dummy accounts...");

    const createScholar = async (payload: any) => {
      const user = await storage.createUser({
        password: "password123",
        role: "scholar",
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
      });

      const profile = await storage.createScholarProfile({
        userId: user.id,
        scholarId: payload.scholarId,
        batch: payload.batch,
        status: payload.status,
        department: payload.department,
        researchArea: payload.researchArea,
        researchTitle: payload.researchTitle,
        joiningDate: payload.joiningDate,
        phase: payload.phase,
        programme: payload.programme,
        location: payload.location,
      });

      await storage.createScholarPersonalDetails({
        userId: profile.userId,
        dateOfBirth: payload.dateOfBirth,
        nationality: payload.nationality,
        fatherName: payload.fatherName,
        aadhaarNumber: payload.aadhaarNumber,
        studentMobile: payload.studentMobile,
        parentMobile: payload.parentMobile,
        studentEmail: payload.studentEmail,
        gender: payload.gender,
        isPwd: payload.isPwd || false,
      }).catch(() => null);

      await storage.createCourseCompletion({ userId: profile.userId, completed: payload.completed || false }).catch(() => null);
      await storage.createScholarFeeDemand({ userId: profile.userId, academicYear: payload.academicYear || '2024-2025', arrearsAmount: payload.arrearsAmount || 0, annualFee: payload.annualFee || 0 }).catch(() => null);
    };

    // Seed a few sample scholars
    const scholarsToSeed = [
      {
        name: "Thirupathi Kumar",
        email: "thirupathi@gitam.in",
        phone: "9876543210",
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
        dateOfBirth: "1993-04-12",
        nationality: "Indian",
        fatherName: "Rama Rao",
        aadhaarNumber: "123412341234",
        studentMobile: "9876543210",
        parentMobile: "9876500000",
        studentEmail: "thirupathi@gitam.in",
        gender: "Male",
        isPwd: false,
        completed: false,
        academicYear: '2024-2025',
        annualFee: 50000,
      },
      {
        name: "Priya Reddy",
        email: "priya.reddy@gitam.in",
        phone: "9876543220",
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
        dateOfBirth: "1995-11-02",
        nationality: "Indian",
        fatherName: "Suresh Reddy",
        aadhaarNumber: "432143214321",
        studentMobile: "9876543220",
        parentMobile: "9876500001",
        studentEmail: "priya.reddy@gitam.in",
        gender: "Female",
        isPwd: false,
        completed: true,
        academicYear: '2024-2025',
        annualFee: 50000,
      },
      {
        name: "Arvind Kumar Singh",
        email: "arvind.singh@gitam.in",
        phone: "9876543221",
        scholarId: "GITAM-SCH-2019-087",
        batch: "June 2021",
        status: "Active",
        department: "Physics",
        researchArea: "Quantum Computing",
        researchTitle: "Quantum Error Correction in Topological Systems",
        joiningDate: "2019-06-10",
        phase: "Phase III",
        programme: "Full Time",
        location: "Hyderabad",
        dateOfBirth: "1992-03-25",
        nationality: "Indian",
        fatherName: "Hari Singh",
        aadhaarNumber: "567856785678",
        studentMobile: "9876543221",
        parentMobile: "9876500002",
        studentEmail: "arvind.singh@gitam.in",
        gender: "Male",
        isPwd: true,
        completed: true,
        academicYear: '2024-2025',
        annualFee: 50000,
      }
    ];

    for (const s of scholarsToSeed) {
      try {
        await createScholar(s);
      } catch (err) {
        // ignore individual seed errors
      }
    }

    console.log("Seeding complete.");
  }
}
      const supervisorUser = await storage.createUser({
        password: "password123",
        role: "supervisor",
        name: "Dr. Ramesh Kumar",
        email: "ramesh.kumar@gitam.edu",
            userId: scholar6Profile.userId,
      });

      const supervisorEmployee = await storage.createEmployee({
        employeeId: "EMP-SUPERVISOR-001",
        userId: supervisorUser.id,
        designation: "Associate Professor",
        department: "Computer Science",
      });

      // === DRC MEMBER ===
      const drcUser = await storage.createUser({
        password: "password123",
        role: "drc",
        name: "Dr. Lakshmi Narayana",
        email: "lakshmi.drc@gitam.edu",
        phone: "9876543240",
      });

      const drcEmployee = await storage.createEmployee({
        employeeId: "EMP-DRC-001",
        userId: drcUser.id,
        designation: "Professor",
        department: "Computer Science",
      });

      // === IRC MEMBER ===
      const ircUser = await storage.createUser({
        password: "password123",
        role: "irc",
        name: "Dr. Venkatesh Rao",
        email: "venkatesh.irc@gitam.edu",
        phone: "9876543250",
      });

      const ircEmployee = await storage.createEmployee({
        employeeId: "EMP-IRC-001",
        userId: ircUser.id,
        designation: "Associate Professor",
        department: "Biotechnology",
      });

      // === DOAA OFFICER ===
      const doaaUser = await storage.createUser({
        password: "password123",
        role: "doaa",
        name: "Prof. Srinivas Reddy",
        email: "srinivas.doaa@gitam.edu",
        phone: "9876543260",
      });

      const doaaEmployee = await storage.createEmployee({
        employeeId: "EMP-DOAA-001",
        userId: doaaUser.id,
        designation: "Professor",
        department: "Administration",
      });

      // === APPLICATIONS ===
      // Add sample application for scholar1
      await storage.createApplication({
        scholarId: scholar1Profile.id,
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

      // === RESEARCH PROGRESS ===
      await storage.createResearchProgress({
        scholarId: scholar1Profile.id,
        completedReviews: 4,
        pendingReports: 1,
        publications: 3,
      });

      await storage.createResearchProgress({
        scholarId: scholar2Profile.id,
        completedReviews: 2,
        pendingReports: 0,
        publications: 1,
      });

      console.log("Seeding complete! Created accounts:");
      console.log("\n📚 SCHOLARS (for extension eligibility testing):");
      console.log("  - GITAM-SCH-2020-118 / password123 (Thirupathi Kumar - Male, 4yr PhD, no courses, no arrears)");
      console.log("  - GITAM-SCH-2021-204 / password123 (Priya Reddy - Female, 3.5yr PhD, courses done, no arrears) ✅");
      console.log("  - GITAM-SCH-2019-087 / password123 (Arvind Singh - Male PWD, 5yr PhD, courses done, no arrears) ✅");
      console.log("  - GITAM-SCH-2023-156 / password123 (Neha Sharma - Female, 1.5yr PhD, no courses - NOT ELIGIBLE)");
      console.log("  - GITAM-SCH-2020-142 / password123 (Ravi Malhotra - Male, 4yr PhD, courses done, ₹50k ARREARS - NOT ELIGIBLE)");
      console.log("  - GITAM-SCH-2021-098 / password123 (Meera Gupta - Female PWD, 3yr PhD, courses done, no arrears) ✅");
      console.log("\n👥 REVIEWERS:");
      console.log("  - EMP-SUPERVISOR-001 / password123 (Supervisor - Dr. Ramesh Kumar)");
      console.log("  - EMP-DRC-001 / password123 (DRC Member - Dr. Lakshmi Narayana)");
      console.log("  - EMP-IRC-001 / password123 (IRC Member - Dr. Venkatesh Rao)");
      console.log("  - EMP-DOAA-001 / password123 (DoAA Officer - Prof. Srinivas Reddy)");
      console.log("\n✅ = Eligible for extension (check gender rules: Male=3yr, Female=5yr, PWD=7yr)");
    } catch (seedErr: any) {
      console.error("Error during seed:", seedErr.message);
      console.log(
        "This may be due to pending schema migrations. Run 'npm run db:push' to apply schema changes.",
      );
    }
  }
}

export const seedService = new SeedService();
