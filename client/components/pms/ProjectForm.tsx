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
import {
  Plus,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { ApiResponse } from "@shared/api";
import { Badge } from "@/components/ui/badge";

interface ProjectDetail {
  _id: string;
  projectName: string;
  projectManager: string;
  startDate?: string;
  endDate?: string;
  status: "Planning" | "In Progress" | "In Review" | "Completed" | "On Hold";
  priority: "Low" | "Medium" | "High" | "Critical";
  description: string;
  teamMembers: string[];
  budget?: number;
}

interface Props {
  onProjectCreated: (project: ProjectDetail) => void;
}

export default function ProjectForm({ onProjectCreated }: Props) {
  const { token, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state with dates
  const [formData, setFormData] = useState({
    projectName: "",
    projectManager: user?.id || "",
    status: "Planning" as const,
    priority: "Medium" as const,
    description: "",
    startDate: "",
    endDate: "",
    teamMembers: [] as string[],
    selectedEmployeeId: "",
    budget: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.projectName || !formData.description || !formData.startDate) {
      setError("Please fill in all required fields including project name, description, and start date");
      return;
    }

    if (formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        setError("End date cannot be before start date");
        return;
      }
    }

    const filteredTeamMembers = Array.from(new Set(
      (formData.teamMembers || []).map((m) => m.trim()).filter((m) => m),
    ));

    try {
      setLoading(true);

      const projectData = {
        projectName: formData.projectName,
        projectManager: formData.projectManager,
        status: formData.status,
        priority: formData.priority,
        description: formData.description,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        teamMembers: filteredTeamMembers,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      };

      const response = await fetch("/api/pms/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      const data: ApiResponse<ProjectDetail> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create project");
      }

      setSuccess("Project created successfully!");
      setFormData({
        projectName: "",
        projectManager: user?.id || "",
        status: "Planning",
        priority: "Medium",
        description: "",
        startDate: "",
        endDate: "",
        teamMembers: [],
        selectedEmployeeId: "",
        budget: "",
      });

      if (data.data) {
        onProjectCreated(data.data);
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Create project error", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  interface EmployeeOption { id: string; firstName: string; lastName: string; email: string; role: string }
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!isModalOpen) return;
      try {
        setEmployeesLoading(true);
        setEmployeesError("");
        const res = await fetch("/api/employees", { headers: { Authorization: `Bearer ${token}` } });
        const data: ApiResponse<EmployeeOption[]> = await res.json();
        if (!res.ok || !data.success || !data.data) throw new Error(data.error || "Failed to load employees");
        setEmployees(data.data);
      } catch (e) {
        setEmployeesError(e instanceof Error ? e.message : "Failed to load employees");
      } finally {
        setEmployeesLoading(false);
      }
    };
    load();
  }, [isModalOpen, token]);

  const removeTeamMember = (index: number) => {
    const newTeamMembers = formData.teamMembers.filter((_, i) => i !== index);
    setFormData({ ...formData, teamMembers: newTeamMembers });
  };

  const addSelectedEmployee = () => {
    const id = formData.selectedEmployeeId;
    if (!id) return;
    if (formData.teamMembers.includes(id)) return;
    setFormData({ ...formData, teamMembers: [...formData.teamMembers, id], selectedEmployeeId: "" });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>Create New Project</span>
          </DialogTitle>
          <DialogDescription>
            Add a new project to the system with all necessary details
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
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) =>
                  setFormData({ ...formData, projectName: e.target.value })
                }
                placeholder="Enter project name"
                required
              />
            </div>

            <div>
              <Label htmlFor="projectManager">Project Manager ID</Label>
              <Input
                id="projectManager"
                value={formData.projectManager}
                onChange={(e) =>
                  setFormData({ ...formData, projectManager: e.target.value })
                }
                placeholder="Enter manager ID"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter project description"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
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
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
                placeholder="Enter budget"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                min={formData.startDate || undefined}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Team Members</Label>
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Select
                  value={formData.selectedEmployeeId}
                  onValueChange={(v) => setFormData({ ...formData, selectedEmployeeId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={employeesLoading ? "Loading employees..." : "Select an employee"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={addSelectedEmployee} disabled={!formData.selectedEmployeeId}>
                  Add
                </Button>
              </div>
              {employeesError && (
                <div className="text-xs text-red-600">{employeesError}</div>
              )}
              {formData.teamMembers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.teamMembers.map((id, index) => {
                    const emp = employees.find((e) => e.id === id);
                    const label = emp ? `${emp.firstName} ${emp.lastName} (${emp.email})` : id;
                    return (
                      <div key={`${id}-${index}`} className="inline-flex items-center gap-1">
                        <Badge variant="outline">{label}</Badge>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTeamMember(index)}>×</Button>
                      </div>
                    );
                  })}
                </div>
              )}
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
                  Create Project
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
