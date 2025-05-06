import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import CreateSessionForm from "../forms/CreateSessionForm";

export default function MobileNav() {
  const [location] = useLocation();
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const { toast } = useToast();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "dashboard" },
    { path: "/calendar", label: "Calendar", icon: "calendar_today" },
    { path: "/sessions", label: "Sessions", icon: "assignment" },
    { path: "/exams", label: "Exams", icon: "event" },
  ];

  const handleNewSessionClick = useCallback(() => {
    setNewSessionOpen(true);
  }, []);

  const handleFormSubmitSuccess = useCallback(() => {
    setNewSessionOpen(false);
    toast({
      title: "Success",
      description: "Study session created successfully",
    });
  }, [toast]);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#DADCE0] flex justify-around py-2 z-10">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={cn(
              "flex flex-col items-center p-2",
              location === item.path ? "text-primary" : "text-gray-500"
            )}
          >
            <span className="material-icons">{item.icon}</span>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
        <Button
          variant="ghost"
          className="flex flex-col items-center p-2 text-gray-500"
          onClick={handleNewSessionClick}
        >
          <span className="material-icons">add_circle</span>
          <span className="text-xs mt-1">New</span>
        </Button>
      </div>

      <Dialog open={newSessionOpen} onOpenChange={setNewSessionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Study Session</DialogTitle>
          </DialogHeader>
          <CreateSessionForm onSuccess={handleFormSubmitSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
