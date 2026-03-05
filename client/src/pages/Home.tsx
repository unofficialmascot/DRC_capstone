import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import type { PublicUser } from "@/lib/types";
import LoginPage from "@/pages/home/LoginPage";
import HomeDashboard from "@/pages/home/HomeDashboard";
import "../styles/gscholar.css";

export default function Home() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadSessionUser = async () => {
      try {
        const response = await fetch(api.auth.me.path, { credentials: "include" });

        if (response.ok) {
          const data = api.auth.me.responses[200].parse(await response.json()) as PublicUser;
          setUser(data);
          return;
        }

        if (response.status === 401) {
          setUser(null);
          return;
        }

        toast({
          title: "Error",
          description: "Failed to restore session. Please log in again.",
          variant: "destructive",
        });
        setUser(null);
      } catch {
        toast({
          title: "Error",
          description: "Unable to reach the server. Please try again.",
          variant: "destructive",
        });
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionUser();
  }, [toast]);

  if (isLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return <HomeDashboard user={user} onLogout={() => setUser(null)} />;
}
