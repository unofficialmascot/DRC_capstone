import { useEffect, useState } from "react";
import "@/styles/gscholar.css";
import type { User } from "@/types/gscholar";
import Dashboard from "@/pages/home/Dashboard";
import LoginPage from "@/pages/home/LoginPage";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
