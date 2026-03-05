import { useMemo, useState } from "react";
import {
  type ChairmanDashboardCategory,
  useApplicationsByStage,
  useChairmanDashboard,
} from "@/hooks/use-application-reviews";
import type { PublicUser } from "@/lib/types";

interface ChairmanDashboardProps {
  user: PublicUser;
  activeSection: ChairmanSection;
}

export type ChairmanSection = "dashboard" | "rac_reviews" | "profile" | "extensions";

type ChairmanDashboardVisibleCategory = Exclude<ChairmanDashboardCategory, "extension_requests">;

const dashboardBubbles: Array<{
  key: ChairmanDashboardVisibleCategory;
  label: string;
  metricKey:
    | "total"
    | "awarded"
    | "thesisSubmitted"
    | "deregistered"
    | "terminated"
    | "reRegistered"
    | "preTalkPending";
}> = [
  { key: "total", label: "Total Scholars", metricKey: "total" },
  { key: "awarded", label: "Awarded Scholars", metricKey: "awarded" },
  { key: "thesis_submitted", label: "Thesis Submitted", metricKey: "thesisSubmitted" },
  { key: "deregistered", label: "Deregistered", metricKey: "deregistered" },
  { key: "terminated", label: "Terminated", metricKey: "terminated" },
  { key: "re_registered", label: "Re-registered", metricKey: "reRegistered" },
  { key: "pre_talk_pending", label: "Pre-Talk Pending", metricKey: "preTalkPending" },
];

const categoryTableTitle: Record<ChairmanDashboardVisibleCategory, string> = {
  total: "Total Scholars List",
  awarded: "Awarded Scholars List",
  thesis_submitted: "Thesis Submitted Scholars List",
  deregistered: "Deregistered Scholars List",
  terminated: "Terminated Scholars List",
  re_registered: "Re-registered Scholars List",
  pre_talk_pending: "Pre-Talk Pending Scholars List",
};

function formatMetricCount(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatDate(value: unknown): string {
  if (!value) {
    return "-";
  }

  return new Date(String(value)).toLocaleDateString();
}

export default function ChairmanDashboard({ user, activeSection }: ChairmanDashboardProps) {
  const [activeCategory, setActiveCategory] = useState<ChairmanDashboardVisibleCategory>("total");

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useChairmanDashboard(activeCategory, activeSection === "dashboard");

  const {
    data: racReviews = [],
    isLoading: isRacLoading,
    error: racError,
  } = useApplicationsByStage("drc", activeSection === "rac_reviews");

  const {
    data: extensionData,
    isLoading: isExtensionsLoading,
    error: extensionsError,
  } = useChairmanDashboard("extension_requests", activeSection === "extensions");

  const rows = dashboardData?.rows ?? [];

  const profileMatrix = useMemo(() => {
    const chairmanName = user.name || "N/A";
    const chairmanId = user.employeeId || "N/A";
    const email = user.email || "N/A";
    const location = user.department || "DRC OFFICE";

    return {
      chairmanName,
      chairmanId,
      email,
      location,
    };
  }, [user]);

  const renderDashboardSection = () => (
    <>
      <h2 style={{ marginBottom: "22px", color: "#0b6a55" }}>Chairman Dashboard</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "26px",
        }}
      >
        {dashboardBubbles.map((bubble) => {
          const isActive = activeCategory === bubble.key;
          const metricValue = dashboardData?.metrics[bubble.metricKey] ?? 0;

          return (
            <button
              key={bubble.key}
              type="button"
              onClick={() => setActiveCategory(bubble.key)}
              style={{
                background: isActive ? "#e6f3ef" : "#ffffff",
                border: isActive ? "2px solid #0b6a55" : "1px solid #e1e5e9",
                borderRadius: "12px",
                minHeight: "124px",
                padding: "20px 12px",
                cursor: "pointer",
                textAlign: "center",
              }}
              data-testid={`chairman-bubble-${bubble.key}`}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "36px",
                  fontWeight: 800,
                  color: "#0b6a55",
                  lineHeight: 1,
                }}
              >
                {formatMetricCount(metricValue)}
              </span>
              <span
                style={{
                  display: "block",
                  marginTop: "10px",
                  fontSize: "12px",
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "#5f6368",
                }}
              >
                {bubble.label}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e1e5e9", borderRadius: "10px", padding: "20px" }}>
        <div style={{ marginBottom: "14px", display: "inline-block", borderBottom: "2px solid #f4b400", paddingBottom: "8px", color: "#0b6a55", fontWeight: 700 }}>
          {categoryTableTitle[activeCategory]}
        </div>

        {isLoading ? (
          <div style={{ color: "#666" }}>Loading dashboard data...</div>
        ) : error ? (
          <div style={{ color: "#c0392b" }}>Failed to load dashboard data.</div>
        ) : rows.length === 0 ? (
          <div style={{ color: "#666" }}>No scholar records found for this category.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Reg. No</th>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Scholar Name</th>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Department</th>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.scholarId}-${row.status}`}>
                  <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{row.scholarId}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{row.scholarName}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{row.department || "-"}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderProfileSection = () => (
    <>
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e1e5e9", padding: "22px", display: "flex", gap: "26px", marginBottom: "20px" }}>
        <div style={{ width: "170px", textAlign: "center" }}>
          <div style={{ width: "150px", height: "150px", borderRadius: "8px", background: "#ddd", margin: "0 auto 10px" }} />
          <span style={{ fontSize: "13px", color: "#666" }}>Change Photo</span>
        </div>

        <div style={{ flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "10px", borderBottom: "1px solid #eee" }}>Details</th>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "10px", borderBottom: "1px solid #eee" }}>Chairman</th>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "10px", borderBottom: "1px solid #eee" }}>Director</th>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "10px", borderBottom: "1px solid #eee" }}>Dean</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>Name</td>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{profileMatrix.chairmanName}</td>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>-</td>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>-</td>
              </tr>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>ID</td>
                <td colSpan={3} style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{profileMatrix.chairmanId}</td>
              </tr>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>Location</td>
                <td colSpan={3} style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{profileMatrix.location}</td>
              </tr>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>Email</td>
                <td colSpan={3} style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{profileMatrix.email}</td>
              </tr>
              <tr>
                <td style={{ padding: "10px" }}>Status</td>
                <td colSpan={2} style={{ padding: "10px" }}>Active Term</td>
                <td style={{ padding: "10px" }}>
                  <span style={{ background: "#27ae60", color: "#fff", borderRadius: "999px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>
                    Active
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e1e5e9", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ color: "#0b6a55", margin: 0 }}>Personal Details</h3>
          <button type="button" style={{ background: "#f4b400", border: "none", borderRadius: "6px", padding: "8px 18px", fontWeight: 700, cursor: "pointer" }}>
            Edit Info
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", fontSize: "14px" }}>
          <div><strong>Employee No:</strong> {user.employeeId || "N/A"}</div>
          <div><strong>Date of Birth:</strong> N/A</div>
          <div><strong>Appointment:</strong> N/A</div>
          <div><strong>Personal Mobile:</strong> {user.phone || "N/A"}</div>
          <div><strong>Personal Email:</strong> {user.email || "N/A"}</div>
          <div><strong>Nationality:</strong> N/A</div>
        </div>
      </div>
    </>
  );

  const renderRacReviewsSection = () => (
    <div style={{ background: "#fff", border: "1px solid #e1e5e9", borderRadius: "10px", padding: "20px" }}>
      <h2 style={{ margin: "0 0 12px", color: "#0b6a55" }}>RAC Reviews</h2>
      <p style={{ margin: "0 0 14px", color: "#666" }}>Live list of applications currently pending at DRC stage.</p>

      {isRacLoading ? (
        <div style={{ color: "#666" }}>Loading RAC reviews...</div>
      ) : racError ? (
        <div style={{ color: "#c0392b" }}>Failed to load RAC reviews.</div>
      ) : racReviews.length === 0 ? (
        <div style={{ color: "#666" }}>No pending RAC reviews found.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr>
              <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Application ID</th>
              <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Scholar ID</th>
              <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Type</th>
              <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Submitted</th>
              <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {racReviews.map((application) => (
              <tr key={application.id}>
                <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>#{application.id}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{application.scholarId}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{application.type}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{formatDate(application.submissionDate)}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{application.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderExtensionsSection = () => {
    const extensionRows = extensionData?.rows ?? [];
    const extensionCount = extensionData?.metrics.extensionRequests ?? 0;

    return (
      <div style={{ background: "#fff", border: "1px solid #e1e5e9", borderRadius: "10px", padding: "20px" }}>
        <h2 style={{ margin: "0 0 12px", color: "#0b6a55" }}>Extension Requests</h2>
        <p style={{ margin: "0 0 14px", color: "#666" }}>
          Active extension requests requiring chairman visibility. Total: <strong>{extensionCount}</strong>
        </p>

        {isExtensionsLoading ? (
          <div style={{ color: "#666" }}>Loading extension requests...</div>
        ) : extensionsError ? (
          <div style={{ color: "#c0392b" }}>Failed to load extension requests.</div>
        ) : extensionRows.length === 0 ? (
          <div style={{ color: "#666" }}>No extension requests found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Scholar ID</th>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Scholar Name</th>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Department</th>
                <th style={{ background: "#f8fafc", textAlign: "left", padding: "12px", borderBottom: "2px solid #eee" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {extensionRows.map((row) => (
                <tr key={`${row.scholarId}-${row.status}`}>
                  <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{row.scholarId}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{row.scholarName}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{row.department || "-"}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "calc(100vh - 120px)" }}>
      <section>
        {activeSection === "dashboard" && renderDashboardSection()}
        {activeSection === "profile" && renderProfileSection()}
        {activeSection === "rac_reviews" && renderRacReviewsSection()}
        {activeSection === "extensions" && renderExtensionsSection()}
      </section>
    </div>
  );
}
