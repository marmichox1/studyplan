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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, differenceInDays } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateExamForm from "@/components/forms/CreateExamForm";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function Exams() {
  const [createExamOpen, setCreateExamOpen] = useState(false);
  const { toast } = useToast();

  const { data: exams = [] } = useQuery({
    queryKey: ["/api/exams"],
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      const res = await apiRequest("DELETE", `/api/exams/${examId}`, null);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({
        title: "Exam deleted",
        description: "The exam has been deleted successfully.",
      });
    },
  });

  const handleCreateExamSuccess = () => {
    setCreateExamOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
    toast({
      title: "Success",
      description: "Exam created successfully",
    });
  };

  const handleDeleteExam = (examId: number) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      deleteExamMutation.mutate(examId);
    }
  };

  const getDaysLeftText = (date: string) => {
    const today = new Date();
    const examDate = new Date(date);
    const days = differenceInDays(examDate, today);
    
    if (days < 0) {
      return `Passed ${Math.abs(days)} days ago`;
    } else if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Tomorrow";
    } else {
      return `${days} days left`;
    }
  };
  
  const getDaysLeftColor = (date: string) => {
    const today = new Date();
    const examDate = new Date(date);
    const days = differenceInDays(examDate, today);
    
    if (days < 0) {
      return "text-gray-500";
    } else if (days <= 3) {
      return "text-red-500 font-medium";
    } else if (days <= 7) {
      return "text-accent font-medium";
    } else {
      return "text-primary";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium">Exams</h2>
        <Button
          className="flex items-center bg-primary text-white"
          onClick={() => setCreateExamOpen(true)}
        >
          <span className="material-icons mr-1">add</span>
          New Exam
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-4">Upcoming Exams</h3>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Countdown</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.length > 0 ? (
                  exams.map((exam: any) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div 
                            className={cn(
                              "w-3 h-3 rounded-full mr-2",
                              exam.subject.name === "Mathematics" ? "bg-primary" :
                              exam.subject.name === "Computer Science" ? "bg-secondary" :
                              exam.subject.name === "Physics" ? "bg-accent" :
                              exam.subject.name === "Chemistry" ? "bg-danger" : "bg-gray-400"
                            )}
                          />
                          {exam.subject.name}
                        </div>
                      </TableCell>
                      <TableCell>{exam.title}</TableCell>
                      <TableCell>
                        {format(new Date(exam.date), 'MMM d, yyyy')}
                        <br />
                        <span className="text-gray-500 text-sm">
                          {format(new Date(exam.date), 'h:mm a')}
                        </span>
                      </TableCell>
                      <TableCell>{exam.location || "Not specified"}</TableCell>
                      <TableCell>
                        <div className={getDaysLeftColor(exam.date)}>
                          {getDaysLeftText(exam.date)}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteExam(exam.id)}
                        >
                          <span className="material-icons text-sm">delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No exams found. Create your first exam to start planning.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createExamOpen} onOpenChange={setCreateExamOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Exam</DialogTitle>
          </DialogHeader>
          <CreateExamForm onSuccess={handleCreateExamSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
