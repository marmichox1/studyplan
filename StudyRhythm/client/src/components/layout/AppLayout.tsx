import { ReactNode, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Sidebar, { SidebarProps } from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { useMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Sidebar props
  const sidebarProps: SidebarProps = {
    isOpen: isSidebarOpen,
    setIsOpen: setIsSidebarOpen
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 h-[calc(100vh-64px)]">
        <Sidebar {...sidebarProps} />
        <main className="flex-1 overflow-y-auto bg-[#F1F3F4] pb-16 md:pb-0">
          {children}
        </main>
      </div>
      {isMobile && <MobileNav />}
    </div>
  );
}
