import { useEffect, useState } from "react";
import type { PublicUser } from "@/lib/types";
import LoginPage from "@/pages/home/LoginPage";
import HomeDashboard from "@/pages/home/HomeDashboard";
import "../styles/gscholar.css";

export default function Home() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return <HomeDashboard user={user} onLogout={() => setUser(null)} />;
}
