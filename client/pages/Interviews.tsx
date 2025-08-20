import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  MessageSquare,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  User,
  Star
} from 'lucide-react';
import ScheduleInterviewModal from '@/components/interviews/ScheduleInterviewModal';
import InterviewFeedbackForm from '@/components/interviews/InterviewFeedbackForm';
import DashboardLayout from '@/components/dashboards/DashboardLayout';
import { MockInterview, ApiResponse } from '@shared/api';

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

export default function Interviews() {
  const { user, token } = useAuth();
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && token) {
      fetchInterviews();
    }
  }, [user, token]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/interviews', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data: ApiResponse<InterviewWithDetails[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch interviews');
      }

      setInterviews(data.data || []);
    } catch (err) {
      console.error('Fetch interviews error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSuccess = (newInterview: MockInterview) => {
    fetchInterviews(); // Refresh the list
    setShowScheduleForm(false);
  };

  const handleFeedbackSuccess = () => {
    fetchInterviews(); // Refresh the list
    setShowFeedbackForm(null);
  };

  const updateInterviewStatus = async (interviewId: string, status: string) => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchInterviews(); // Refresh the list
      }
    } catch (err) {
      console.error('Update interview status error:', err);
    }
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

  const myInterviews = interviews.filter(interview => 
    interview.candidateId === user?.id || interview.interviewerId === user?.id
  );

  const upcomingInterviews = interviews.filter(interview => 
    interview.status === 'scheduled' && new Date(interview.scheduledAt) > new Date()
  );

  const completedInterviews = interviews.filter(interview => 
    interview.status === 'completed'
  );

  if (!user) {
    return null;
  }

  if (showScheduleForm) {
    return (
      <DashboardLayout user={user}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setShowScheduleForm(false)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Interviews</span>
            </Button>
            <h1 className="text-2xl font-bold">Schedule Interview</h1>
          </div>
          <ScheduleInterviewForm 
            onSuccess={handleScheduleSuccess}
            onCancel={() => setShowScheduleForm(false)}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (showFeedbackForm) {
    return (
      <DashboardLayout user={user}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setShowFeedbackForm(null)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Interviews</span>
            </Button>
            <h1 className="text-2xl font-bold">Submit Feedback</h1>
          </div>
          <InterviewFeedbackForm 
            interviewId={showFeedbackForm}
            onSuccess={handleFeedbackSuccess}
            onCancel={() => setShowFeedbackForm(null)}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
            <p className="text-gray-600">Manage mock interviews and feedback</p>
          </div>
          {(user.role === 'hr' || user.role === 'admin') && (
            <Button 
              onClick={() => setShowScheduleForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          )}
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
              <span className="ml-2">Loading interviews...</span>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="all">Interviews</TabsTrigger>
            </TabsList>

            {/* Interviews Tab */}
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>All Interviews</span>
                  </CardTitle>
                  <CardDescription>
                    Complete overview of all scheduled interviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {interviews.length > 0 ? (
                    <div className="space-y-4">
                      {interviews.map((interview) => (
                        <div key={`all-${interview.id}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className={getInterviewTypeColor(interview.type)}>
                                  {interview.type}
                                </Badge>
                                <Badge className={getStatusColor(interview.status)}>
                                  {interview.status}
                                </Badge>
                                {(interview.candidateId === user.id || interview.interviewerId === user.id) && (
                                  <Badge variant="outline">
                                    {interview.candidateId === user.id ? 'You are the candidate' : 'You are the interviewer'}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-lg mb-1">
                                {interview.candidate?.firstName} {interview.candidate?.lastName}
                                <span className="text-gray-500 text-sm ml-2">interviewed by</span>
                                {interview.interviewer?.firstName} {interview.interviewer?.lastName}
                              </h3>
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDateTime(interview.scheduledAt)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{interview.duration} minutes</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4" />
                                  <span>Candidate: {interview.candidate?.department}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Star className="h-4 w-4" />
                                  <span>Interviewer: {interview.interviewer?.department}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                              {interview.interviewerId === user.id && (
                                <>
                                  {interview.status === 'scheduled' && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateInterviewStatus(interview.id, 'in-progress')}
                                      className="bg-yellow-600 hover:bg-yellow-700"
                                    >
                                      Start Interview
                                    </Button>
                                  )}
                                  {interview.status === 'in-progress' && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateInterviewStatus(interview.id, 'completed')}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Complete Interview
                                    </Button>
                                  )}
                                  {interview.status === 'completed' && (
                                    <Button
                                      size="sm"
                                      onClick={() => setShowFeedbackForm(interview.id)}
                                      variant="outline"
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      Submit Feedback
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No interviews scheduled</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
