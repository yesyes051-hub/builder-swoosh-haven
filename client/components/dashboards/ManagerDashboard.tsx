import React, { useState, useEffect } from 'react';
import { ManagerDashboard as ManagerDashboardType } from '@shared/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Briefcase,
  Calendar,
  CheckCircle,
  UserCheck,
  BarChart3,
  Plus,
  Clock
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import ProjectAssignmentForm from '@/components/forms/ProjectAssignmentForm';
import { toast } from 'sonner';

interface Props {
  data: ManagerDashboardType;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  role: string;
  isActive: boolean;
}

interface ProjectAssignment {
  _id: string;
  employeeId: string;
  employeeName: string;
  projectName: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  assignedAt: string;
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
}

export default function ManagerDashboard({ data }: Props) {
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<ProjectAssignment[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const formatDate = (date: Date) => {
    // Format date for display
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No authentication token found');
        return;
      }
      
      const response = await fetch('/api/project-assignments/team-members', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401 || response.status === 403) {
        console.error('❌ Authentication failed - token may be expired');
        toast.error('Session expired. Please log in again.');
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Team members fetch failed:', response.status, errorText);
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTeamMembers(result.data);
      } else {
        console.error('❌ Team members API error:', result.error);
      }
    } catch (error) {
      console.error('❌ Error fetching team members:', error);
    }
  };

  const fetchRecentAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No authentication token found');
        return;
      }
      
      const response = await fetch('/api/project-assignments/recent?limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401 || response.status === 403) {
        console.error('❌ Authentication failed - token may be expired');
        toast.error('Session expired. Please log in again.');
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Recent assignments fetch failed:', response.status, errorText);
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setRecentAssignments(result.data);
      } else {
        console.error('❌ Recent assignments API error:', result.error);
      }
    } catch (error) {
      console.error('❌ Error fetching recent assignments:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTeamMembers(), fetchRecentAssignments()]);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  const handleAssignProject = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsAssignmentFormOpen(true);
  };

  const handleAssignmentSuccess = () => {
    fetchRecentAssignments();
    toast.success('Project assigned successfully!');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <DashboardLayout user={data.user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Team Dashboard - {data.user.firstName} {data.user.lastName}
          </h1>
          <p className="text-purple-100">
            Monitor your team's progress and assign new projects
          </p>
        </div>

        {/* Team Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Size</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {teamMembers.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Direct reports
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Team Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.teamPerformanceStats.avgTeamScore}/10
              </div>
              <p className="text-xs text-muted-foreground">
                Performance average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {recentAssignments.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Assigned projects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Manager Actions</span>
            </CardTitle>
            <CardDescription>
              Common management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <UserCheck className="h-4 w-4 mr-2" />
                Review Team Updates
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule 1:1s
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Performance Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Members and Recent Updates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Team Members</span>
              </CardTitle>
              <CardDescription>
                Your direct reports - hover to assign projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-pulse" />
                    <p>Loading team members...</p>
                  </div>
                ) : teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <div 
                      key={member._id} 
                      className="group relative flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 cursor-pointer"
                    >
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        {member.department && (
                          <p className="text-sm text-gray-500">{member.department}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge 
                          variant={member.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-gray-500 capitalize">
                          {member.role}
                        </span>
                      </div>
                      
                      {/* Hover overlay with + icon */}
                      <div className="absolute inset-0 bg-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 shadow-lg"
                          onClick={() => handleAssignProject(member)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Assign Project
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No team members found</p>
                    <p className="text-sm">Team members will appear here when available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Team Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Recent Team Updates</span>
              </CardTitle>
              <CardDescription>
                Latest project assignments and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-pulse" />
                    <p>Loading recent updates...</p>
                  </div>
                ) : recentAssignments.length > 0 ? (
                  recentAssignments.map((assignment) => (
                    <div key={assignment._id} className="border-l-4 border-purple-500 pl-4 py-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{assignment.employeeName}</p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(assignment.assignedAt)}
                          </p>
                        </div>
                        <Badge 
                          className={`text-xs ${getPriorityColor(assignment.priority)}`}
                          variant="outline"
                        >
                          {assignment.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Project:</strong> {assignment.projectName}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Deadline:</strong> {formatDate(new Date(assignment.deadline))}
                      </p>
                      {assignment.notes && (
                        <p className="text-sm text-gray-500 mt-1 italic">
                          "{assignment.notes}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent project assignments</p>
                    <p className="text-sm">Assigned projects will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Team Projects</span>
            </CardTitle>
            <CardDescription>
              Projects managed by you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.teamProjects.length > 0 ? (
                data.teamProjects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">{project.name}</h3>
                      <Badge 
                        variant={project.priority === 'high' ? 'destructive' : 
                                project.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {project.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Team:</span>
                        <span>{project.teamMembers.length} members</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Status:</span>
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Started:</span>
                        <span>{formatDate(project.startDate)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No projects assigned</p>
                  <p className="text-sm">Your managed projects will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Assignment Modal */}
      <ProjectAssignmentForm
        isOpen={isAssignmentFormOpen}
        onClose={() => setIsAssignmentFormOpen(false)}
        employee={selectedEmployee}
        onSuccess={handleAssignmentSuccess}
      />
    </DashboardLayout>
  );
}
