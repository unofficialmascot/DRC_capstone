import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

interface GenericInfoPageProps {
  title: string;
  description: string;
}

export function GenericInfoPage({ title, description }: GenericInfoPageProps) {
  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      <Sidebar className="w-64 hidden md:flex" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
