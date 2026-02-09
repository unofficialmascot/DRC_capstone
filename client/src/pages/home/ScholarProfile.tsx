import { useQuery } from "@tanstack/react-query";
import type { FeeStructureRow, User } from "@/types/gscholar";
import {
  useAuditTimeline,
  useDocumentRecords,
  useProgressionSummary,
  useReviewCycles,
} from "@/hooks/useScholarProgressData";

interface ScholarProfileProps {
  user: User;
}

export default function ScholarProfile({ user }: ScholarProfileProps) {
  const { data: freshUser } = useQuery<User>({
    queryKey: ["/api/users", user.id],
    queryFn: () => fetch(`/api/users/${user.id}`).then((res) => res.json()),
    initialData: user,
  });
  const { data: feeStructure = [] } = useQuery<FeeStructureRow[]>({
    queryKey: ["/api/fees/structure"],
    queryFn: () => fetch("/api/fees/structure").then((res) => res.json()),
  });
  const {
    data: progressionSummary = [],
    isLoading: isLoadingProgression,
    error: progressionError,
  } = useProgressionSummary();
  const {
    data: reviewCycles = [],
    isLoading: isLoadingReviewCycles,
    error: reviewCyclesError,
  } = useReviewCycles();
  const {
    data: documentRecords = [],
    isLoading: isLoadingDocuments,
    error: documentsError,
  } = useDocumentRecords();
  const {
    data: auditTimeline = [],
    isLoading: isLoadingAudit,
    error: auditError,
  } = useAuditTimeline();

  const displayUser = freshUser || user;
  const formatFee = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return String(value);
    }
    return `₹${numeric.toLocaleString("en-IN")}`;
  };
  const feeDemand = {
    arrears: "₹12,500",
    hostelArrears: "₹5,000",
    annualFee: "₹90,000",
  };
  const paymentHistory = [
    {
      transactionId: "TXN-2023-1142",
      dateTime: "2023-08-14 11:45",
      bankName: "State Bank of India",
      totalPaid: "₹90,000",
      status: "Success",
      academicYear: "2023-24",
      mode: "Net Banking",
      receiptNumber: "RCPT-3321",
      reconciliation: "Matched",
      createdAt: "2023-08-14 11:47",
    },
    {
      transactionId: "TXN-2024-0266",
      dateTime: "2024-01-10 16:18",
      bankName: "HDFC Bank",
      totalPaid: "₹45,000",
      status: "Pending",
      academicYear: "2024-25",
      mode: "UPI",
      receiptNumber: "RCPT-4108",
      reconciliation: "In Review",
      createdAt: "2024-01-10 16:20",
    },
  ];
  const prePhdExam = {
    examType: "Pre-PhD Regular",
    conductedMonthYear: "July 2023",
    certificateLabel: "Download Certificate",
    subjects: [
      {
        name: "Research Methodology",
        code: "RSH-501",
        conductedOn: "July 2023",
        semester: "Semester I",
        grade: "A",
      },
      {
        name: "Advanced Computing",
        code: "CSE-542",
        conductedOn: "July 2023",
        semester: "Semester I",
        grade: "A+",
      },
      {
        name: "Ethics & Publication",
        code: "RSH-506",
        conductedOn: "July 2023",
        semester: "Semester I",
        grade: "O",
      },
    ],
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="avatar-col">
          <div className="avatar-placeholder"></div>
        </div>
        <div className="details-col">
          <table className="info-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Registration No</th>
                <th>Campus</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{displayUser.name}</td>
                <td>{displayUser.scholarId || "N/A"}</td>
                <td>{displayUser.location || "N/A"}</td>
                <td>{displayUser.department || "N/A"}</td>
                <td>
                  <span className="pill">{displayUser.status || "Active"}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="personal-card">
        <div className="personal-header">
          <h3>Personal Details</h3>
        </div>
        <div className="personal-grid">
          <div className="pd-row">
            <span className="pd-label">Name</span>
            <span className="pd-value">{displayUser.name}</span>
            <span className="pd-label">Contact</span>
            <span className="pd-value">{displayUser.phone || "N/A"}</span>
            <span className="pd-label">Email</span>
            <span className="pd-value">{displayUser.email}</span>
          </div>
          <div className="pd-row">
            <span className="pd-label">Department</span>
            <span className="pd-value">{displayUser.department || "N/A"}</span>
            <span className="pd-label">Batch</span>
            <span className="pd-value">{displayUser.batch || "N/A"}</span>
            <span className="pd-label">Programme</span>
            <span className="pd-value">{displayUser.programme || "N/A"}</span>
          </div>
          <div className="pd-row">
            <span className="pd-label">Phase</span>
            <span className="pd-value">{displayUser.phase || "N/A"}</span>
            <span className="pd-label">Supervisor</span>
            <span className="pd-value" data-testid="text-supervisor">
              {displayUser.supervisor || "N/A"}
            </span>
            <span className="pd-label">Co-Supervisor</span>
            <span className="pd-value">{displayUser.coSupervisor || "N/A"}</span>
          </div>
          <div className="pd-row">
            <span className="pd-label">Date of Joining</span>
            <span className="pd-value">
              {displayUser.joiningDate || "N/A"}
            </span>
            <span className="pd-label">Research Area</span>
            <span className="pd-value">
              {displayUser.researchArea || "N/A"}
            </span>
            <span className="pd-label">Research Title</span>
            <span className="pd-value">
              {displayUser.researchTitle || "N/A"}
            </span>
          </div>
        </div>
      </div>
      <div className="module-card">
        <div className="module-header">
          <h3>Fee & Payments Module</h3>
          <span className="module-subtitle">Fee Structure (Per Academic Year)</span>
        </div>
        <div className="module-body">
          <table className="module-table">
            <thead>
              <tr>
                <th>Academic Year</th>
                <th>Phase</th>
                <th>Batch</th>
                <th>1st Year Fee</th>
                <th>2nd Year Fee</th>
                <th>3rd Year Fee</th>
                <th>4th Year Fee</th>
              </tr>
            </thead>
            <tbody>
              {feeStructure.length ? (
                feeStructure.map((row) => (
                  <tr key={row.feeId}>
                    <td>{row.academicYear}</td>
                    <td>{row.phase}</td>
                    <td>{row.batch}</td>
                    <td>{formatFee(row.year1Fee)}</td>
                    <td>{formatFee(row.year2Fee)}</td>
                    <td>{formatFee(row.year3Fee)}</td>
                    <td>{formatFee(row.year4Fee)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>No fee structure available.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="module-split">
            <div className="module-block">
              <h4>Fee Demand Summary (Without Scholarship)</h4>
              <table className="module-table compact">
                <tbody>
                  <tr>
                    <th>Arrears Amount</th>
                    <td>{feeDemand.arrears}</td>
                  </tr>
                  <tr>
                    <th>Hostel Arrears Amount</th>
                    <td>{feeDemand.hostelArrears}</td>
                  </tr>
                  <tr>
                    <th>Annual Fee</th>
                    <td>{feeDemand.annualFee}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="module-block">
              <h4>Payment History (From 2nd Year onwards)</h4>
              <table className="module-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Transaction Date & Time</th>
                    <th>Bank Name</th>
                    <th>Total Fee Paid</th>
                    <th>Payment Status</th>
                    <th>Academic Year</th>
                    <th>Payment Mode</th>
                    <th>Receipt Number</th>
                    <th>Reconciliation Status</th>
                    <th>Created Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((row) => (
                    <tr key={row.transactionId}>
                      <td>{row.transactionId}</td>
                      <td>{row.dateTime}</td>
                      <td>{row.bankName}</td>
                      <td>{row.totalPaid}</td>
                      <td>
                        <span
                          className={`status-pill ${row.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>{row.academicYear}</td>
                      <td>{row.mode}</td>
                      <td>{row.receiptNumber}</td>
                      <td>{row.reconciliation}</td>
                      <td>{row.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="module-card">
        <div className="module-header">
          <h3>Coursework / Pre-PhD Results Module</h3>
        </div>
        <div className="module-body">
          <div className="module-block">
            <h4>Pre-PhD Result (Regular)</h4>
            <div className="module-meta">
              <div>
                <strong>Exam Type:</strong> {prePhdExam.examType}
              </div>
              <div>
                <strong>Conducted Month & Year:</strong> {prePhdExam.conductedMonthYear}
              </div>
              <div>
                <strong>Certificate:</strong>{" "}
                <a className="doc-link" href="#">
                  {prePhdExam.certificateLabel}
                </a>
              </div>
            </div>
            <table className="module-table">
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th>Subject Code</th>
                  <th>Conducted On (Month-Year)</th>
                  <th>Semester</th>
                  <th>Grade / Result</th>
                </tr>
              </thead>
              <tbody>
                {prePhdExam.subjects.map((subject) => (
                  <tr key={subject.code}>
                    <td>{subject.name}</td>
                    <td>{subject.code}</td>
                    <td>{subject.conductedOn}</td>
                    <td>{subject.semester}</td>
                    <td>
                      <span className="badge">{subject.grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="module-card">
        <div className="module-header">
          <h3>Research Progression & Reviews Module</h3>
          <span className="module-subtitle">Progression Summary</span>
        </div>
        <div className="module-body">
          {isLoadingProgression && (
            <div className="module-loading">Loading progression summary...</div>
          )}
          {progressionError && (
            <div className="module-error">Unable to load progression summary.</div>
          )}
          {!isLoadingProgression && !progressionError && (
            <table className="module-table">
              <thead>
                <tr>
                  <th>Progression Number</th>
                  <th>Progression Title</th>
                  <th>Conducted On</th>
                  <th>RAC Member 1</th>
                  <th>RAC Member 2</th>
                  <th>View Document</th>
                  <th>Supervisor Uploaded On</th>
                  <th>DRC Approval Date & Time</th>
                  <th>Final Result</th>
                </tr>
              </thead>
              <tbody>
                {progressionSummary.map((row) => (
                  <tr key={row.number}>
                    <td>{row.number}</td>
                    <td>{row.title}</td>
                    <td>{row.conductedOn}</td>
                    <td>
                      <div>{row.rac1.id}</div>
                      <div className="muted">{row.rac1.name}</div>
                    </td>
                    <td>
                      <div>{row.rac2.id}</div>
                      <div className="muted">{row.rac2.name}</div>
                    </td>
                    <td>
                      <a className="doc-link" href="#">
                        {row.documentLabel}
                      </a>
                    </td>
                    <td>{row.supervisorUploadedOn}</td>
                    <td>{row.drcApprovalOn}</td>
                    <td>
                      <span
                        className={`status-pill ${row.finalResult
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {row.finalResult}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="module-block">
            <h4>Scholar’s RAC Ongoing Online Review Reports</h4>
            {isLoadingReviewCycles && (
              <div className="module-loading">Loading review cycles...</div>
            )}
            {reviewCyclesError && (
              <div className="module-error">Unable to load review cycles.</div>
            )}
            {!isLoadingReviewCycles && !reviewCyclesError && (
              <table className="module-table">
                <thead>
                  <tr>
                    <th>Review Month & Year</th>
                    <th>Review Type</th>
                    <th>Scholar Status</th>
                    <th>Submitted On</th>
                    <th>Absent</th>
                    <th>Supervisor Status</th>
                    <th>Submitted On</th>
                    <th>RAC Member 1 Status</th>
                    <th>Submitted On</th>
                    <th>RAC Member 2 Status</th>
                    <th>Submitted On</th>
                    <th>DRC Status</th>
                    <th>Reviewed On</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewCycles.map((row) => (
                    <tr key={row.reviewMonthYear}>
                      <td>{row.reviewMonthYear}</td>
                      <td>{row.reviewType}</td>
                      <td>
                        <span
                          className={`status-pill ${row.scholarStatus
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {row.scholarStatus}
                        </span>
                      </td>
                      <td>{row.scholarSubmittedOn}</td>
                      <td>{row.scholarAbsent}</td>
                      <td>
                        <span
                          className={`status-pill ${row.supervisorStatus
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {row.supervisorStatus}
                        </span>
                      </td>
                      <td>{row.supervisorSubmittedOn}</td>
                      <td>
                        <span
                          className={`status-pill ${row.rac1Status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {row.rac1Status}
                        </span>
                      </td>
                      <td>{row.rac1SubmittedOn}</td>
                      <td>
                        <span
                          className={`status-pill ${row.rac2Status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {row.rac2Status}
                        </span>
                      </td>
                      <td>{row.rac2SubmittedOn}</td>
                      <td>
                        <span
                          className={`status-pill ${row.drcStatus
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {row.drcStatus}
                        </span>
                      </td>
                      <td>{row.drcReviewedOn}</td>
                      <td>
                        <span
                          className={`status-pill ${row.outcome
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {row.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="module-block">
            <h4>Review States Supported</h4>
            <div className="state-list">
              <span className="status-pill submitted">Submitted</span>
              <span className="status-pill reviewed">Reviewed</span>
              <span className="status-pill pending">Pending</span>
              <span className="status-pill absent">Absent</span>
              <span className="status-pill muted">--</span>
            </div>
          </div>
        </div>
      </div>
      <div className="module-card">
        <div className="module-header">
          <h3>Document & Interaction Layer</h3>
        </div>
        <div className="module-body">
          {isLoadingDocuments && (
            <div className="module-loading">Loading document records...</div>
          )}
          {documentsError && (
            <div className="module-error">Unable to load document records.</div>
          )}
          {!isLoadingDocuments && !documentsError && (
            <table className="module-table">
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Uploaded File</th>
                  <th>Uploaded By</th>
                  <th>Uploaded On</th>
                  <th>Version Number</th>
                  <th>Locked After Approval</th>
                  <th>Visibility Scope</th>
                </tr>
              </thead>
              <tbody>
                {documentRecords.map((doc) => (
                  <tr key={doc.file}>
                    <td>{doc.type}</td>
                    <td>
                      <a className="doc-link" href="#">
                        {doc.file}
                      </a>
                    </td>
                    <td>{doc.uploadedBy}</td>
                    <td>{doc.uploadedOn}</td>
                    <td>{doc.version}</td>
                    <td>{doc.locked}</td>
                    <td>{doc.visibility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="module-card">
        <div className="module-header">
          <h3>Timeline & Audit</h3>
        </div>
        <div className="module-body">
          {isLoadingAudit && (
            <div className="module-loading">Loading audit timeline...</div>
          )}
          {auditError && (
            <div className="module-error">Unable to load audit timeline.</div>
          )}
          {!isLoadingAudit && !auditError && (
            <table className="module-table">
              <thead>
                <tr>
                  <th>Review Cycle ID</th>
                  <th>Reviewer Role</th>
                  <th>Action Timestamp</th>
                  <th>Action Performed</th>
                  <th>Remarks / Comments</th>
                  <th>Audit Log Reference</th>
                </tr>
              </thead>
              <tbody>
                {auditTimeline.map((log) => (
                  <tr key={`${log.reviewCycleId}-${log.actionTimestamp}`}>
                    <td>{log.reviewCycleId}</td>
                    <td>{log.reviewerRole}</td>
                    <td>{log.actionTimestamp}</td>
                    <td>{log.actionPerformed}</td>
                    <td>{log.remarks}</td>
                    <td>{log.auditRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
