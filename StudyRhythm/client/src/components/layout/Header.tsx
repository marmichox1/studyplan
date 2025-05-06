import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar?: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const isMobile = useMobile();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Create user initials from username or email
  const getUserInitials = () => {
    if (!user) return "";
    
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return "U";
  };

  return (
    <header className="h-16 border-b border-[#DADCE0] bg-white shadow-sm z-10 flex items-center justify-between px-4">
      <div className="flex items-center">
        {isMobile ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-4 rounded-full md:hidden" 
            onClick={toggleSidebar}
          >
            <span className="material-icons">menu</span>
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-4 rounded-full hidden md:flex"
            onClick={toggleSidebar}
          >
            <span className="material-icons">menu</span>
          </Button>
        )}
        <h1 className="text-xl font-medium text-primary">SARA StudyPlan</h1>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <Button variant="ghost" size="icon" className="rounded-full hidden md:flex">
          <span className="material-icons">notifications</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="w-8 h-8 bg-primary text-white cursor-pointer">
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/profile" className="flex items-center">
                <span className="material-icons mr-2 text-sm">person</span>
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-500" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <span className="material-icons mr-2 text-sm">logout</span>
              <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
