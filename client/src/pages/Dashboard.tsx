import { useUser } from "@/hooks/use-users";
import { useStats } from "@/hooks/use-stats";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, BookOpen, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: user } = useUser(1);
  const { data: stats } = useStats(1);

  // If role is Scholar, redirect to Profile is usually preferred, but let's show a summary dashboard
  // For this demo, we'll build a generic dashboard that adapts slightly

  const statCards = [
    {
      title: "Completed Reviews",
      value: stats?.completedReviews || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Pending Reports",
      value: stats?.pendingReports || 0,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      title: "Publications",
      value: stats?.publications || 0,
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Applications",
      value: 2, // Mock data
      icon: FileText,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden font-sans">
      <Sidebar className="w-64 hidden md:flex" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold text-slate-900">
                  Welcome back, {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-muted-foreground mt-1">Here is what's happening with your research today.</p>
              </div>
              <Button asChild className="hidden sm:flex bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Link href="/applications/track">
                  New Application <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, i) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-border/50 hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <span className="text-3xl font-bold font-display text-slate-800">{stat.value}</span>
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-500">{stat.title}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity / Applications */}
              <Card className="lg:col-span-2 border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Recent Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-slate-900">Leave Application</h4>
                            <p className="text-xs text-muted-foreground">Submitted on Oct 2{i}, 2024</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4 text-primary" asChild>
                    <Link href="/applications/track">View All Applications</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Links / Notices */}
              <div className="space-y-6">
                <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                   <CardHeader>
                     <CardTitle className="text-white">Notice Board</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4 relative z-10">
                     <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                       <p className="text-xs font-medium text-primary-foreground/70 mb-1">Oct 24, 2024</p>
                       <p className="text-sm font-medium">Deadline for RAC report submission extended.</p>
                     </div>
                     <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                       <p className="text-xs font-medium text-primary-foreground/70 mb-1">Oct 20, 2024</p>
                       <p className="text-sm font-medium">Annual Research Convention announced.</p>
                     </div>
                     <Button variant="secondary" size="sm" className="w-full mt-2" asChild>
                       <Link href="/notices">View All Notices</Link>
                     </Button>
                   </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-20 flex-col gap-2 hover:border-primary hover:text-primary transition-all">
                      <ExternalLink className="w-5 h-5" />
                      <span className="text-xs">Doc-Hub</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2 hover:border-primary hover:text-primary transition-all">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-xs">Repository</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
