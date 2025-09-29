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

  Loader2,
  AlertTriangle,
  User,
  Star,
  Eye
} from 'lucide-react';
import ScheduleInterviewModal from '@/components/interviews/ScheduleInterviewModal';
import InterviewFeedbackModal from '@/components/interviews/InterviewFeedbackModal';
import DashboardLayout from '@/components/dashboards/DashboardLayout';
import { MockInterview, ApiResponse, InterviewFeedback as IInterviewFeedback } from '@shared/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface InterviewWithDetails extends MockInterview {
  candidate?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  } | null;
  interviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  } | null;
  scheduledByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export default function Interviews() {
  const { user, token } = useAuth();
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [error, setError] = useState('');

  // Feedback submission modal state
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    interview: InterviewWithDetails | null;
  }>({ open: false, interview: null });

  // Feedback viewing modal state
  const [viewFeedback, setViewFeedback] = useState<{
    open: boolean;
    interview: InterviewWithDetails | null;
    loading: boolean;
    feedbacks: IInterviewFeedback[];
    error: string;
  }>({ open: false, interview: null, loading: false, feedbacks: [], error: '' });

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

  const handleScheduleSuccess = () => {
    fetchInterviews();
    setShowScheduleModal(false);
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
        fetchInterviews();
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

  if (!user) return null;

  // Authorization checks
  const canSeeAll = user.role === 'hr' || user.role === 'admin' || user.role === 'manager';

  // Employees only see interviews they are related to; privileged roles can see all
  const myInterviews = interviews.filter((i) => i.candidateId === user.id || i.interviewerId === user.id || i.scheduledBy === user.id);
  const visibleInterviews = canSeeAll ? interviews : myInterviews;

  // Categorization per requirements
  const now = new Date();
  const upcomingInterviews = visibleInterviews.filter((i) => i.status === 'scheduled' && new Date(i.scheduledAt) > now);
  const completedInterviews = visibleInterviews.filter((i) => i.status === 'completed');
  const historyInterviews = visibleInterviews.filter((i) => new Date(i.scheduledAt) < now || i.status === 'completed' || i.status === 'cancelled');

  const openViewFeedback = async (interview: InterviewWithDetails) => {
    setViewFeedback({ open: true, interview, loading: true, feedbacks: [], error: '' });
    try {
      const resp = await fetch(`/api/interviews/${interview.id}/feedback`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: ApiResponse<IInterviewFeedback[]> = await resp.json();

      if (!resp.ok || !data.success) {
        // Gracefully handle 404 (no feedback yet)
        const msg = data.error || (resp.status === 404 ? 'No feedback submitted yet' : 'Failed to load feedback');
        setViewFeedback((prev) => ({ ...prev, loading: false, error: msg }));
        return;
      }

      setViewFeedback((prev) => ({ ...prev, loading: false, feedbacks: data.data || [] }));
    } catch (e) {
      console.error('Load feedback error:', e);
      setViewFeedback((prev) => ({ ...prev, loading: false, error: 'Failed to load feedback' }));
    }
  };

  const canViewFeedbackFor = (interview: InterviewWithDetails) => {
    // HR/Admin/Manager can view all feedback; employees only if involved
    return canSeeAll || interview.candidateId === user.id || interview.interviewerId === user.id;
  };

  const canSubmitFeedbackFor = (interview: InterviewWithDetails) => {
    // Allow interviewer or candidate to submit feedback after completion; HR/Admin can also submit if needed
    return (
      interview.status === 'completed' && (
        interview.interviewerId === user.id ||
        interview.candidateId === user.id ||
        user.role === 'hr' ||
        user.role === 'admin'
      )
    );
  };

  const renderList = (list: InterviewWithDetails[]) => (
    <div className="space-y-4">
      {list.map((interview) => (
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
                {(interview.candidateId === user.id || interview.interviewerId === user.id) && (
                  <Badge variant="outline">
                    {interview.candidateId === user.id ? 'You are the candidate' : 'You are the interviewer'}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1">
                {interview.candidate?.firstName} {interview.candidate?.lastName}
                <span className="text-gray-500 text-sm ml-2">interviewed by</span>
                {' '}
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
              {/* Status transitions available to interviewer (and admin/hr via backend) */}
              {interview.interviewerId === user.id && interview.status === 'scheduled' && (
                <Button size="sm" onClick={() => updateInterviewStatus(interview.id, 'in-progress')} className="bg-yellow-600 hover:bg-yellow-700">
                  Start Interview
                </Button>
              )}
              {interview.interviewerId === user.id && interview.status === 'in-progress' && (
                <Button size="sm" onClick={() => updateInterviewStatus(interview.id, 'completed')} className="bg-green-600 hover:bg-green-700">
                  Complete Interview
                </Button>
              )}

              {/* View Feedback is guarded by ACL (server enforces; client hides button unless authorized) */}
              {canViewFeedbackFor(interview) && (
                <Button size="sm" variant="outline" onClick={() => openViewFeedback(interview)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View Feedback
                </Button>
              )}

              {/* Submit Feedback available after completion to interviewer/candidate and HR/Admin */}
              {canSubmitFeedbackFor(interview) && (
                <Button size="sm" variant="outline" onClick={() => setFeedbackModal({ open: true, interview })}>
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Submit Feedback
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

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
            <Button onClick={() => setShowScheduleModal(true)} className="bg-blue-600 hover:bg-blue-700">
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
          <Tabs defaultValue="upcoming" className="space-y-6">
            {/* Tabs are conditionally meaningful: employees see only their items due to visibleInterviews */}
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="all">{canSeeAll ? 'All' : 'My Interviews'}</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Upcoming Interviews</span>
                  </CardTitle>
                  <CardDescription>Interviews scheduled for the future</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingInterviews.length > 0 ? (
                    renderList(upcomingInterviews)
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No upcoming interviews</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Completed Interviews</span>
                  </CardTitle>
                  <CardDescription>All completed interviews</CardDescription>
                </CardHeader>
                <CardContent>
                  {completedInterviews.length > 0 ? (
                    renderList(completedInterviews)
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No completed interviews</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Interview History</span>
                  </CardTitle>
                  <CardDescription>Past and completed interviews</CardDescription>
                </CardHeader>
                <CardContent>
                  {historyInterviews.length > 0 ? (
                    renderList(historyInterviews)
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No interview history</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>{canSeeAll ? 'All Interviews' : 'My Interviews'}</span>
                  </CardTitle>
                  <CardDescription>
                    {canSeeAll ? 'Complete overview of all interviews' : 'Interviews you are involved in'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {visibleInterviews.length > 0 ? (
                    renderList(visibleInterviews)
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No interviews found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Schedule Interview Modal (HR/Admin only access via button) */}
        <ScheduleInterviewModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={handleScheduleSuccess}
        />

        {/* Submit Feedback Modal */}
        <InterviewFeedbackModal
          isOpen={feedbackModal.open}
          onClose={() => setFeedbackModal({ open: false, interview: null })}
          interview={
            feedbackModal.interview
              ? {
                  id: feedbackModal.interview.id,
                  candidateId: feedbackModal.interview.candidateId,
                  candidate: feedbackModal.interview.candidate
                    ? {
                        firstName: feedbackModal.interview.candidate.firstName,
                        lastName: feedbackModal.interview.candidate.lastName,
                      }
                    : undefined,
                  type: feedbackModal.interview.type,
                  scheduledAt: feedbackModal.interview.scheduledAt,
                }
              : { id: '', candidateId: '', type: 'general', scheduledAt: new Date() }
          }
        />

        {/* View Feedback Modal */}
        <Dialog open={viewFeedback.open} onOpenChange={() => setViewFeedback({ open: false, interview: null, loading: false, feedbacks: [], error: '' })}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Interview Feedback</DialogTitle>
              <DialogDescription>
                {viewFeedback.interview && (
                  <>
                    Candidate: {viewFeedback.interview.candidate?.firstName} {viewFeedback.interview.candidate?.lastName} · Interviewer: {viewFeedback.interview.interviewer?.firstName} {viewFeedback.interview.interviewer?.lastName}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {viewFeedback.loading && (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading feedback...
              </div>
            )}

            {!viewFeedback.loading && viewFeedback.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{viewFeedback.error}</AlertDescription>
              </Alert>
            )}

            {!viewFeedback.loading && !viewFeedback.error && viewFeedback.feedbacks.length === 0 && (
              <div className="text-center py-6 text-gray-500">No feedback submitted yet</div>
            )}

            {!viewFeedback.loading && viewFeedback.feedbacks.length > 0 && (
              <div className="space-y-4">
                {viewFeedback.feedbacks.map((fb) => (
                  <Card key={fb.id} className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base">Submitted By: {fb.submittedBy === user.id ? 'You' : fb.submittedBy}</CardTitle>
                      <CardDescription>
                        Submitted on {new Date(fb.createdAt).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      {fb.ratings && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {Object.entries(fb.ratings).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-medium">{v}/5</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {fb.writtenFeedback && (
                        <div>
                          <div className="text-gray-600">Comments</div>
                          <div className="mt-1">{fb.writtenFeedback}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
