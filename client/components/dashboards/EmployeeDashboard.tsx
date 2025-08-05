import React from 'react';
import { Link } from 'react-router-dom';
import { EmployeeDashboard as EmployeeDashboardType } from '@shared/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Users, 
  Plus,
  Clock,
  CheckCircle,
  Trophy
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';

interface Props {
  data: EmployeeDashboardType;
}

export default function EmployeeDashboard({ data }: Props) {
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {data.user.firstName}!
          </h1>
          <p className="text-blue-100">
            Track your progress and stay connected with your team
          </p>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.performanceStats.avgProgressScore}/10
              </div>
              <p className="text-xs text-muted-foreground">
                Based on daily updates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Update Streak</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.performanceStats.updateStreak}
              </div>
              <p className="text-xs text-muted-foreground">
                Consecutive days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leaderboard Rank</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                #{data.leaderboardPosition}
              </div>
              <p className="text-xs text-muted-foreground">
                Department ranking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Common tasks you can do right now
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Submit Daily Update
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Team Projects
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Updates and Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Recent Updates</span>
              </CardTitle>
              <CardDescription>
                Your latest daily progress reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentUpdates.length > 0 ? (
                  data.recentUpdates.slice(0, 3).map((update) => (
                    <div key={update.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{formatDate(update.date)}</p>
                        <Badge variant="secondary">
                          Score: {update.progressScore}/10
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Tasks:</strong> {update.tasks.slice(0, 2).join(', ')}
                        {update.tasks.length > 2 && '...'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Accomplishments:</strong> {update.accomplishments.slice(0, 1).join(', ')}
                        {update.accomplishments.length > 1 && '...'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No updates yet</p>
                    <p className="text-sm">Submit your first daily update to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Interviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Upcoming Interviews</span>
              </CardTitle>
              <CardDescription>
                Your scheduled mock interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.upcomingInterviews.length > 0 ? (
                  data.upcomingInterviews.slice(0, 3).map((interview) => (
                    <div key={interview.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{interview.type} Interview</p>
                        <p className="text-sm text-gray-600">
                          {new Date(interview.scheduledAt).toLocaleDateString()} at{' '}
                          {new Date(interview.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          Duration: {interview.duration} minutes
                        </p>
                      </div>
                      <Badge variant="outline">{interview.status}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No upcoming interviews</p>
                    <p className="text-sm">Your scheduled interviews will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Current Projects</span>
            </CardTitle>
            <CardDescription>
              Active projects you're working on
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.currentProjects.length > 0 ? (
                data.currentProjects.map((project) => (
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
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        Team: {project.teamMembers.length} members
                      </span>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No active projects</p>
                  <p className="text-sm">Your assigned projects will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
