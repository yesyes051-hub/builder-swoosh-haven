import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FolderOpen,
  Ticket,
  Users,
  Clock,
  Laptop,
  Cake,
  MessageSquare,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Edit,
  Eye,
  Filter,
  Download,
  Bell
} from 'lucide-react';
import DashboardLayout from '@/components/dashboards/DashboardLayout';
import BirthdayManager from '@/components/pms/BirthdayManager';
import ProjectForm from '@/components/pms/ProjectForm';
import { ApiResponse } from '@shared/api';

interface ProjectDetail {
  _id: string;
  projectName: string;
  projectManager: string;
  startDate: string;
  endDate?: string;
  status: 'Planning' | 'In Progress' | 'In Review' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  teamMembers: string[];
  budget?: number;
}

interface TicketData {
  _id: string;
  ticketId: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  reportedBy: string;
  status: 'Pending' | 'In Progress' | 'In Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  type: 'Bug' | 'Feature' | 'Enhancement' | 'Task';
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  createdAt: string;
}

interface Birthday {
  _id: string;
  userId: string;
  name: string;
  department: string;
  role: string;
  birthday: string;
  email: string;
  wishSent: boolean;
}

interface TimesheetData {
  _id: string;
  userId: string;
  projectId: string;
  date: string;
  hoursWorked: number;
  taskDescription: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  billable: boolean;
}

interface AccessoryData {
  _id: string;
  userId: string;
  itemName: string;
  itemType: string;
  serialNumber?: string;
  assignedDate: string;
  status: 'Assigned' | 'Returned' | 'Lost' | 'Damaged';
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
}

export default function PMSNew() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReminder, setShowReminder] = useState(false);

  // Data states
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [birthdays, setBirthdays] = useState<{ all: Birthday[]; upcoming: Birthday[] }>({ all: [], upcoming: [] });
  const [timesheets, setTimesheets] = useState<TimesheetData[]>([]);
  const [accessories, setAccessories] = useState<AccessoryData[]>([]);

  // Form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  useEffect(() => {
    if (user && token) {
      fetchAllData();
      checkTimesheetReminder();
    }
  }, [user, token]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProjects(),
        fetchTickets(),
        fetchBirthdays(),
        fetchTimesheets(),
        fetchAccessories()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/pms/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: ApiResponse<ProjectDetail[]> = await response.json();
      if (data.success) setProjects(data.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/pms/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: ApiResponse<TicketData[]> = await response.json();
      if (data.success) setTickets(data.data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  const fetchBirthdays = async () => {
    try {
      const response = await fetch('/api/pms/birthdays', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: ApiResponse<{ all: Birthday[]; upcoming: Birthday[] }> = await response.json();
      if (data.success) setBirthdays(data.data || { all: [], upcoming: [] });
    } catch (err) {
      console.error('Error fetching birthdays:', err);
    }
  };

  const fetchTimesheets = async () => {
    try {
      const response = await fetch('/api/pms/timesheets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: ApiResponse<TimesheetData[]> = await response.json();
      if (data.success) setTimesheets(data.data || []);
    } catch (err) {
      console.error('Error fetching timesheets:', err);
    }
  };

  const fetchAccessories = async () => {
    try {
      const response = await fetch('/api/pms/accessories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: ApiResponse<AccessoryData[]> = await response.json();
      if (data.success) setAccessories(data.data || []);
    } catch (err) {
      console.error('Error fetching accessories:', err);
    }
  };

  const checkTimesheetReminder = async () => {
    try {
      const response = await fetch('/api/pms/timesheet-reminders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: ApiResponse<{ needsReminder: boolean; message: string }> = await response.json();
      if (data.success && data.data?.needsReminder) {
        setShowReminder(true);
      }
    } catch (err) {
      console.error('Error checking timesheet reminder:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'On Hold': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBirthdayDate = (birthday: string) => {
    const date = new Date(birthday);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = (birthday: string) => {
    const today = new Date();
    const birthdayDate = new Date(birthday);
    return today.getMonth() === birthdayDate.getMonth() && 
           today.getDate() === birthdayDate.getDate();
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Timesheet Reminder Popup */}
        {showReminder && (
          <Alert className="border-orange-200 bg-orange-50 text-orange-800">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <div className="flex justify-between items-center">
                <span>⏰ Don't forget to submit your timesheet for today!</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setShowReminder(false);
                    setActiveTab('timesheets');
                  }}
                >
                  Submit Now
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PMS Dashboard</h1>
            <p className="text-gray-600">Project Management System - Complete Overview</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading PMS data...</span>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="projects">Project Details</TabsTrigger>
              <TabsTrigger value="tickets">Ticket Tracking</TabsTrigger>
              <TabsTrigger value="status">Status Legend</TabsTrigger>
              <TabsTrigger value="standups">Standups</TabsTrigger>
              <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
              <TabsTrigger value="accessories">Accessories</TabsTrigger>
              <TabsTrigger value="birthdays">Birthdays</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            {/* Project Details Tab */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FolderOpen className="h-5 w-5" />
                      <span>Project Details</span>
                    </CardTitle>
                    <CardDescription>Manage and track all project information</CardDescription>
                  </div>
                  {(user.role === 'admin' || user.role === 'manager') && (
                    <ProjectForm onProjectCreated={(project) => {
                      setProjects([project, ...projects]);
                    }} />
                  )}
                </CardHeader>
                <CardContent>
                  {projects.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Manager</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>Team Size</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map((project) => (
                          <TableRow key={project._id}>
                            <TableCell className="font-medium">{project.projectName}</TableCell>
                            <TableCell>{project.projectManager}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(project.priority)}>
                                {project.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(project.startDate)}</TableCell>
                            <TableCell>{project.teamMembers.length}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No projects found</p>
                      <p className="text-sm">Create your first project to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ticket Tracking Tab */}
            <TabsContent value="tickets" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Ticket className="h-5 w-5" />
                      <span>Ticket Tracking Table</span>
                    </CardTitle>
                    <CardDescription>Track all project tickets and issues</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Ticket
                  </Button>
                </CardHeader>
                <CardContent>
                  {tickets.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map((ticket) => (
                          <TableRow key={ticket._id}>
                            <TableCell className="font-medium">{ticket.ticketId}</TableCell>
                            <TableCell>{ticket.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{ticket.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>{ticket.assignedTo}</TableCell>
                            <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No tickets found</p>
                      <p className="text-sm">Create your first ticket to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Status Legend Tab */}
            <TabsContent value="status" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Status Legend</span>
                  </CardTitle>
                  <CardDescription>Color coding and status definitions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Project & Ticket Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor('Pending')}>Pending</Badge>
                        <span className="text-sm">Not started yet</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor('In Progress')}>In Progress</Badge>
                        <span className="text-sm">Currently active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor('In Review')}>In Review</Badge>
                        <span className="text-sm">Under review</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor('Completed')}>Completed</Badge>
                        <span className="text-sm">Finished successfully</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Priority Levels</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor('Critical')}>Critical</Badge>
                        <span className="text-sm">Immediate attention</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor('High')}>High</Badge>
                        <span className="text-sm">High importance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor('Medium')}>Medium</Badge>
                        <span className="text-sm">Normal priority</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor('Low')}>Low</Badge>
                        <span className="text-sm">Can wait</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Birthday Notifications Tab */}
            <TabsContent value="birthdays" className="space-y-4">
              <BirthdayManager
                birthdays={birthdays}
                onRefresh={fetchBirthdays}
              />
            </TabsContent>

            {/* Placeholder tabs for other modules */}
            <TabsContent value="standups" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Standup Call Tracking</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Standup tracking module coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timesheets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Timesheet Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Enhanced timesheet management coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accessories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Laptop className="h-5 w-5" />
                    <span>Accessories Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Laptop className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Accessories tracking module coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              {user?.role === 'admin' ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>User Management</span>
                    </CardTitle>
                    <CardDescription>
                      Admin-only: Manage employees, assign temporary passwords, and control access
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserManagement />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Additional Features</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Additional features module coming soon...</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
