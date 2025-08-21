import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EmployeeDashboard as EmployeeDashboardType, ApiResponse, MockInterview } from '@shared/api';
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
  Trophy,
  BarChart3,
  User,
  Loader2,
  RefreshCw
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  data: EmployeeDashboardType;
}

interface InterviewWithDetails extends MockInterview {
  candidate?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
  interviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
  scheduledByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function EmployeeDashboard({ data }: Props) {
  const { token } = useAuth();
  const [myInterviews, setMyInterviews] = useState<InterviewWithDetails[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  useEffect(() => {
    fetchMyInterviews();
  }, [token]);

  // Auto-refresh interviews when window gains focus (user returns from other pages)
  useEffect(() => {
    const handleFocus = () => {
      fetchMyInterviews();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchMyInterviews = async () => {
    try {
      setLoadingInterviews(true);
      const response = await fetch('/api/interviews', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result: ApiResponse<InterviewWithDetails[]> = await response.json();

      if (response.ok && result.success && result.data) {
        // Filter interviews where the current user is the candidate
        const userInterviews = result.data.filter(interview =>
          interview.candidateId === data.user.id
        );
        setMyInterviews(userInterviews);
      }
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoadingInterviews(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInterviewTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-purple-100 text-purple-800';
      case 'behavioral': return 'bg-green-100 text-green-800';
      case 'system-design': return 'bg-orange-100 text-orange-800';
      case 'general': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
              <Link to="/daily-updates">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Daily Update
                </Button>
              </Link>
              <Link to="/pms">
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View PMS
                </Button>
              </Link>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
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

          {/* My Interviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>My Interviews</span>
              </CardTitle>
              <CardDescription>
                Your scheduled mock interviews with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInterviews ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2">Loading interviews...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {myInterviews.length > 0 ? (
                    myInterviews.map((interview) => (
                      <div key={interview.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getInterviewTypeColor(interview.type)}>
                                {interview.type}
                              </Badge>
                              <Badge className={getStatusColor(interview.status)}>
                                {interview.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-lg mb-2">
                              {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-start space-x-2">
                                <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                                <div>
                                  <div className="font-medium text-gray-900">Date & Time</div>
                                  <div className="text-gray-600">{formatDateTime(interview.scheduledAt)}</div>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Clock className="h-4 w-4 text-green-600 mt-0.5" />
                                <div>
                                  <div className="font-medium text-gray-900">Duration</div>
                                  <div className="text-gray-600">{interview.duration} minutes</div>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <User className="h-4 w-4 text-purple-600 mt-0.5" />
                                <div>
                                  <div className="font-medium text-gray-900">Interviewer</div>
                                  <div className="text-gray-600">{interview.interviewer?.firstName} {interview.interviewer?.lastName}</div>
                                  {interview.interviewer?.email && (
                                    <div className="text-xs text-gray-500">{interview.interviewer.email}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <CheckCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                                <div>
                                  <div className="font-medium text-gray-900">Status</div>
                                  <div className="text-gray-600">{interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No scheduled interviews</p>
                      <p className="text-sm">Your scheduled interviews will appear here</p>
                    </div>
                  )}
                </div>
              )}
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
