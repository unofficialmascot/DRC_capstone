import { useState } from "react";
import type { User } from "@/types/gscholar";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [id, setId] = useState("");
  const [idType, setIdType] = useState<"scholar" | "employee">("scholar");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const body =
        idType === "scholar"
          ? { scholarId: id, password }
          : { employeeId: id, password };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Login failed");
      }

      const user = await res.json();
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <header className="header">
        <div className="logo">
          <span className="header-logo-text">GITAM</span>
        </div>
        <div className="title">G-Scholar Hub</div>
      </header>
      <div className="login-main">
        <div className="login-card">
          <h2 className="login-title">Login to G-Scholar Hub</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Login Type</label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value as "scholar" | "employee")}
                className="login-select"
                data-testid="select-id-type"
              >
                <option value="scholar">Scholar</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div className="form-group">
              <label>{idType === "scholar" ? "Scholar ID" : "Employee ID"}</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={
                  idType === "scholar"
                    ? "e.g., GITAM-SCH-2020-118"
                    : "e.g., EMP-SUPERVISOR-001"
                }
                required
                data-testid="input-id"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                data-testid="input-password"
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button
              className="submit-btn login-submit"
              type="submit"
              disabled={isSubmitting}
              data-testid="button-login"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
          <div className="login-demo-box">
            <h4 className="login-demo-title">Demo Accounts</h4>
            <div className="login-demo-list">
              <div>
                <strong>GITAM-SCH-2020-118</strong> / password123 - Scholar
              </div>
              <div>
                <strong>GITAM-SCH-2021-204</strong> / password123 - Scholar
              </div>
              <div>
                <strong>EMP-SUPERVISOR-001</strong> / password123 - Supervisor
              </div>
              <div>
                <strong>EMP-DRC-001</strong> / password123 - DRC Member
              </div>
              <div>
                <strong>EMP-IRC-001</strong> / password123 - IRC Member
              </div>
              <div>
                <strong>EMP-DOAA-001</strong> / password123 - DoAA Officer
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
