import React from 'react';
import { Link } from 'react-router-dom';
import { HRDashboard as HRDashboardType } from '@shared/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  Plus,
  Clock,
  CheckCircle,
  UserPlus,
  FileText
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';

interface Props {
  data: HRDashboardType;
}

export default function HRDashboard({ data }: Props) {
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout user={data.user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            HR Dashboard - {data.user.firstName} {data.user.lastName}
          </h1>
          <p className="text-green-100">
            Manage talent development and interview processes
          </p>
        </div>

        {/* Department Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.departmentStats.totalEmployees}
              </div>
              <p className="text-xs text-muted-foreground">
                Active workforce
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Interviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {data.departmentStats.pendingInterviews}
              </div>
              <p className="text-xs text-muted-foreground">
                Scheduled this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Interviews</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.departmentStats.completedInterviews}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>HR Actions</span>
            </CardTitle>
            <CardDescription>
              Common HR management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-green-600 hover:bg-green-700">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Interview
              </Button>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Reports
              </Button>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Review Feedback
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Interviews and Recent Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scheduled Interviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Scheduled Interviews</span>
              </CardTitle>
              <CardDescription>
                Upcoming mock interviews you've scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.scheduledInterviews.length > 0 ? (
                  data.scheduledInterviews.slice(0, 4).map((interview) => (
                    <div key={interview.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">
                          {interview.type} Interview
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(interview.scheduledAt)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Duration: {interview.duration} minutes
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={interview.status === 'scheduled' ? 'default' : 'secondary'}
                          className="mb-1"
                        >
                          {interview.status}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          Candidate: {interview.candidateId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No scheduled interviews</p>
                    <p className="text-sm">Schedule interviews to see them here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Recent Feedback</span>
              </CardTitle>
              <CardDescription>
                Latest interview feedback submitted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentFeedback.length > 0 ? (
                  data.recentFeedback.slice(0, 4).map((feedback) => (
                    <div key={feedback.id} className="border-l-4 border-green-500 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">Interview Feedback</p>
                        <Badge variant="secondary">
                          {feedback.overallRating}/10
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                        <div>
                          <span className="text-gray-500">Technical:</span>
                          <span className="ml-1">{feedback.technicalSkills}/10</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Communication:</span>
                          <span className="ml-1">{feedback.communication}/10</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Problem Solving:</span>
                          <span className="ml-1">{feedback.problemSolving}/10</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Strengths:</strong> {feedback.strengths.slice(0, 2).join(', ')}
                        {feedback.strengths.length > 2 && '...'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent feedback</p>
                    <p className="text-sm">Interview feedback will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interview Management Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Interview Management</span>
            </CardTitle>
            <CardDescription>
              Tools to manage the interview process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium mb-1">Schedule Interview</h3>
                <p className="text-sm text-gray-600">Set up new mock interviews</p>
              </div>
              
              <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium mb-1">View Candidates</h3>
                <p className="text-sm text-gray-600">Manage employee interviews</p>
              </div>
              
              <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium mb-1">Feedback Reports</h3>
                <p className="text-sm text-gray-600">Review all feedback</p>
              </div>
              
              <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-medium mb-1">Interview Analytics</h3>
                <p className="text-sm text-gray-600">Performance insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
