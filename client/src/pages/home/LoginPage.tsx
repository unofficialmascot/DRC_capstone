import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import type { PublicUser } from "@/lib/types";

export default function LoginPage({ onLogin }: { onLogin: (user: PublicUser) => void }) {
  const [id, setId] = useState("");
  const [idType, setIdType] = useState<"scholar" | "employee">("scholar");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const body = idType === "scholar"
        ? { scholarId: id, password }
        : { employeeId: id, password };
      const validatedInput = api.auth.login.input.parse(body);

      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validatedInput),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Login failed");
      }

      const user = api.auth.login.responses[200].parse(await res.json()) as PublicUser;
      toast({
        title: "Success",
        description: "Logged in successfully.",
      });
      onLogin(user);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column" }}>
      <header className="header">
        <div className="logo"><span style={{ fontWeight: "bold", fontSize: "18px" }}>GITAM</span></div>
        <div className="title">G-Scholar Hub</div>
      </header>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "#fff", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <h2 style={{ textAlign: "center", color: "#0b6a55", marginBottom: "30px" }}>Login to G-Scholar Hub</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Login Type</label>
              <select value={idType} onChange={(e) => setIdType(e.target.value as "scholar" | "employee")} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }} data-testid="select-id-type">
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
                placeholder={idType === "scholar" ? "e.g., GITAM-SCH-2020-118" : "e.g., EMP-SUPERVISOR-001"} 
                required 
                data-testid="input-id" 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required data-testid="input-password" />
            </div>
            <button className="submit-btn" type="submit" disabled={isSubmitting} style={{ width: "100%" }} data-testid="button-login">
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
          <div style={{ marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <a
              href="/api/auth/google/start"
              className="submit-btn"
              style={{ width: "100%", background: "#4285F4", color: "white", textAlign: "center", textDecoration: "none", padding: "10px 16px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              data-testid="button-google-login"
            >
              Sign in with Google
            </a>
          </div>
          <div style={{ marginTop: "30px", padding: "20px", background: "#f8f9fa", borderRadius: "8px" }}>
            <h4 style={{ color: "#0b6a55", marginBottom: "10px" }}>Demo Accounts</h4>
            <div style={{ fontSize: "13px", color: "#666" }}>
              <div style={{ marginBottom: "5px" }}><strong>GITAM-SCH-2020-118</strong> / password123 - Scholar</div>
              <div style={{ marginBottom: "5px" }}><strong>GITAM-SCH-2021-204</strong> / password123 - Scholar</div>
              <div style={{ marginBottom: "5px" }}><strong>EMP-SUPERVISOR-001</strong> / password123 - Supervisor</div>
              <div style={{ marginBottom: "5px" }}><strong>EMP-DRC-001</strong> / password123 - DRC Member</div>
              <div style={{ marginBottom: "5px" }}><strong>EMP-DRC-CONVENER-001</strong> / password123 - DRC Convener</div>
              <div style={{ marginBottom: "5px" }}><strong>EMP-DRC-CHAIRMAN-001</strong> / password123 - DRC Chairman</div>
              <div style={{ marginBottom: "5px" }}><strong>EMP-IRC-001</strong> / password123 - IRC Member</div>
              <div><strong>EMP-DOAA-001</strong> / password123 - DoAA Officer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
