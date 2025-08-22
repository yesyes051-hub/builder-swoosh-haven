import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronDown, 
  ChevronRight, 
  Star,
  MessageSquare,
  Users,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PendingInterview {
  id: string;
  candidateId: string;
  interviewerId: string;
  scheduledBy: string;
  date: Date;
  time: string;
  type: 'technical' | 'behavioral' | 'system-design' | 'general';
  duration: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
  } | null;
  interviewer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
  } | null;
  feedback: {
    id: string;
    interviewId: string;
    candidateId: string;
    submittedBy: string;
    ratings: {
      communication: number;
      confidence: number;
      presenceOfMind: number;
      interpersonalSkills: number;
      bodyGesture: number;
      technicalQuestionHandling: number;
      codingElaboration: number;
      energyInInterview: number;
      analyticalThinking: number;
    };
    averageRating: number;
    writtenFeedback: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingInterviewsModal({ isOpen, onClose }: Props) {
  const { token } = useAuth();
  const [pendingInterviews, setPendingInterviews] = useState<PendingInterview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedInterviews, setExpandedInterviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && token) {
      fetchPendingInterviews();
    }
  }, [isOpen, token]);

  const fetchPendingInterviews = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/interviews/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch pending interviews (${response.status}): ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If response is not JSON, use the text content
          if (errorText) {
            errorMessage = errorText;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setPendingInterviews(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch pending interviews');
      }
    } catch (err) {
      console.error('Error fetching pending interviews:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterviewExpansion = (interviewId: string) => {
    const newExpanded = new Set(expandedInterviews);
    if (newExpanded.has(interviewId)) {
      newExpanded.delete(interviewId);
    } else {
      newExpanded.add(interviewId);
    }
    setExpandedInterviews(newExpanded);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'behavioral':
        return 'bg-green-100 text-green-800';
      case 'system-design':
        return 'bg-purple-100 text-purple-800';
      case 'general':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const renderFeedbackSection = (feedback: PendingInterview['feedback']) => {
    if (!feedback) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">No feedback available</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-400" />
            <span className="font-medium">Overall Rating</span>
          </div>
          {renderRatingStars(feedback.averageRating)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Individual Ratings</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Communication:</span>
                <span className="font-medium">{feedback.ratings.communication}/5</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="font-medium">{feedback.ratings.confidence}/5</span>
              </div>
              <div className="flex justify-between">
                <span>Presence of Mind:</span>
                <span className="font-medium">{feedback.ratings.presenceOfMind}/5</span>
              </div>
              <div className="flex justify-between">
                <span>Interpersonal Skills:</span>
                <span className="font-medium">{feedback.ratings.interpersonalSkills}/5</span>
              </div>
              <div className="flex justify-between">
                <span>Body Gesture:</span>
                <span className="font-medium">{feedback.ratings.bodyGesture}/5</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Technical Skills</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Technical Questions:</span>
                <span className="font-medium">{feedback.ratings.technicalQuestionHandling}/5</span>
              </div>
              <div className="flex justify-between">
                <span>Coding Elaboration:</span>
                <span className="font-medium">{feedback.ratings.codingElaboration}/5</span>
              </div>
              <div className="flex justify-between">
                <span>Energy in Interview:</span>
                <span className="font-medium">{feedback.ratings.energyInInterview}/5</span>
              </div>
              <div className="flex justify-between">
                <span>Analytical Thinking:</span>
                <span className="font-medium">{feedback.ratings.analyticalThinking}/5</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            <h4 className="font-medium text-sm">Written Feedback</h4>
          </div>
          <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md">
            {feedback.writtenFeedback}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Pending Interviews</span>
            {!loading && (
              <Badge variant="secondary" className="ml-2">
                {pendingInterviews.length} interviews
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-2 text-gray-600">Loading interviews...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-600 py-4">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && pendingInterviews.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No pending interviews found</p>
            </div>
          )}

          {!loading && !error && pendingInterviews.length > 0 && (
            <div className="space-y-4">
              {pendingInterviews.map((interview) => (
                <Card key={interview.id} className="w-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Users className="h-5 w-5" />
                          <span>
                            {interview.candidate?.firstName} {interview.candidate?.lastName}
                          </span>
                          <Badge className={getTypeColor(interview.type)}>
                            {interview.type}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(interview.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{interview.time} ({interview.duration} min)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>
                              Interviewer: {interview.interviewer?.firstName} {interview.interviewer?.lastName}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleInterviewExpansion(interview.id)}
                      >
                        {expandedInterviews.has(interview.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <Collapsible
                    open={expandedInterviews.has(interview.id)}
                    onOpenChange={() => toggleInterviewExpansion(interview.id)}
                  >
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="space-y-2">
                            <h3 className="font-medium">Candidate Details</h3>
                            <div className="text-sm space-y-1">
                              <p><strong>Email:</strong> {interview.candidate?.email}</p>
                              <p><strong>Department:</strong> {interview.candidate?.department}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h3 className="font-medium">Interviewer Details</h3>
                            <div className="text-sm space-y-1">
                              <p><strong>Email:</strong> {interview.interviewer?.email}</p>
                              <p><strong>Department:</strong> {interview.interviewer?.department}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-medium">Interview Feedback</h3>
                          {renderFeedbackSection(interview.feedback)}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
