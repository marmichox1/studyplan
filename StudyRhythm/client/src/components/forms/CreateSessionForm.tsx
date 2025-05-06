import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { addHours, format, parse, addMinutes } from "date-fns";
import { z } from "zod";

interface CreateSessionFormProps {
  onSuccess?: () => void;
}

export default function CreateSessionForm({ onSuccess }: CreateSessionFormProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const { toast } = useToast();

  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const formSchema = z.object({
    subjectId: z.string().min(1, "Subject is required"),
    topic: z.string().min(1, "Topic is required"),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    duration: z.string().min(1, "Duration is required"),
    notes: z.string().optional(),
  });

  const form = useForm({
    defaultValues: {
      subjectId: "",
      topic: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: format(new Date(), "HH:mm"),
      duration: "2",
      notes: "",
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const startTimeDate = parse(data.startTime, "HH:mm", new Date(`${data.date}T00:00:00`));
      let endTimeDate;
      
      const durationValue = parseFloat(data.duration);
      const durationHours = Math.floor(durationValue);
      const durationMinutes = Math.round((durationValue - durationHours) * 60);
      
      endTimeDate = addMinutes(addHours(startTimeDate, durationHours), durationMinutes);
      
      const sessionData = {
        subjectId: parseInt(data.subjectId),
        topic: data.topic,
        date: data.date,
        startTime: startTimeDate.toISOString(),
        endTime: endTimeDate.toISOString(),
        duration: durationValue,
        notes: data.notes || null,
      };
      
      const res = await apiRequest("POST", "/api/sessions", sessionData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
      form.reset();
      toast({
        title: "Success",
        description: "Study session created successfully",
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create study session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createSessionMutation.mutate(data);
  };

  useEffect(() => {
    const startTimeValue = form.getValues("startTime");
    const durationValue = form.getValues("duration");
    
    if (startTimeValue && durationValue) {
      const startDateTime = parse(startTimeValue, "HH:mm", new Date());
      const durationHours = parseFloat(durationValue);
      const durationHoursWhole = Math.floor(durationHours);
      const durationMinutes = Math.round((durationHours - durationHoursWhole) * 60);
      
      const endDateTime = addMinutes(addHours(startDateTime, durationHoursWhole), durationMinutes);
      setEndTime(format(endDateTime, "HH:mm"));
    }
  }, [form.watch("startTime"), form.watch("duration")]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="subjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Integration Techniques" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0.5">30 minutes</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="1.5">1.5 hours</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="2.5">2.5 hours</SelectItem>
                    <SelectItem value="3">3 hours</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>End Time</FormLabel>
            <Input type="time" value={endTime} disabled />
          </FormItem>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes or details about this study session"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2 flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => {
              if (onSuccess) onSuccess();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createSessionMutation.isPending}
            className="bg-primary text-white hover:bg-blue-600"
          >
            Create Session
          </Button>
        </div>
      </form>
    </Form>
  );
}
