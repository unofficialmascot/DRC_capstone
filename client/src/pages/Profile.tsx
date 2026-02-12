import { useParams } from "wouter";
import { useUser } from "@/hooks/use-users";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const userId = id ? parseInt(id, 10) : undefined;
  const { data: user, isLoading, error } = useUser(userId);

  if (!userId || isNaN(userId)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        Invalid user ID. Please provide a valid user ID in the URL.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50 text-red-500">
        Error loading profile. Please try again.
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      <Sidebar className="w-64 hidden md:flex" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-8">
              {user?.name ? `${user.name}'s Profile` : 'Profile'}
            </h1>
            
            {isLoading ? (
              <ProfileSkeleton />
            ) : user && 'id' in user && user.id ? (
              <ProfileCard user={user as any} />
            ) : (
              <div>User not found</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
      <div className="md:col-span-2 space-y-6">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    </div>
  );
}
