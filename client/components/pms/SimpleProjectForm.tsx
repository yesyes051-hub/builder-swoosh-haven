import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { ApiResponse } from "@shared/api";

interface ProjectDetail {
  _id: string;
  projectName: string;
  projectManager: string;
  startDate: string;
  endDate?: string;
  status: "Planning" | "In Progress" | "In Review" | "Completed" | "On Hold";
  description: string;
  teamMembers: string[];
  budget?: number;
}

interface Props {
  onProjectCreated: (project: ProjectDetail) => void;
}

export default function SimpleProjectForm({ onProjectCreated }: Props) {
  const { token, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Simplified form state with only 4 fields
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    onBoardingDate: "",
    projectManagerId: user?.id || "",
  });

  const resetForm = () => {
    setFormData({
      projectName: "",
      description: "",
      onBoardingDate: "",
      projectManagerId: user?.id || "",
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate required fields
    if (!formData.projectName.trim()) {
      setError("Project Name is required");
      return;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }

    if (!formData.onBoardingDate) {
      setError("On-Boarding date is required");
      return;
    }

    if (!formData.projectManagerId.trim()) {
      setError("Project Manager ID is required");
      return;
    }

    try {
      setLoading(true);

      // Convert the on-boarding date to ISO string for the API
      const onBoardingDateISO = new Date(formData.onBoardingDate).toISOString();

      const projectData = {
        projectName: formData.projectName.trim(),
        projectManager: formData.projectManagerId.trim(),
        startDate: onBoardingDateISO, // Using on-boarding date as start date
        status: "Planning",
        description: formData.description.trim(),
        teamMembers: [], // Empty array for now
      };

      console.log("🔍 Creating project with simplified data:", projectData);

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
      resetForm();

      if (data.data) {
        onProjectCreated(data.data);
      }

      // Close modal after success
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess("");
      }, 1500);
    } catch (err) {
      console.error("Create project error:", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);
    if (open) {
      resetForm(); // Reset form when opening
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>Create New Project</span>
          </DialogTitle>
          <DialogDescription>
            Create a new project with essential details
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
          {/* Project Name */}
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
              disabled={loading}
            />
          </div>

          {/* Description */}
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
              disabled={loading}
            />
          </div>

          {/* On-Boarding Date */}
          <div>
            <Label htmlFor="onBoardingDate">On-Boarding Date *</Label>
            <div className="relative">
              <Input
                id="onBoardingDate"
                type="date"
                value={formData.onBoardingDate}
                onChange={(e) =>
                  setFormData({ ...formData, onBoardingDate: e.target.value })
                }
                min={today}
                required
                disabled={loading}
                className="pl-10"
              />
              <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Project Manager ID */}
          <div>
            <Label htmlFor="projectManagerId">Project Manager ID *</Label>
            <Input
              id="projectManagerId"
              value={formData.projectManagerId}
              onChange={(e) =>
                setFormData({ ...formData, projectManagerId: e.target.value })
              }
              placeholder="Enter project manager ID"
              required
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
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
