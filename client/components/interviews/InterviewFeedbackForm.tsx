import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { 
  Plus, 
  X, 
  MessageSquare, 
  Star,
  CheckCircle,
  AlertTriangle,
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { SubmitFeedbackRequest, ApiResponse, InterviewFeedback } from '@shared/api';

interface Props {
  interviewId: string;
  onSuccess?: (feedback: InterviewFeedback) => void;
  onCancel?: () => void;
}

export default function InterviewFeedbackForm({ interviewId, onSuccess, onCancel }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [overallRating, setOverallRating] = useState([7]);
  const [technicalSkills, setTechnicalSkills] = useState([7]);
  const [communication, setCommunication] = useState([7]);
  const [problemSolving, setProblemSolving] = useState([7]);
  const [strengths, setStrengths] = useState<string[]>(['']);
  const [areasForImprovement, setAreasForImprovement] = useState<string[]>(['']);
  const [detailedFeedback, setDetailedFeedback] = useState('');
  const [recommendations, setRecommendations] = useState('');

  const addItem = (
    items: string[], 
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setItems([...items, '']);
  };

  const removeItem = (
    index: number, 
    items: string[], 
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (
    index: number, 
    value: string, 
    items: string[], 
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const renderItemList = (
    title: string,
    icon: React.ReactNode,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string
  ) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center space-x-2">
        {icon}
        <span>{title}</span>
      </Label>
      {items.map((item, index) => (
        <div key={index} className="flex space-x-2">
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value, items, setItems)}
            placeholder={placeholder}
            className="flex-1"
          />
          {items.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeItem(index, items, setItems)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => addItem(items, setItems)}
        className="text-blue-600 hover:text-blue-700"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add {title.slice(0, -1)}
      </Button>
    </div>
  );

  const renderRatingSlider = (
    title: string,
    value: number[],
    setValue: React.Dispatch<React.SetStateAction<number[]>>,
    description: string
  ) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {title}: {value[0]}/10
      </Label>
      <div className="space-y-2">
        <Slider
          value={value}
          onValueChange={setValue}
          max={10}
          min={1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1 - Poor</span>
          <span>5 - Average</span>
          <span>10 - Excellent</span>
        </div>
      </div>
      <p className="text-xs text-gray-600">{description}</p>
      <div className="flex justify-center">
        <Badge 
          variant={value[0] >= 8 ? 'default' : 
                  value[0] >= 6 ? 'secondary' : 'destructive'}
          className="text-sm"
        >
          {value[0] >= 8 ? 'Excellent' : 
           value[0] >= 6 ? 'Good' : 
           value[0] >= 4 ? 'Average' : 'Needs Improvement'}
        </Badge>
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    const filteredStrengths = strengths.filter(strength => strength.trim() !== '');
    const filteredImprovements = areasForImprovement.filter(improvement => improvement.trim() !== '');

    if (filteredStrengths.length === 0) {
      setError('Please add at least one strength');
      return;
    }

    if (!detailedFeedback.trim()) {
      setError('Please provide detailed feedback');
      return;
    }

    try {
      setLoading(true);

      const feedbackData: SubmitFeedbackRequest = {
        interviewId,
        overallRating: overallRating[0],
        technicalSkills: technicalSkills[0],
        communication: communication[0],
        problemSolving: problemSolving[0],
        strengths: filteredStrengths,
        areasForImprovement: filteredImprovements,
        detailedFeedback: detailedFeedback.trim(),
        recommendations: recommendations.trim()
      };

      const response = await fetch('/api/interviews/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(feedbackData)
      });

      const data: ApiResponse<InterviewFeedback> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSuccess('Feedback submitted successfully!');

      if (onSuccess && data.data) {
        onSuccess(data.data);
      }
    } catch (err) {
      console.error('Submit feedback error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <span>Interview Feedback</span>
        </CardTitle>
        <CardDescription>
          Provide detailed feedback on the candidate's interview performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
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

          {/* Performance Ratings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Performance Ratings</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderRatingSlider(
                'Overall Rating',
                overallRating,
                setOverallRating,
                'Overall assessment of the candidate\'s interview performance'
              )}

              {renderRatingSlider(
                'Technical Skills',
                technicalSkills,
                setTechnicalSkills,
                'Knowledge and application of technical concepts'
              )}

              {renderRatingSlider(
                'Communication',
                communication,
                setCommunication,
                'Clarity of expression and ability to articulate thoughts'
              )}

              {renderRatingSlider(
                'Problem Solving',
                problemSolving,
                setProblemSolving,
                'Approach to solving problems and analytical thinking'
              )}
            </div>
          </div>

          {/* Qualitative Feedback */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Qualitative Assessment</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="space-y-4">
                {renderItemList(
                  'Strengths',
                  <TrendingUp className="h-4 w-4 text-green-600" />,
                  strengths,
                  setStrengths,
                  'What did the candidate do well?'
                )}
              </div>

              {/* Areas for Improvement */}
              <div className="space-y-4">
                {renderItemList(
                  'Areas for Improvement',
                  <TrendingDown className="h-4 w-4 text-orange-600" />,
                  areasForImprovement,
                  setAreasForImprovement,
                  'What areas need development?'
                )}
              </div>
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="space-y-4">
            <Label htmlFor="detailed-feedback" className="text-lg font-semibold">
              Detailed Feedback
            </Label>
            <Textarea
              id="detailed-feedback"
              value={detailedFeedback}
              onChange={(e) => setDetailedFeedback(e.target.value)}
              placeholder="Provide comprehensive feedback about the candidate's performance, specific examples, and observations during the interview..."
              className="min-h-32"
              required
            />
          </div>

          {/* Recommendations */}
          <div className="space-y-4">
            <Label htmlFor="recommendations" className="text-lg font-semibold">
              Recommendations (Optional)
            </Label>
            <Textarea
              id="recommendations"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Provide recommendations for the candidate's development, next steps, or hiring decision..."
              className="min-h-24"
            />
          </div>

          {/* Summary Card */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Feedback Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{overallRating[0]}/10</div>
                  <p className="text-sm text-gray-600">Overall</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{technicalSkills[0]}/10</div>
                  <p className="text-sm text-gray-600">Technical</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{communication[0]}/10</div>
                  <p className="text-sm text-gray-600">Communication</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{problemSolving[0]}/10</div>
                  <p className="text-sm text-gray-600">Problem Solving</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-6">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Feedback...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Feedback
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
