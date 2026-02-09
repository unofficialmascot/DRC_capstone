import { useState } from "react";
import type { User } from "@/types/gscholar";

interface FormProps {
  user: User;
  onSubmit: (details: Record<string, unknown>) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function SupervisorChangeForm({
  user,
  onSubmit,
  onBack,
  isSubmitting,
}: FormProps) {
  const [formData, setFormData] = useState({
    scholarName: user.name,
    department: user.department || "Computer Science",
    regdNo: user.scholarId || "",
    joiningDate: user.joiningDate || "",
    currentSupervisor: user.supervisor || "",
    proposedSupervisor: "",
    reason: "",
  });
  return (
    <div className="form-container">
      <div className="form-header">
        <div className="form-header-title">
          GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)
        </div>
        <div className="form-header-subtitle">(DEEMED TO BE UNIVERSITY)</div>
      </div>
      <div className="form-title">Request for Change/Addition of Supervisor(s)</div>
      <div className="form-group">
        <label>Name of the Scholar</label>
        <input
          type="text"
          value={formData.scholarName}
          onChange={(e) =>
            setFormData({ ...formData, scholarName: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Department</label>
        <input
          type="text"
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Regd. No.</label>
        <input
          type="text"
          value={formData.regdNo}
          onChange={(e) =>
            setFormData({ ...formData, regdNo: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Current Supervisor</label>
        <input
          type="text"
          value={formData.currentSupervisor}
          onChange={(e) =>
            setFormData({ ...formData, currentSupervisor: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Proposed New Supervisor</label>
        <input
          type="text"
          value={formData.proposedSupervisor}
          onChange={(e) =>
            setFormData({ ...formData, proposedSupervisor: e.target.value })
          }
          placeholder="Enter name of proposed supervisor"
          data-testid="input-proposed-supervisor"
        />
      </div>
      <div className="form-group">
        <label>Reason/Justification</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Please provide detailed reason"
          className="form-textarea form-textarea-lg"
        />
      </div>
      <div className="form-actions">
        <button
          className="submit-btn"
          onClick={() => onSubmit(formData)}
          disabled={isSubmitting}
          data-testid="button-submit-form"
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
        <button className="submit-btn btn-secondary" onClick={onBack}>
          Back to Tracking
        </button>
      </div>
    </div>
  );
}

export function PreTalkForm({ user, onSubmit, onBack, isSubmitting }: FormProps) {
  const [formData, setFormData] = useState({
    department: user.department || "Computer Science",
    scholarName: user.name,
    regdNo: user.scholarId || "",
    researchTopic: user.researchTitle || "",
    preTalkDate: "",
    venue: "Seminar Hall",
  });
  return (
    <div className="form-container">
      <div className="form-header">
        <div className="form-header-title">
          GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)
        </div>
      </div>
      <div className="form-title">Research Form -V: Ph.D. Pre-Submission Talk Report</div>
      <div className="form-group">
        <label>Department</label>
        <input
          type="text"
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Name of Research Scholar</label>
        <input
          type="text"
          value={formData.scholarName}
          onChange={(e) =>
            setFormData({ ...formData, scholarName: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Topic of Research Work</label>
        <input
          type="text"
          value={formData.researchTopic}
          onChange={(e) =>
            setFormData({ ...formData, researchTopic: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Date of Pre-talk Seminar</label>
        <input
          type="date"
          value={formData.preTalkDate}
          onChange={(e) =>
            setFormData({ ...formData, preTalkDate: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Venue</label>
        <input
          type="text"
          value={formData.venue}
          onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
        />
      </div>
      <div className="form-actions">
        <button className="submit-btn" onClick={() => onSubmit(formData)} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
        <button className="submit-btn btn-secondary" onClick={onBack}>
          Back to Tracking
        </button>
      </div>
    </div>
  );
}

export function ExtensionForm({ user, onSubmit, onBack, isSubmitting }: FormProps) {
  const [formData, setFormData] = useState({
    candidateName: user.name,
    joiningDate: user.joiningDate || "",
    extensionDuration: "",
    reason: "",
    timeline: "",
  });
  return (
    <div className="form-container">
      <div className="form-header">
        <div className="form-header-title">
          GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)
        </div>
      </div>

      <div className="form-title">Application for Extension of Ph.D. Program Duration</div>
      <div className="form-group">
        <label>Name of the Candidate</label>
        <input
          type="text"
          value={formData.candidateName}
          onChange={(e) =>
            setFormData({ ...formData, candidateName: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Date of Joining</label>
        <input
          type="text"
          value={formData.joiningDate}
          onChange={(e) =>
            setFormData({ ...formData, joiningDate: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Required Extension Duration</label>
        <input
          type="text"
          value={formData.extensionDuration}
          onChange={(e) =>
            setFormData({ ...formData, extensionDuration: e.target.value })
          }
          placeholder="e.g., 6 months"
        />
      </div>
      <div className="form-group">
        <label>Reason for Extension</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Explain why you need the extension"
          className="form-textarea"
        />
      </div>
      <div className="form-group">
        <label>Expected Timeline</label>
        <textarea
          value={formData.timeline}
          onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
          placeholder="When do you expect to complete?"
          className="form-textarea"
        />
      </div>
      <div className="form-actions">
        <button className="submit-btn" onClick={() => onSubmit(formData)} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
        <button className="submit-btn btn-secondary" onClick={onBack}>
          Back to Tracking
        </button>
      </div>
    </div>
  );
}

export function ReRegistrationForm({
  user,
  onSubmit,
  onBack,
  isSubmitting,
}: FormProps) {
  const [formData, setFormData] = useState({
    scholarName: user.name,
    regNo: user.scholarId || "",
    joiningDate: user.joiningDate || "",
    department: user.department || "",
    mobile: user.phone || "",
    email: user.email,
  });
  return (
    <div className="form-container">
      <div className="form-header">
        <div className="form-header-title">GITAM SCHOOL OF TECHNOLOGY</div>
      </div>
      <div className="form-title">Ph.D (FT/PT) Re-Registration form</div>
      <div className="form-group">
        <label>Name of the Scholar</label>
        <input
          type="text"
          value={formData.scholarName}
          onChange={(e) =>
            setFormData({ ...formData, scholarName: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Reg. No.</label>
        <input
          type="text"
          value={formData.regNo}
          onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Date of Joining</label>
        <input
          type="text"
          value={formData.joiningDate}
          onChange={(e) =>
            setFormData({ ...formData, joiningDate: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Name of the Dept. & School</label>
        <input
          type="text"
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Mobile No.</label>
        <input
          type="text"
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>E-mail</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div className="form-actions">
        <button className="submit-btn" onClick={() => onSubmit(formData)} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
        <button className="submit-btn btn-secondary" onClick={onBack}>
          Back to Tracking
        </button>
      </div>
    </div>
  );
}
