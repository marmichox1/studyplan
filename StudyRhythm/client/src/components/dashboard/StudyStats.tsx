import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export default function StudyStats() {
  interface StudyStats {
    totalStudyTime: string;
    topicsCompleted: number;
    sessionsCompleted: number;
    avgSessionLength: string;
    studyTimeChange: number;
    topicsCompletedChange: number;
    sessionsCompletedChange: number;
    avgSessionLengthChange: number;
  }

  const { data: stats = {
    totalStudyTime: "0h 0m",
    topicsCompleted: 0,
    sessionsCompleted: 0,
    avgSessionLength: "0h 0m",
    studyTimeChange: 0,
    topicsCompletedChange: 0,
    sessionsCompletedChange: 0,
    avgSessionLengthChange: 0
  } } = useQuery<StudyStats>({
    queryKey: ["/api/stats"],
  });

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="text-base md:text-lg font-medium mb-4">Study Stats</h3>
          <div className="flex justify-center items-center h-48 text-gray-400">
            Loading stats...
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      title: "Total Study Time",
      value: stats.totalStudyTime,
      change: stats.studyTimeChange,
      bgColor: "bg-blue-50",
      description: "from last week",
    },
    {
      title: "Topics Completed",
      value: stats.topicsCompleted,
      change: stats.topicsCompletedChange,
      bgColor: "bg-green-50",
      description: "from last week",
    },
    {
      title: "Sessions Completed",
      value: stats.sessionsCompleted,
      change: stats.sessionsCompletedChange,
      bgColor: "bg-yellow-50",
      description: "from last week",
    },
    {
      title: "Avg. Session Length",
      value: stats.avgSessionLength,
      change: stats.avgSessionLengthChange,
      bgColor: "bg-purple-50",
      description: "from last week",
    },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-base md:text-lg font-medium mb-4">Study Stats</h3>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
          {statItems.map((item, index) => (
            <div key={index} className={`${item.bgColor} rounded-lg p-3`}>
              <div className="text-gray-500 text-xs md:text-sm">{item.title}</div>
              <div className="text-xl md:text-2xl font-medium mt-1">{item.value}</div>
              <div 
                className={`text-xs flex flex-wrap items-center mt-1 ${
                  item.change > 0 
                    ? 'text-green-600' 
                    : item.change < 0 
                    ? 'text-red-600' 
                    : 'text-blue-600'
                }`}
              >
                <span className="material-icons text-xs mr-1">
                  {item.change > 0 
                    ? 'arrow_upward' 
                    : item.change < 0 
                    ? 'arrow_downward' 
                    : 'remove'}
                </span>
                <span>
                  {item.change !== 0 ? (
                    item.change > 0 ? `+${item.change}` : item.change
                  ) : 'Same as'} {item.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
