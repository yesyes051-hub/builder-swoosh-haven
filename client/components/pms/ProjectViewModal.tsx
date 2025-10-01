import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
}

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—");

export default function ProjectViewModal({ open, onOpenChange, project }: Props) {
  if (!project) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{project.projectName}</DialogTitle>
          <DialogDescription>Project overview and timeline</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <Badge variant="outline">Status: {project.status}</Badge>
            <Badge variant="outline">Priority: {project.priority}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <div><span className="font-medium text-foreground">Manager:</span> {project.projectManager}</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div><span className="font-medium text-foreground">Start:</span> {formatDate(project.startDate)}</div>
              <div><span className="font-medium text-foreground">End:</span> {formatDate(project.endDate)}</div>
            </div>
            <div className="mt-2"><span className="font-medium text-foreground">Team size:</span> {project.teamMembers?.length ?? 0}</div>
            {project.budget !== undefined && (
              <div><span className="font-medium text-foreground">Budget:</span> ${project.budget.toLocaleString()}</div>
            )}
          </div>
          <div>
            <div className="font-medium mb-1">Description</div>
            <p className="text-sm leading-relaxed">{project.description}</p>
          </div>
          <div className="text-right">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
