import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CreateSessionForm from "../forms/CreateSessionForm";
import { cn } from "@/lib/utils";

export default function TodaySessions() {
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const { toast } = useToast();
  const todayFormatted = format(new Date(), 'yyyy-MM-dd');

  interface Session {
    id: number;
    topic: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    completedAt: string | null;
    completedTopicsCount: number;
    totalTopicsCount: number;
    subject: {
      id: number;
      name: string;
      color: string;
    };
  }

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions/today"],
  });

  const completeSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/complete`, null);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Session completed",
        description: "Your study session has been marked as completed.",
      });
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/start`, null);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
      toast({
        title: "Session started",
        description: "Your study session has been started.",
      });
    },
  });

  const handleStartSession = (sessionId: number) => {
    startSessionMutation.mutate(sessionId);
  };

  const handleCompleteSession = (sessionId: number) => {
    completeSessionMutation.mutate(sessionId);
  };

  const handleCreateSessionSuccess = () => {
    setCreateSessionDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
    toast({
      title: "Success",
      description: "Study session created successfully",
    });
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base md:text-lg font-medium">Today's Sessions</h3>
            <Button 
              variant="ghost" 
              className="text-xs md:text-sm text-primary p-0 h-auto"
              onClick={() => setCreateSessionDialogOpen(true)}
            >
              + Add
            </Button>
          </div>
          <div className="space-y-3">
            {sessions.length > 0 ? (
              sessions.map((session: Session) => {
                const isCompleted = session.completedAt !== null;
                const subjectColors = {
                  Mathematics: "bg-primary",
                  "Computer Science": "bg-secondary",
                  Physics: "bg-accent",
                  Chemistry: "bg-danger",
                };
                
                const subjectColor = subjectColors[session.subject.name as keyof typeof subjectColors] || "bg-gray-400";
                
                return (
                  <div 
                    key={session.id} 
                    className={cn(
                      "border border-[#DADCE0] rounded-lg p-3 hover:shadow-sm transition-shadow",
                      isCompleted && "bg-green-50"
                    )}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${subjectColor} mr-1.5 md:mr-2 flex-shrink-0`}></div>
                        <span className="text-xs md:text-sm text-gray-500 truncate max-w-[100px] xs:max-w-none">{session.subject.name}</span>
                      </div>
                      <div className="flex items-center">
                        {isCompleted ? (
                          <>
                            <span className="material-icons text-secondary text-xs md:text-sm mr-1">done</span>
                            <span className="text-xs text-secondary">Completed</span>
                          </>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-auto p-1">
                            <span className="material-icons text-gray-400 hover:text-gray-600 text-sm md:text-base">more_horiz</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm md:text-base font-medium mt-1 truncate">{session.topic}</h4>
                    <div className="flex flex-col xs:flex-row md:items-center text-xs md:text-sm text-gray-500 mt-2">
                      <div className="flex items-center">
                        <span className="material-icons text-xs md:text-sm mr-1">schedule</span>
                        <span>
                          {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                        </span>
                      </div>
                      <span className="hidden xs:inline mx-2">•</span>
                      <span className="ml-5 xs:ml-0">{session.durationHours} hours</span>
                    </div>
                    <div className="flex flex-col xs:flex-row justify-between mt-3 gap-2 xs:gap-0">
                      <div className="flex items-center">
                        {isCompleted ? (
                          <div className="flex items-center">
                            <span className="material-icons text-xs md:text-sm mr-1 text-secondary">check_circle</span>
                            <span className="text-xs text-secondary">
                              {session.completedTopicsCount}/{session.totalTopicsCount} topics completed
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="material-icons text-xs md:text-sm mr-1 text-gray-500">note</span>
                            <span className="text-xs text-gray-500">{session.totalTopicsCount} topics planned</span>
                          </div>
                        )}
                      </div>
                      {isCompleted ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-white hover:bg-gray-100 text-xs px-3 py-1 rounded-full text-gray-500 border border-gray-200 h-auto w-full xs:w-auto"
                        >
                          Review
                        </Button>
                      ) : (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="bg-[#F1F3F4] hover:bg-gray-200 text-xs px-3 py-1 rounded-full h-auto text-[#202124] w-full xs:w-auto"
                          onClick={() => handleStartSession(session.id)}
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg border-gray-300">
                <p className="text-gray-500 mb-2">No sessions scheduled for today</p>
                <Button 
                  onClick={() => setCreateSessionDialogOpen(true)}
                  className="bg-primary text-white"
                >
                  Create a Session
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createSessionDialogOpen} onOpenChange={setCreateSessionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Study Session</DialogTitle>
          </DialogHeader>
          <CreateSessionForm onSuccess={handleCreateSessionSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
