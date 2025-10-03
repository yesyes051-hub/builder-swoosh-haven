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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Plus,
  Edit,
  Send,
  Check,
  X,
  Loader2,
  Timer,
  CheckCircle,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { ApiResponse } from "@shared/api";

interface Project {
  _id: string;
  projectName: string;
  projectManager: string;
  status: string;
}

interface TimesheetEntry {
  _id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  projectId: string;
  projectName: string;
  date: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  taskDescription: string;
  category:
    | "Development"
    | "Testing"
    | "Meeting"
    | "Documentation"
    | "Support"
    | "Other";
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  billable: boolean;
  overtime: boolean;
}

interface Props {
  onRefresh: () => void;
}

export default function TimesheetForm({ onRefresh }: Props) {
  const { token, user } = useAuth();
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isWeeklyOpen, setIsWeeklyOpen] = useState(false);
  const [isSubmitWeekOpen, setIsSubmitWeekOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [weeklySuccess, setWeeklySuccess] = useState("");
  const [weeklyError, setWeeklyError] = useState("");
  const [submitWeekMsg, setSubmitWeekMsg] = useState("");
  const [submitWeekError, setSubmitWeekError] = useState("");
  const [selectedSubmitIds, setSelectedSubmitIds] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    projectId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "17:00",
    taskDescription: "",
    category: "Development" as const,
    billable: true,
  });

  type DayEntry = {
    date: string;
    startTime: string;
    endTime: string;
    taskDescription: string;
    category: "Development" | "Testing" | "Meeting" | "Documentation" | "Support" | "Other";
    billable: boolean;
  };

  const [weeklyForm, setWeeklyForm] = useState({
    projectId: "",
    weekStart: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    days: Array.from({ length: 5 }).map((_, i) => ({
      date: format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "17:00",
      taskDescription: "",
      category: "Development" as const,
      billable: true,
    })) as DayEntry[],
  });

  useEffect(() => {
    loadTimesheets();
    loadProjects();
  }, []);

  const loadTimesheets = async () => {
    try {
      const response = await fetch("/api/pms-new/timesheets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiResponse<TimesheetEntry[]> = await response.json();

      if (data.success) {
        setTimesheets(data.data);
      }
    } catch (error) {
      console.error("Error loading timesheets:", error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/pms/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiResponse<Project[]> = await response.json();

      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "17:00",
      taskDescription: "",
      category: "Development",
      billable: true,
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate that a project is selected
    if (!formData.projectId) {
      setError("Please select a project for this timesheet entry");
      setLoading(false);
      return;
    }

    // Validate that the selected project still exists
    const selectedProject = projects.find((p) => p._id === formData.projectId);
    if (!selectedProject) {
      setError(
        "The selected project is no longer available. Please select a different project.",
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/pms-new/timesheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse<TimesheetEntry> = await response.json();

      if (data.success) {
        setSuccess("Timesheet entry created successfully!");
        resetForm();
        setIsFormOpen(false);
        loadTimesheets();
        onRefresh();
      } else {
        setError(data.error || "Failed to save timesheet entry");
      }
    } catch (error) {
      setError("An error occurred while saving the timesheet entry");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Draft: "secondary",
      Submitted: "outline",
      Approved: "default",
      Rejected: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    );
  };

  // Recalculate Mon–Fri dates when week start changes
  useEffect(() => {
    const monday = startOfWeek(new Date(weeklyForm.weekStart), { weekStartsOn: 1 });
    setWeeklyForm((prev) => ({
      ...prev,
      days: prev.days.map((d, i) => ({ ...d, date: format(addDays(monday, i), "yyyy-MM-dd") })),
    }));
    setSelectedSubmitIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyForm.weekStart]);

  const handleWeeklySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWeeklyError("");
    setWeeklySuccess("");

    if (!weeklyForm.projectId) {
      setWeeklyError("Please select a project for this week");
      return;
    }

    const entries = weeklyForm.days
      .filter((d) => d.taskDescription.trim())
      .map((d) => ({
        projectId: weeklyForm.projectId,
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
        taskDescription: d.taskDescription,
        category: d.category,
        billable: d.billable,
      }));

    if (entries.length === 0) {
      setWeeklyError("Please fill at least one day's details");
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      for (const body of entries) {
        const res = await fetch("/api/pms-new/timesheets", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const data: ApiResponse<any> = await res.json();
        if (res.ok && data.success) successCount += 1;
      }
      setWeeklySuccess(`Saved ${successCount}/${entries.length} entries`);
      await loadTimesheets();
      onRefresh();
      setTimeout(() => {
        setIsWeeklyOpen(false);
        setWeeklySuccess("");
      }, 800);
    } catch (err) {
      setWeeklyError("Failed to save weekly timesheet");
    } finally {
      setLoading(false);
    }
  };

  const draftCountForWeek = (weekStart: string) => {
    const monday = startOfWeek(new Date(weekStart), { weekStartsOn: 1 });
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    return timesheets.filter((t) => t.status === 'Draft' && new Date(t.date) >= monday && new Date(t.date) < nextMonday).length;
  };

  const handleSubmitWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitWeekError("");
    setSubmitWeekMsg("");

    const ids = Array.from(selectedSubmitIds);
    if (ids.length === 0) {
      setSubmitWeekError("Please select at least one entry to submit");
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      for (const id of ids) {
        const res = await fetch(`/api/pms-new/timesheets/${id}/submit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        let data: ApiResponse<any> | null = null;
        try { data = text ? JSON.parse(text) : null; } catch { data = null; }
        if (res.ok && data && data.success) successCount += 1;
      }
      setSubmitWeekMsg(`Submitted ${successCount}/${ids.length} entries for approval`);
      await loadTimesheets();
      onRefresh();
      setTimeout(() => { setIsSubmitWeekOpen(false); setSubmitWeekMsg(""); }, 800);
    } catch (err) {
      setSubmitWeekError(err instanceof Error ? err.message : 'Failed to submit selected entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);
      const res = await fetch(`/api/pms-new/timesheets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      let data: ApiResponse<null> | null = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      if (!res.ok || !data || !data.success) {
        throw new Error((data && (data as any).error) || text || "Failed to delete entry");
      }
      setSuccess("Timesheet entry deleted");
      await loadTimesheets();
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete entry");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 1500);
    }
  };

  const handleApproveEntry = async (id: string) => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);
      const res = await fetch(`/api/pms-new/timesheets/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const text = await res.text();
      let data: ApiResponse<any> | null = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      if (!res.ok || !data || !data.success) {
        throw new Error((data && (data as any).error) || text || 'Failed to approve');
      }
      setSuccess('Entry approved');
      await loadTimesheets();
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve entry');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 1500);
    }
  };

  const groupPendingByUserWeek = () => {
    const map = new Map<string, { userId: string; userName: string; userEmail: string; weekStart: string; count: number }>();
    timesheets.filter((t) => t.status === 'Submitted').forEach((t) => {
      const monday = startOfWeek(new Date(t.date), { weekStartsOn: 1 });
      const key = `${t.userId}-${monday.toISOString().slice(0,10)}`;
      const found = map.get(key);
      if (found) {
        found.count += 1;
      } else {
        map.set(key, { userId: t.userId, userName: t.userName, userEmail: t.userEmail, weekStart: monday.toISOString().slice(0,10), count: 1 });
      }
    });
    return Array.from(map.values()).sort((a,b)=>a.weekStart.localeCompare(b.weekStart));
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Add New Entry Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Timesheet Entries</h3>
        <div className="flex gap-2">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Entry</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Timesheet Entry</DialogTitle>
                <DialogDescription>
                  Record your time spent on project tasks.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, projectId: value }))
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
                  {projects.length === 0 && (
                    <p className="text-sm text-red-600">
                      ⚠️ No projects available. Please create a project first
                      before adding timesheet entries.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Testing">Testing</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Documentation">Documentation</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskDescription">Task Description</Label>
                  <Textarea
                    placeholder="Describe what you worked on..."
                    value={formData.taskDescription}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        taskDescription: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="billable"
                    checked={formData.billable}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        billable: e.target.checked,
                      }))
                    }
                  />
                  <Label htmlFor="billable">Billable</Label>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Entry
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {user?.role === 'employee' && (
            <Dialog open={isSubmitWeekOpen} onOpenChange={setIsSubmitWeekOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Submit Week for Approval</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Submit Weekly Timesheet</DialogTitle>
                <DialogDescription>Select the entries to send for manager approval.</DialogDescription>
              </DialogHeader>

              {submitWeekError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{submitWeekError}</AlertDescription>
                </Alert>
              )}
              {submitWeekMsg && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{submitWeekMsg}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmitWeek} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-1">
                    <Label>Week starting (Monday)</Label>
                    <Input type="date" value={weeklyForm.weekStart} onChange={(e) => setWeeklyForm((p) => ({ ...p, weekStart: e.target.value }))} />
                    <div className="text-xs text-muted-foreground">Draft entries this week: {draftCountForWeek(weeklyForm.weekStart)}</div>
                  </div>
                </div>

                <div className="overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            aria-label="Select all"
                            checked={(() => {
                              const monday = startOfWeek(new Date(weeklyForm.weekStart), { weekStartsOn: 1 });
                              const nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7);
                              const drafts = timesheets.filter((t) => t.status === 'Draft' && new Date(t.date) >= monday && new Date(t.date) < nextMonday);
                              return drafts.length > 0 && drafts.every((d) => d._id && selectedSubmitIds.has(d._id));
                            })()}
                            onChange={(e) => {
                              const monday = startOfWeek(new Date(weeklyForm.weekStart), { weekStartsOn: 1 });
                              const nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7);
                              const drafts = timesheets.filter((t) => t.status === 'Draft' && new Date(t.date) >= monday && new Date(t.date) < nextMonday);
                              const next = new Set<string>(selectedSubmitIds);
                              if (e.target.checked) {
                                drafts.forEach((d) => { if (d._id) next.add(d._id); });
                              } else {
                                drafts.forEach((d) => { if (d._id) next.delete(d._id); });
                              }
                              setSelectedSubmitIds(next);
                            }}
                          />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const monday = startOfWeek(new Date(weeklyForm.weekStart), { weekStartsOn: 1 });
                        const nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7);
                        const drafts = timesheets.filter((t) => t.status === 'Draft' && new Date(t.date) >= monday && new Date(t.date) < nextMonday);
                        if (drafts.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No draft entries for this week.</TableCell>
                            </TableRow>
                          );
                        }
                        return drafts.map((entry) => (
                          <TableRow key={entry._id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={!!(entry._id && selectedSubmitIds.has(entry._id))}
                                onChange={(e) => {
                                  if (!entry._id) return;
                                  const next = new Set<string>(selectedSubmitIds);
                                  if (e.target.checked) next.add(entry._id); else next.delete(entry._id);
                                  setSelectedSubmitIds(next);
                                }}
                              />
                            </TableCell>
                            <TableCell>{format(new Date(entry.date), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="font-medium">{entry.projectName}</TableCell>
                            <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                            <TableCell>{entry.hoursWorked.toFixed(1)}h</TableCell>
                            <TableCell><Badge variant="outline">{entry.category}</Badge></TableCell>
                            <TableCell className="max-w-[320px]"><div className="truncate" title={entry.taskDescription}>{entry.taskDescription}</div></TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading || selectedSubmitIds.size === 0} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send for Approval
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsSubmitWeekOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          )}

          <Dialog open={isWeeklyOpen} onOpenChange={setIsWeeklyOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => { setWeeklyError(""); setWeeklySuccess(""); }} className="space-x-2">
                <Timer className="h-4 w-4" />
                <span>Log Week (Mon–Fri)</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Log Weekly Timesheet</DialogTitle>
                <DialogDescription>Fill time for each weekday; leave blank to skip a day.</DialogDescription>
              </DialogHeader>

              {weeklyError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{weeklyError}</AlertDescription>
                </Alert>
              )}
              {weeklySuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{weeklySuccess}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleWeeklySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Project *</Label>
                    <Select value={weeklyForm.projectId} onValueChange={(v) => setWeeklyForm((p) => ({ ...p, projectId: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p._id} value={p._id}>{p.projectName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Week starting (Monday)</Label>
                    <Input type="date" value={weeklyForm.weekStart} onChange={(e) => setWeeklyForm((p) => ({ ...p, weekStart: e.target.value }))} />
                  </div>
                </div>

                <div className="overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Day</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Billable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyForm.days.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">
                            {format(new Date(d.date), "EEE, MMM dd")}<div className="text-xs text-muted-foreground">{d.date}</div>
                          </TableCell>
                          <TableCell>
                            <Input type="time" value={d.startTime} onChange={(e) => setWeeklyForm((p) => ({ ...p, days: p.days.map((x, idx) => idx === i ? { ...x, startTime: e.target.value } : x) }))} />
                          </TableCell>
                          <TableCell>
                            <Input type="time" value={d.endTime} onChange={(e) => setWeeklyForm((p) => ({ ...p, days: p.days.map((x, idx) => idx === i ? { ...x, endTime: e.target.value } : x) }))} />
                          </TableCell>
                          <TableCell>
                            <Input placeholder="What did you work on?" value={d.taskDescription} onChange={(e) => setWeeklyForm((p) => ({ ...p, days: p.days.map((x, idx) => idx === i ? { ...x, taskDescription: e.target.value } : x) }))} />
                          </TableCell>
                          <TableCell>
                            <Select value={d.category} onValueChange={(v: any) => setWeeklyForm((p) => ({ ...p, days: p.days.map((x, idx) => idx === i ? { ...x, category: v } : x) }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Development">Development</SelectItem>
                                <SelectItem value="Testing">Testing</SelectItem>
                                <SelectItem value="Meeting">Meeting</SelectItem>
                                <SelectItem value="Documentation">Documentation</SelectItem>
                                <SelectItem value="Support">Support</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <input type="checkbox" checked={d.billable} onChange={(e) => setWeeklyForm((p) => ({ ...p, days: p.days.map((x, idx) => idx === i ? { ...x, billable: e.target.checked } : x) }))} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Week
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsWeeklyOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Manager/Admin: Pending approvals */}
      {(user?.role === 'manager' || user?.role === 'admin') && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Review submitted entries employee-wise and approve.</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const groups = timesheets
                .filter((t) => t.status === 'Submitted')
                .reduce((acc: Record<string, { userId: string; userName: string; userEmail: string; items: typeof timesheets }>, t) => {
                  const key = t.userId;
                  if (!acc[key]) acc[key] = { userId: t.userId, userName: t.userName, userEmail: t.userEmail, items: [] as any } as any;
                  acc[key].items.push(t);
                  return acc;
                }, {});
              const keys = Object.keys(groups).sort((a, b) => {
                const nameA = (groups[a].userName || groups[a].userEmail || a || "").toString();
                const nameB = (groups[b].userName || groups[b].userEmail || b || "").toString();
                return nameA.localeCompare(nameB);
              });
              if (keys.length === 0) return <div className="text-sm text-muted-foreground">No pending submissions.</div>;

              const handleApprove = async (id: string) => {
                try {
                  setLoading(true);
                  const res = await fetch(`/api/pms-new/timesheets/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                  const text = await res.text();
                  let data: ApiResponse<any> | null = null;
                  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
                  if (!res.ok || !data || !data.success) throw new Error((data && (data as any).error) || text || 'Failed to approve');
                  await loadTimesheets();
                  onRefresh();
                } catch (e) {
                  console.error(e);
                } finally {
                  setLoading(false);
                }
              };

              const handleApproveMany = async (ids: string[]) => {
                try {
                  setLoading(true);
                  for (const id of ids) {
                    const res = await fetch(`/api/pms-new/timesheets/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                    // ignore body parsing for speed
                  }
                  await loadTimesheets();
                  onRefresh();
                } catch (e) {
                  console.error(e);
                } finally {
                  setLoading(false);
                }
              };

              return (
                <div className="space-y-6">
                  {keys.map((k) => {
                    const g = groups[k];
                    return (
                      <div key={k} className="border rounded-md">
                        <div className="flex items-center justify-between p-3 bg-muted/30">
                          <div>
                            <div className="font-medium">{g.userName || g.userEmail || g.userId}</div>
                            <div className="text-xs text-muted-foreground">{g.userEmail || g.userId}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => handleApproveMany(g.items.map((it) => it._id!).filter(Boolean))} disabled={g.items.length === 0}>Approve All</Button>
                          </div>
                        </div>
                        <div className="overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...g.items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((entry) => (
                                <TableRow key={entry._id}>
                                  <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                                  <TableCell className="font-medium">{entry.projectName}</TableCell>
                                  <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                                  <TableCell>{entry.hoursWorked.toFixed(1)}h</TableCell>
                                  <TableCell><Badge variant="outline">{entry.category}</Badge></TableCell>
                                  <TableCell className="max-w-[320px]"><div className="truncate" title={entry.taskDescription}>{entry.taskDescription}</div></TableCell>
                                  <TableCell>
                                    <Button size="sm" onClick={() => entry._id && handleApprove(entry._id)} disabled={loading}>Approve</Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Timesheet Entries Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.map((entry) => (
                <TableRow key={entry._id}>
                  <TableCell>
                    {format(new Date(entry.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.projectName}
                  </TableCell>
                  <TableCell>
                    {entry.startTime} - {entry.endTime}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{entry.hoursWorked.toFixed(1)}h</span>
                      {entry.overtime && (
                        <Badge variant="secondary" className="text-xs">
                          OT
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.category}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <div className="truncate" title={entry.taskDescription}>{entry.taskDescription}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  <TableCell className="flex gap-1">
                    {(user?.role === 'manager' || user?.role === 'admin') && entry.status === 'Submitted' && (
                      <Button variant="secondary" size="sm" onClick={() => entry._id && handleApproveEntry(entry._id)} disabled={loading}>
                        Approve
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={user?.role === 'employee' && entry.status !== 'Draft'}
                      onClick={() => {
                        if (entry._id && (entry.status === 'Draft' || user?.role === 'admin' || user?.role === 'manager')) {
                          if (window.confirm('Delete this entry?')) handleDelete(entry._id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {timesheets.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    No timesheet entries found. Add your first entry above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
