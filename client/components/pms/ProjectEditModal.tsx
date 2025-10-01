import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertTriangle, FolderOpen } from "lucide-react";
import { ApiResponse } from "@shared/api";

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
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectDetail | null;
  onUpdated: (p: ProjectDetail) => void;
}

export default function ProjectEditModal({ open, onOpenChange, project, onUpdated }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    projectName: "",
    projectManager: "",
    description: "",
    status: "Planning" as const,
    priority: "Medium" as const,
    startDate: "",
    endDate: "",
    budget: "" as string | "",
  });

  useEffect(() => {
    if (project) {
      setFormData({
        projectName: project.projectName || "",
        projectManager: project.projectManager || "",
        description: project.description || "",
        status: project.status || "Planning",
        priority: project.priority || "Medium",
        startDate: project.startDate ? project.startDate.slice(0, 10) : "",
        endDate: project.endDate ? project.endDate.slice(0, 10) : "",
        budget: project.budget !== undefined ? String(project.budget) : "",
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setError("");

    if (!formData.projectName || !formData.description) {
      setError("Project name and description are required");
      return;
    }
    if (formData.endDate && formData.startDate) {
      const s = new Date(formData.startDate);
      const eD = new Date(formData.endDate);
      if (eD < s) {
        setError("End date cannot be before start date");
        return;
      }
    }

    try {
      setLoading(true);
      const body = {
        projectName: formData.projectName,
        projectManager: formData.projectManager,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      };

      const res = await fetch(`/api/pms/projects/${project._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data: ApiResponse<ProjectDetail> = await res.json();
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || "Failed to update project");
      }
      onUpdated(data.data);
      setSuccess("Project updated");
      setTimeout(() => {
        setSuccess("");
        onOpenChange(false);
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update project details</DialogDescription>
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
              <Label htmlFor="name">Project Name *</Label>
              <Input id="name" value={formData.projectName} onChange={(e) => setFormData({ ...formData, projectName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="manager">Project Manager ID</Label>
              <Input id="manager" value={formData.projectManager} onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })} />
            </div>
          </div>

          <div>
            <Label htmlFor="desc">Description *</Label>
            <Textarea id="desc" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
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
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v: any) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Budget ($)</Label>
              <Input type="number" min="0" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" min={formData.startDate || undefined} value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>) : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
