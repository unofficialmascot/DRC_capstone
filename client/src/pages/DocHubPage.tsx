import { useUser } from "@/hooks/use-users";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ScholarDocHub } from "@/pages/dochub/ScholarDocHub";

export function DocHubPage() {
  const { data: user } = useUser(1);

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      <Sidebar className="w-64 hidden md:flex" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {user?.id ? <ScholarDocHub user={{ id: user.id }} /> : <p className="text-muted-foreground">Loading user...</p>}
        </main>
      </div>
    </div>
  );
}
