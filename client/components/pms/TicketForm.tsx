import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SafeCalendar as Calendar } from "@/components/ui/safe-calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Ticket as TicketIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ApiResponse } from "@shared/api";

interface Project {
  _id: string;
  projectName: string;
  projectManager: string;
  status: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface TicketData {
  _id: string;
  ticketId: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  reportedBy: string;
  status: "Pending" | "In Progress" | "In Review" | "Completed";
  priority: "Low" | "Medium" | "High" | "Critical";
  type: "Bug" | "Feature" | "Enhancement" | "Task";
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  createdAt: string;
}

interface Props {
  onTicketCreated: (ticket: TicketData) => void;
}

export default function TicketForm({ onTicketCreated }: Props) {
  const { token, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
    description: "",
    assignedTo: "unassigned",
    type: "Task" as const,
    priority: "Medium" as const,
    status: "Pending" as const,
    estimatedHours: "",
    dueDate: undefined as Date | undefined,
  });

  useEffect(() => {
    if (isModalOpen) {
      loadProjects();
      loadEmployees();
    }
  }, [isModalOpen]);

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/pms/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiResponse<Project[]> = await response.json();
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch("/api/pms/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        // User doesn't have permission to view employees list
        console.log("⚠️ User does not have permission to view employees list");
        setEmployees([]);
        return;
      }

      const data: ApiResponse<Employee[]> = await response.json();
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
      setEmployees([]);
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: "",
      title: "",
      description: "",
      assignedTo: "unassigned",
      type: "Task",
      priority: "Medium",
      status: "Pending",
      estimatedHours: "",
      dueDate: undefined,
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.projectId || !formData.title || !formData.description) {
      setError(
        "Please fill in all required fields (project, title, and description)",
      );
      return;
    }

    try {
      setLoading(true);

      const ticketData = {
        projectId: formData.projectId,
        title: formData.title,
        description: formData.description,
        assignedTo:
          formData.assignedTo === "unassigned"
            ? undefined
            : formData.assignedTo,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        estimatedHours: formData.estimatedHours
          ? parseInt(formData.estimatedHours)
          : undefined,
        dueDate: formData.dueDate?.toISOString(),
      };

      console.log("🔍 Creating ticket with data:", ticketData);

      const response = await fetch("/api/pms/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketData),
      });

      const data: ApiResponse<TicketData> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create ticket");
      }

      setSuccess("Ticket created successfully!");
      resetForm();

      if (data.data) {
        onTicketCreated(data.data);
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Create ticket error:", err);
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleOpenModal}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TicketIcon className="h-5 w-5" />
            <span>Create New Ticket</span>
          </DialogTitle>
          <DialogDescription>
            Create a new ticket to track issues, features, or tasks
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectId">Associated Project *</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) =>
                  setFormData({ ...formData, projectId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedTo">Assignee (Optional)</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) =>
                  setFormData({ ...formData, assignedTo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No assignee</SelectItem>
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {employee.firstName} {employee.lastName} (
                        {employee.role})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="limited" disabled>
                      Employee list not available (permission required)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {employees.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  💡 Tip: Admin or HR role required to see employee list for
                  assignment
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter ticket title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the issue, feature, or task in detail"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bug">Bug</SelectItem>
                  <SelectItem value="Feature">Feature</SelectItem>
                  <SelectItem value="Enhancement">Enhancement</SelectItem>
                  <SelectItem value="Task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedHours: e.target.value })
                }
                placeholder="Enter estimated hours"
                min="0"
                step="0.5"
              />
            </div>

            <div>
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !formData.dueDate && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate
                      ? format(formData.dueDate, "PPP")
                      : "Pick due date (optional)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) =>
                      setFormData({ ...formData, dueDate: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Ticket
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
