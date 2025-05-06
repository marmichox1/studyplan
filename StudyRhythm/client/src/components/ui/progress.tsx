import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  color?: "primary" | "secondary" | "accent" | "danger";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, color = "primary", ...props }, ref) => {
    const percentage = value != null ? (value / max) * 100 : 0;

    const getColorClass = () => {
      switch (color) {
        case "primary":
          return "bg-primary";
        case "secondary":
          return "bg-secondary";
        case "accent":
          return "bg-accent";
        case "danger":
          return "bg-danger";
        default:
          return "bg-primary";
      }
    };

    return (
      <div
        ref={ref}
        className={cn("w-full bg-gray-100 rounded-full h-2", className)}
        {...props}
      >
        <div
          className={cn(
            "rounded-full h-2 progress-bar-fill",
            getColorClass()
          )}
          style={
            {
              "--percent": `${percentage}%`,
            } as React.CSSProperties
          }
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
