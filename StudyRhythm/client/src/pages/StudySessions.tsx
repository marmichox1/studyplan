import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateSessionForm from "@/components/forms/CreateSessionForm";
import { cn } from "@/lib/utils";

export default function StudySessions() {
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/sessions", { subject: subjectFilter, status: statusFilter }],
  });

  const completeSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/complete`, null);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Session completed",
        description: "Study session has been marked as completed.",
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await apiRequest("DELETE", `/api/sessions/${sessionId}`, null);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Session deleted",
        description: "Study session has been deleted successfully.",
      });
    },
  });

  const handleCreateSessionSuccess = () => {
    setCreateSessionOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    toast({
      title: "Success",
      description: "Study session created successfully",
    });
  };

  const handleCompleteSession = (sessionId: number) => {
    completeSessionMutation.mutate(sessionId);
  };

  const handleDeleteSession = (sessionId: number) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-secondary";
      case "upcoming":
        return "bg-blue-100 text-primary";
      case "ongoing":
        return "bg-yellow-100 text-accent";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium">Study Sessions</h2>
        <Button
          className="flex items-center bg-primary text-white"
          onClick={() => setCreateSessionOpen(true)}
        >
          <span className="material-icons mr-1">add</span>
          New Session
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-lg font-medium">All Sessions</h3>
            <div className="flex gap-2">
              <Select
                value={subjectFilter}
                onValueChange={setSubjectFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length > 0 ? (
                  sessions.map((session: any) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div 
                            className={cn(
                              "w-3 h-3 rounded-full mr-2",
                              session.subject.name === "Mathematics" ? "bg-primary" :
                              session.subject.name === "Computer Science" ? "bg-secondary" :
                              session.subject.name === "Physics" ? "bg-accent" :
                              session.subject.name === "Chemistry" ? "bg-danger" : "bg-gray-400"
                            )}
                          />
                          {session.subject.name}
                        </div>
                      </TableCell>
                      <TableCell>{session.topic}</TableCell>
                      <TableCell>{format(new Date(session.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                      </TableCell>
                      <TableCell>{session.durationHours} hrs</TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getStatusBadgeClasses(session.status)
                        )}>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {session.status !== 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => handleCompleteSession(session.id)}
                            >
                              <span className="material-icons text-sm mr-1">done</span>
                              Complete
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            <span className="material-icons text-sm">delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No sessions found. Create your first study session to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createSessionOpen} onOpenChange={setCreateSessionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Study Session</DialogTitle>
          </DialogHeader>
          <CreateSessionForm onSuccess={handleCreateSessionSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
