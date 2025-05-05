import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import ExamCountdown from "@/components/dashboard/ExamCountdown";
import WeekCalendar from "@/components/calendar/WeekCalendar";
import TodaySessions from "@/components/dashboard/TodaySessions";
import StudyStats from "@/components/dashboard/StudyStats";
import CreateSessionForm from "@/components/forms/CreateSessionForm";
import CreateExamForm from "@/components/forms/CreateExamForm";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [createExamDialogOpen, setCreateExamDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateSessionSuccess = () => {
    setCreateSessionDialogOpen(false);
    toast({
      title: "Success",
      description: "Study session created successfully",
    });
  };
  
  const handleCreateExamSuccess = () => {
    setCreateExamDialogOpen(false);
    toast({
      title: "Success",
      description: "Exam created successfully",
    });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          {/* DashboardHeader */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
            <div>
              <h2 className="text-xl md:text-2xl font-medium">Dashboard</h2>
              <p className="text-sm md:text-base text-gray-500">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
            <div className="flex w-full sm:w-auto space-x-2">
              <Button 
                className="flex items-center bg-primary text-white shadow-sm w-full sm:w-auto justify-center"
                onClick={() => setCreateSessionDialogOpen(true)}
              >
                <span className="material-icons mr-1">add</span>
                New Session
              </Button>
              
              <Button 
                className="flex items-center bg-accent text-white shadow-sm w-full sm:w-auto justify-center"
                onClick={() => setCreateExamDialogOpen(true)}
              >
                <span className="material-icons mr-1">event</span>
                Add Exam
              </Button>
            </div>
          </div>

          {/* ExamCountdown Component */}
          <ExamCountdown onAddExam={() => setCreateExamDialogOpen(true)} />

          {/* WeekCalendar Component */}
          <WeekCalendar />
        </div>

        <div className="lg:w-1/3 space-y-6">
          {/* TodaySessions Component */}
          <TodaySessions />

          {/* StudyStats Component */}
          <StudyStats />
        </div>
      </div>

      {/* CreateSessionModal */}
      <Dialog open={createSessionDialogOpen} onOpenChange={setCreateSessionDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
          <div className="bg-primary/10 p-4 border-b border-primary/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <span className="material-icons">schedule</span>
                Create Study Session
              </DialogTitle>
              <p className="text-sm text-gray-600">
                Plan a new study session to help you prepare for your exams.
              </p>
            </DialogHeader>
          </div>
          <div className="p-4">
            <CreateSessionForm onSuccess={handleCreateSessionSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      {/* CreateExamModal */}
      <Dialog open={createExamDialogOpen} onOpenChange={setCreateExamDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
          <div className="bg-accent/10 p-4 border-b border-accent/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-accent">
                <span className="material-icons">event</span>
                Create Exam
              </DialogTitle>
              <p className="text-sm text-gray-600">
                Add a new exam to your schedule to keep track of important deadlines.
              </p>
            </DialogHeader>
          </div>
          <div className="p-4">
            <CreateExamForm onSuccess={handleCreateExamSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
