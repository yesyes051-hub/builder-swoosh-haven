import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ScheduleInterviewRequest, ApiResponse, MockInterview } from '@shared/api';

interface InterviewerOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  role: string;
}

interface Props {
  onSuccess?: (interview: MockInterview) => void;
  onCancel?: () => void;
}

export default function ScheduleInterviewForm({ onSuccess, onCancel }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingInterviewers, setLoadingInterviewers] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [interviewers, setInterviewers] = useState<InterviewerOption[]>([]);

  // Form state
  const [candidateId, setCandidateId] = useState('');
  const [interviewerId, setInterviewerId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [type, setType] = useState<'technical' | 'behavioral' | 'system-design' | 'general'>('technical');

  useEffect(() => {
    fetchInterviewers();
  }, []);

  const fetchInterviewers = async () => {
    try {
      setLoadingInterviewers(true);
      const response = await fetch('/api/interviews/interviewers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data: ApiResponse<InterviewerOption[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch interviewers');
      }

      setInterviewers(data.data || []);
    } catch (err) {
      console.error('Fetch interviewers error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load interviewers');
    } finally {
      setLoadingInterviewers(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!candidateId || !interviewerId || !selectedDate || !selectedTime || !duration || !type) {
      setError('Please fill in all required fields');
      return;
    }

    if (candidateId === interviewerId) {
      setError('Candidate and interviewer cannot be the same person');
      return;
    }

    try {
      setLoading(true);

      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const interviewData: ScheduleInterviewRequest = {
        candidateId,
        interviewerId,
        scheduledAt: scheduledDateTime,
        duration: parseInt(duration),
        type
      };

      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(interviewData)
      });

      const data: ApiResponse<MockInterview> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to schedule interview');
      }

      setSuccess('Interview scheduled successfully!');
      
      // Reset form
      setCandidateId('');
      setInterviewerId('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setDuration('60');
      setType('technical');

      if (onSuccess && data.data) {
        onSuccess(data.data);
      }
    } catch (err) {
      console.error('Schedule interview error:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  const candidates = interviewers.filter(person => person.role === 'employee');
  const availableInterviewers = interviewers.filter(person => 
    person.role === 'employee' || person.role === 'manager'
  );

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <span>Schedule Mock Interview</span>
        </CardTitle>
        <CardDescription>
          Schedule a mock interview between a candidate and an interviewer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {loadingInterviewers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2">Loading available personnel...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Candidate Selection */}
              <div className="space-y-2">
                <Label htmlFor="candidate">Candidate (Employee)</Label>
                <Select value={candidateId} onValueChange={setCandidateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        <div className="flex flex-col">
                          <span>{candidate.firstName} {candidate.lastName}</span>
                          <span className="text-xs text-gray-500">
                            {candidate.department} • {candidate.email}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Interviewer Selection */}
              <div className="space-y-2">
                <Label htmlFor="interviewer">Interviewer</Label>
                <Select value={interviewerId} onValueChange={setInterviewerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInterviewers.map((interviewer) => (
                      <SelectItem key={interviewer.id} value={interviewer.id}>
                        <div className="flex flex-col">
                          <span>{interviewer.firstName} {interviewer.lastName}</span>
                          <span className="text-xs text-gray-500">
                            {interviewer.role} • {interviewer.department} • {interviewer.email}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Interview Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !selectedDate && "text-muted-foreground"
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <Label htmlFor="time">Interview Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {generateTimeSlots().map((timeSlot) => (
                      <SelectItem key={timeSlot} value={timeSlot}>
                        {timeSlot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interview Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Interview Type</Label>
                <Select value={type} onValueChange={(value: any) => setType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Interview</SelectItem>
                    <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                    <SelectItem value="system-design">System Design Interview</SelectItem>
                    <SelectItem value="general">General Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex space-x-4 pt-6">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading || loadingInterviewers}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule Interview
                </>
              )}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
