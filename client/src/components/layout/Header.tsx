import { Link } from "wouter";
import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useUpdateUser } from "@/hooks/use-users";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { data: user } = useUser(1);
  const updateUser = useUpdateUser();
  const { toast } = useToast();

  const handleRoleChange = (role: string) => {
    if (!user || !user.id) return;
    updateUser.mutate(
      { id: user.id, role },
      {
        onSuccess: () => {
          toast({
            title: "Role Switched",
            description: `You are now viewing as a ${role}.`,
          });
        },
      }
    );
  };

  return (
    <header className="h-16 border-b border-border bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
        
        <div className="hidden md:flex items-center gap-3">
          {/* Static logo image placeholder - using text for now or icon */}
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold font-display">G</span>
          </div>
          <span className="font-display font-semibold text-lg text-slate-900">GITAM University</span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden md:flex relative max-w-md w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-primary/20 transition-all p-0">
               <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold">
                 {user?.name?.charAt(0) || "U"}
               </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleRoleChange("scholar")}>
              Scholar View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange("supervisor")}>
              Supervisor View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange("rac")}>
              RAC Member View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
