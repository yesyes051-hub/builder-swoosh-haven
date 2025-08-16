import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ApiResponse } from '@shared/api';

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
  category: 'Development' | 'Testing' | 'Meeting' | 'Documentation' | 'Support' | 'Other';
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    projectId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00',
    taskDescription: '',
    category: 'Development' as const,
    billable: true
  });

  useEffect(() => {
    loadTimesheets();
    loadProjects();
  }, []);

  const loadTimesheets = async () => {
    try {
      const response = await fetch('/api/pms-new/timesheets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: ApiResponse<TimesheetEntry[]> = await response.json();
      
      if (data.success) {
        setTimesheets(data.data);
      }
    } catch (error) {
      console.error('Error loading timesheets:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/pms/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: ApiResponse<Project[]> = await response.json();
      
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '17:00',
      taskDescription: '',
      category: 'Development',
      billable: true
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/pms-new/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data: ApiResponse<TimesheetEntry> = await response.json();

      if (data.success) {
        setSuccess('Timesheet entry created successfully!');
        resetForm();
        setIsFormOpen(false);
        loadTimesheets();
        onRefresh();
      } else {
        setError(data.error || 'Failed to save timesheet entry');
      }
    } catch (error) {
      setError('An error occurred while saving the timesheet entry');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Draft': 'secondary',
      'Submitted': 'outline',
      'Approved': 'default',
      'Rejected': 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
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
                <Label htmlFor="project">Project</Label>
                <Select value={formData.projectId} onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}>
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

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, taskDescription: e.target.value }))}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="billable"
                  checked={formData.billable}
                  onChange={(e) => setFormData(prev => ({ ...prev, billable: e.target.checked }))}
                />
                <Label htmlFor="billable">Billable</Label>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Entry
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.map((entry) => (
                <TableRow key={entry._id}>
                  <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-medium">{entry.projectName}</TableCell>
                  <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{entry.hoursWorked.toFixed(1)}h</span>
                      {entry.overtime && <Badge variant="secondary" className="text-xs">OT</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.category}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                </TableRow>
              ))}
              {timesheets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
