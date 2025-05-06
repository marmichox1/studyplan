import { useQuery } from "@tanstack/react-query";
import { differenceInDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface ExamCountdownProps {
  onAddExam?: () => void;
}

export default function ExamCountdown({ onAddExam }: ExamCountdownProps) {
  const [_, setLocation] = useLocation();
  interface Exam {
    id: number;
    title: string;
    date: string;
    subject: {
      id: number;
      name: string;
      color: string;
    };
  }

  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ["/api/exams/upcoming"],
  });

  const getSubjectColor = (subject: string) => {
    const colors = {
      Mathematics: {
        bg: "from-blue-50",
        dot: "bg-primary",
        progress: "bg-primary",
        days: "text-primary",
      },
      "Computer Science": {
        bg: "from-green-50",
        dot: "bg-secondary",
        progress: "bg-secondary",
        days: "text-secondary",
      },
      Physics: {
        bg: "from-yellow-50",
        dot: "bg-accent",
        progress: "bg-accent",
        days: "text-accent",
      },
      Chemistry: {
        bg: "from-red-50",
        dot: "bg-danger",
        progress: "bg-danger",
        days: "text-danger",
      },
    };

    return colors[subject as keyof typeof colors] || {
      bg: "from-gray-50",
      dot: "bg-gray-400",
      progress: "bg-gray-400",
      days: "text-gray-500",
    };
  };

  const calculateDaysLeft = (examDate: string) => {
    const today = new Date();
    const date = new Date(examDate);
    return Math.max(0, differenceInDays(date, today));
  };

  // Get urgency level based on days left
  const getUrgencyLevel = (daysLeft: number) => {
    if (daysLeft <= 3) return 'high';
    if (daysLeft <= 7) return 'medium';
    return 'low';
  };

  // Get urgency styles based on urgency level
  const getUrgencyStyles = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'high':
        return {
          border: 'border-red-400',
          background: 'bg-red-50',
          text: 'text-red-600',
          icon: 'priority_high',
          label: 'Urgent'
        };
      case 'medium':
        return {
          border: 'border-amber-300',
          background: 'bg-amber-50',
          text: 'text-amber-600',
          icon: 'warning',
          label: 'Upcoming soon'
        };
      default:
        return {
          border: 'border-[#DADCE0]',
          background: '',
          text: 'text-gray-600',
          icon: 'info',
          label: 'Scheduled'
        };
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base md:text-lg font-medium">Upcoming Exams</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 flex items-center gap-1 bg-accent/10 hover:bg-accent/20 text-accent border-accent/30"
              onClick={onAddExam}
            >
              <span className="material-icons text-xs">add</span>
              <span>Add Exam</span>
            </Button>
            <Button 
              variant="link" 
              className="text-primary p-0 h-auto text-sm md:text-base"  
              onClick={() => setLocation('/exams')}
            >
              View all
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.length > 0 ? (
            exams.map((exam: Exam) => {
              const subjectColor = getSubjectColor(exam.subject.name);
              const daysLeft = calculateDaysLeft(exam.date);
              const urgencyLevel = getUrgencyLevel(daysLeft);
              const urgencyStyles = getUrgencyStyles(urgencyLevel);
              
              return (
                <div
                  key={exam.id}
                  className={cn(
                    `border rounded-lg p-4 bg-gradient-to-r to-transparent ${urgencyStyles.border}`,
                    subjectColor.bg,
                    urgencyStyles.background
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={cn("w-3 h-3 rounded-full mr-2", subjectColor.dot)}></div>
                        <span className="text-xs md:text-sm text-gray-500">{exam.subject.name}</span>
                      </div>
                      <h4 className="text-sm md:text-base font-medium mt-1">{exam.title}</h4>
                      <div className="flex flex-col md:flex-row md:items-center text-xs md:text-sm text-gray-500 mt-2">
                        <div className="flex items-center">
                          <span className="material-icons text-xs md:text-sm mr-1">calendar_today</span>
                          <span>{format(new Date(exam.date), 'MMM d, yyyy')}</span>
                        </div>
                        <span className="hidden md:inline mx-2">•</span>
                        <div className="flex items-center mt-1 md:mt-0">
                          <span className="material-icons text-xs md:text-sm mr-1">schedule</span>
                          <span>{format(new Date(exam.date), 'h:mm a')}</span>
                        </div>
                      </div>
                      {/* Urgency badge */}
                      <div className={`flex items-center gap-1 mt-2 ${urgencyStyles.text} text-xs`}>
                        <span className="material-icons text-xs">{urgencyStyles.icon}</span>
                        <span>{urgencyStyles.label}</span>
                      </div>
                    </div>
                    <div className="text-center ml-2">
                      <div className={cn(
                        "text-xl md:text-2xl font-bold", 
                        urgencyLevel === 'high' ? 'text-red-600' : 
                        urgencyLevel === 'medium' ? 'text-amber-600' : 
                        subjectColor.days
                      )}>
                        {daysLeft}
                      </div>
                      <div className="text-xs text-gray-500">days left</div>
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center p-6 border border-dashed rounded-lg">
              <div className="flex flex-col items-center justify-center">
                <span className="material-icons text-gray-300 text-4xl mb-2">event_busy</span>
                <h4 className="text-gray-700 font-medium mb-1">No upcoming exams</h4>
                <p className="text-gray-500 text-sm">Use the Add Exam button above to get started.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
