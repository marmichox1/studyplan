import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProgressOverview() {
  const [timeRange, setTimeRange] = useState("week");

  interface Subject {
    id: number;
    name: string;
    color: string;
    completedTopics: number;
    totalTopics: number;
    progress: number;
    sessionCount: number;
    totalStudyTime: string;
    lastStudied: string | null;
  }

  interface TotalProgress {
    completedTopics: number;
    totalTopics: number;
    percentage: number;
  }

  interface ProgressData {
    subjects: Subject[];
    totalProgress: TotalProgress;
  }

  const { data = { subjects: [], totalProgress: { completedTopics: 0, totalTopics: 0, percentage: 0 } } } = useQuery<ProgressData>({
    queryKey: ["/api/progress", timeRange],
  });

  const { subjects, totalProgress } = data;

  const calculateProgressWidth = (progress: number) => {
    return `${progress}%`;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
          <h3 className="text-base md:text-lg font-medium">Progress Overview</h3>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[130px] text-sm bg-[#F1F3F4] px-2 py-1 h-9 rounded border border-[#DADCE0]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-4">
          {subjects.map((subject: Subject) => {
            const colors = {
              Mathematics: "bg-primary",
              "Computer Science": "bg-secondary",
              Physics: "bg-accent",
              Chemistry: "bg-danger",
            };

            const bgColor = colors[subject.name as keyof typeof colors] || "bg-gray-400";

            return (
              <div key={subject.id}>
                <div className="flex flex-col xs:flex-row justify-between text-xs md:text-sm mb-1 gap-1">
                  <span className="flex items-center">
                    <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${bgColor} mr-1.5 md:mr-2 flex-shrink-0`}></div>
                    <span className="truncate max-w-[120px] xs:max-w-none">{subject.name}</span>
                  </span>
                  <span className="ml-4 xs:ml-0">
                    {subject.completedTopics}/{subject.totalTopics} topics
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 md:h-2">
                  <div
                    className={cn("rounded-full h-1.5 md:h-2 progress-bar-fill", bgColor)}
                    style={
                      {
                        "--percent": calculateProgressWidth(subject.progress),
                      } as React.CSSProperties
                    }
                  ></div>
                </div>
              </div>
            );
          })}
          
          <div className="pt-2 flex flex-col xs:flex-row justify-between border-t border-[#DADCE0] gap-1">
            <span className="text-xs md:text-sm font-medium">Total Progress</span>
            <span className="text-xs md:text-sm font-medium">
              {totalProgress.completedTopics}/{totalProgress.totalTopics} topics ({totalProgress.percentage}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
