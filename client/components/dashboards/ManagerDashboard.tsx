import React from 'react';
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
  BarChart3
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';

interface Props {
  data: ManagerDashboardType;
}

export default function ManagerDashboard({ data }: Props) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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
            Monitor your team's progress and performance
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
                {data.teamPerformanceStats.teamSize}
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
                {data.teamPerformanceStats.activeProjects}
              </div>
              <p className="text-xs text-muted-foreground">
                In progress
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
                Your direct reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.teamMembers.length > 0 ? (
                  data.teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-4 p-3 border rounded-lg">
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
                        <span className="text-xs text-gray-500">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No team members</p>
                    <p className="text-sm">Team members will appear here</p>
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
                Latest progress from your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentTeamUpdates.length > 0 ? (
                  data.recentTeamUpdates.slice(0, 4).map((update) => (
                    <div key={update.id} className="border-l-4 border-purple-500 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            {update.user.firstName} {update.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(update.date)}</p>
                        </div>
                        <Badge variant="secondary">
                          {update.progressScore}/10
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Tasks:</strong> {update.tasks.slice(0, 2).join(', ')}
                        {update.tasks.length > 2 && '...'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Progress:</strong> {update.accomplishments.slice(0, 1).join(', ')}
                        {update.accomplishments.length > 1 && '...'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent updates</p>
                    <p className="text-sm">Team updates will appear here</p>
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
                  <div key={project.id} className="border rounded-lg p-4">
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
    </DashboardLayout>
  );
}
