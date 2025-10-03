import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";

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

interface EmployeeOption { id: string; firstName: string; lastName: string; email: string; role: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectDetail | null;
}

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—");

export default function ProjectViewModal({ open, onOpenChange, project }: Props) {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!open) return;
      try {
        const res = await fetch("/api/employees", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok && data.success && data.data) setEmployees(data.data);
      } catch {}
    };
    load();
  }, [open, token]);

  if (!project) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{project.projectName}</DialogTitle>
          <DialogDescription>Project overview and timeline</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
            <div className="font-medium mb-2">Team Members</div>
            {project.teamMembers && project.teamMembers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Member</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.teamMembers.map((m, i) => {
                    const emp = employees.find((e) => e.id === m);
                    const label = emp ? `${emp.firstName} ${emp.lastName} (${emp.email})` : m;
                    return (
                      <TableRow key={`${m}-${i}`}>
                        <TableCell className="w-10">{i + 1}</TableCell>
                        <TableCell>{label}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-sm text-muted-foreground">No members added yet.</div>
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
