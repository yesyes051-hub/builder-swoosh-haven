import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Form validation schema
const projectAssignmentSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  onBoarding: z.string().min(1, "On-Boarding date is required"),
  notes: z.string().optional(),
});

type ProjectAssignmentFormData = z.infer<typeof projectAssignmentSchema>;

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  role: string;
}

interface ProjectAssignmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}

export default function ProjectAssignmentForm({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: ProjectAssignmentFormProps) {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);

  const form = useForm<ProjectAssignmentFormData>({
    resolver: zodResolver(projectAssignmentSchema),
    defaultValues: {
      projectName: "",
      onBoarding: "",
      notes: "",
    },
  });

  const onSubmit = async (data: ProjectAssignmentFormData) => {
    if (!employee) return;

    if (!token) {
      toast.error("Authentication required. Please log in.");
      return;
    }

    // Prevent duplicate submissions within 2 seconds
    const now = Date.now();
    if (now - lastSubmissionTime < 2000) {
      console.log("🚫 Preventing duplicate submission");
      return;
    }
    setLastSubmissionTime(now);

    if (isSubmitting) {
      console.log("🚫 Already submitting, preventing duplicate");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("🔍 Submitting project assignment:", {
        employeeId: employee._id,
        ...data,
      });

      const response = await fetch("/api/project-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: employee._id,
          ...data,
        }),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to create project assignment";
        try {
          const errorData = await response.text(); // Use text() instead of json() to avoid parsing issues
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Only try to parse JSON if response is ok
      const result = await response.json();
      console.log("✅ Project assignment response:", result);

      if (result.success) {
        toast.success("Project assignment created successfully!");
        form.reset();
        onClose();
        onSuccess();
      } else {
        throw new Error(result.error || "Failed to create project assignment");
      }
    } catch (error) {
      console.error("Error creating project assignment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create project assignment";
      toast.error(errorMessage);
      // Reset submission protection on error so user can retry
      setLastSubmissionTime(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setIsSubmitting(false);
    setLastSubmissionTime(0); // Reset submission protection
    onClose();
  };

  // Format today's date as YYYY-MM-DD for input min value
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Assign Project</span>
          </DialogTitle>
          <DialogDescription>
            {employee && (
              <span>
                Assign a new project to{" "}
                <strong>
                  {employee.firstName} {employee.lastName}
                </strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Employee Info Display */}
            {employee && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{employee.email}</p>
                    {employee.department && (
                      <p className="text-sm text-gray-500">
                        {employee.department}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Project Name */}
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter project name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* On-Boarding */}
            <FormField
              control={form.control}
              name="onBoarding"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>On-Boarding</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="date"
                        {...field}
                        min={today}
                        disabled={isSubmitting}
                        className="pl-10"
                      />
                      <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes or requirements..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Project"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
