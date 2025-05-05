import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient as useQueryClientTanStack } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Subject } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import CreateSubjectForm from "../forms/CreateSubjectForm";
import { useState } from "react";

export interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [createSubjectDialogOpen, setCreateSubjectDialogOpen] = useState(false);
  
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });
  
  const queryClient = useQueryClientTanStack();
  const { toast } = useToast();

  const handleCreateSubjectSuccess = (newSubject: any) => {
    setCreateSubjectDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
    
    toast({
      title: "Subject created",
      description: `${newSubject.name} has been successfully created.`
    });
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: "dashboard" },
    { path: "/calendar", label: "Calendar", icon: "calendar_today" },
    { path: "/sessions", label: "Study Sessions", icon: "assignment" },
    { path: "/exams", label: "Exams", icon: "event" },
    { path: "/subjects", label: "Manage Subjects", icon: "bookmark" },
  ];

  const subjectColors = {
    Mathematics: "bg-primary",
    "Computer Science": "bg-secondary",
    Physics: "bg-accent",
    Chemistry: "bg-danger",
  };
  
  const SidebarContent = () => (
    <nav className="pt-4">
      <ul>
        {navItems.map((item) => (
          <li key={item.path} className="px-3 py-2">
            <Link 
              href={item.path}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg",
                location === item.path
                  ? "text-primary font-medium bg-blue-50"
                  : "text-[#202124] hover:bg-[#F1F3F4]"
              )}
              onClick={() => isMobile && setIsOpen(false)}
            >
              <span className="material-icons mr-3">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-[#DADCE0] my-4"></div>
      <div className="px-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-500">SUBJECTS</h3>
          <Link 
            href="/subjects"
            className="text-xs text-primary hover:underline"
            onClick={() => isMobile && setIsOpen(false)}
          >
            Manage
          </Link>
        </div>
        <ul>
          {subjects.map((subject) => (
            <li key={subject.id} className="flex items-center py-1">
              <div
                className={cn(
                  "w-3 h-3 rounded-full mr-2",
                  subjectColors[subject.name as keyof typeof subjectColors] || "bg-gray-400"
                )}
                style={{ backgroundColor: subject.color }}
              ></div>
              <span className="text-sm">{subject.name}</span>
            </li>
          ))}
          <li className="py-1">
            <button 
              className="text-sm text-primary flex items-center hover:underline cursor-pointer"
              onClick={() => setCreateSubjectDialogOpen(true)}
            >
              <span className="material-icons text-sm mr-1">add</span>
              Add subject
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-64 border-r border-[#DADCE0] bg-white hidden md:block overflow-y-auto h-full">
        <SidebarContent />
      </aside>
      
      {/* Mobile sidebar as a sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="h-16 border-b border-[#DADCE0] flex items-center px-4">
            <h1 className="text-xl font-medium text-primary">SARA StudyPlan</h1>
          </div>
          <SidebarContent />
        </SheetContent>
      </Sheet>
      
      {/* Mobile floating action button for quick actions */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden fixed bottom-20 right-4 z-20 rounded-full bg-primary text-white shadow-lg"
      >
        <span className="material-icons">add</span>
      </Button>
      
      {/* Create Subject Dialog */}
      <Dialog open={createSubjectDialogOpen} onOpenChange={setCreateSubjectDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
          <div className="bg-secondary/10 p-4 border-b border-secondary/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-secondary">
                <span className="material-icons">bookmark</span>
                Create Subject
              </DialogTitle>
              <p className="text-sm text-gray-600">
                Add a new subject to organize your study materials and track progress.
              </p>
            </DialogHeader>
          </div>
          <div className="p-4">
            <CreateSubjectForm onSuccess={handleCreateSubjectSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
