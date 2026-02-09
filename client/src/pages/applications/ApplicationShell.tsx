import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";

interface ApplicationShellProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function ApplicationShell({ title, description, children }: ApplicationShellProps) {
  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      <Sidebar className="w-64 hidden md:flex" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{title}</h1>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6">{children}</CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
