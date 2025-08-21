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
  deadline: z.string().min(1, "Deadline is required"),
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
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

  const form = useForm<ProjectAssignmentFormData>({
    resolver: zodResolver(projectAssignmentSchema),
    defaultValues: {
      projectName: "",
      deadline: "",
      priority: "Medium",
      notes: "",
    },
  });

  const onSubmit = async (data: ProjectAssignmentFormData) => {
    if (!employee) return;

    if (!token) {
      toast.error("Authentication required. Please log in.");
      return;
    }

    setIsSubmitting(true);
    try {
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

      const result = await response.json();

      if (result.success) {
        toast.success("Project assignment created successfully!");
        form.reset();
        onClose();
        onSuccess();
      } else {
        toast.error(result.error || "Failed to create project assignment");
      }
    } catch (error) {
      console.error("Error creating project assignment:", error);
      toast.error("Failed to create project assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
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

            {/* Deadline */}
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
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

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="High">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          High
                        </span>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          Medium
                        </span>
                      </SelectItem>
                      <SelectItem value="Low">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Low
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
