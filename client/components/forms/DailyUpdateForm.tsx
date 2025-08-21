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
  Target, 
  CheckCircle,
  AlertTriangle,
  Calendar,
  Loader2
} from 'lucide-react';
import { CreateDailyUpdateRequest, ApiResponse, DailyUpdate } from '@shared/api';

interface Props {
  onSuccess?: (update: DailyUpdate) => void;
  onCancel?: () => void;
}

export default function DailyUpdateForm({ onSuccess, onCancel }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [tasks, setTasks] = useState<string[]>(['']);
  const [accomplishments, setAccomplishments] = useState<string[]>(['']);
  const [challenges, setChallenges] = useState<string[]>(['']);
  const [nextDayPlans, setNextDayPlans] = useState<string[]>(['']);
  const [progressScore, setProgressScore] = useState([7]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    const filteredTasks = tasks.filter(task => task.trim() !== '');
    const filteredAccomplishments = accomplishments.filter(acc => acc.trim() !== '');
    const filteredChallenges = challenges.filter(challenge => challenge.trim() !== '');
    const filteredNextDayPlans = nextDayPlans.filter(plan => plan.trim() !== '');

    if (filteredTasks.length === 0) {
      setError('Please add at least one task');
      return;
    }

    if (filteredAccomplishments.length === 0) {
      setError('Please add at least one accomplishment');
      return;
    }

    try {
      setLoading(true);

      const updateData: CreateDailyUpdateRequest = {
        tasks: filteredTasks,
        accomplishments: filteredAccomplishments,
        challenges: filteredChallenges,
        nextDayPlans: filteredNextDayPlans,
        progressScore: progressScore[0]
      };

      const response = await fetch('/api/daily-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data: ApiResponse<DailyUpdate> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit daily update');
      }

      setSuccess('Daily update submitted successfully!');
      
      // Reset form
      setTasks(['']);
      setAccomplishments(['']);
      setChallenges(['']);
      setNextDayPlans(['']);
      setProgressScore([7]);

      if (onSuccess && data.data) {
        onSuccess(data.data);
      }
    } catch (err) {
      console.error('Submit daily update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          <span>Daily Update</span>
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Share your progress, accomplishments, and plans for today
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Tasks */}
            <div className="space-y-4">
              {renderItemList(
                'Tasks',
                <Target className="h-4 w-4 text-blue-600" />,
                tasks,
                setTasks,
                'What are you working on today?'
              )}
            </div>

            {/* Accomplishments */}
            <div className="space-y-4">
              {renderItemList(
                'Accomplishments',
                <CheckCircle className="h-4 w-4 text-green-600" />,
                accomplishments,
                setAccomplishments,
                'What did you accomplish?'
              )}
            </div>

            {/* Challenges */}
            <div className="space-y-4">
              {renderItemList(
                'Challenges',
                <AlertTriangle className="h-4 w-4 text-orange-600" />,
                challenges,
                setChallenges,
                'What challenges are you facing?'
              )}
            </div>

            {/* Next Day Plans */}
            <div className="space-y-4">
              {renderItemList(
                'Tomorrow\'s Plans',
                <Calendar className="h-4 w-4 text-purple-600" />,
                nextDayPlans,
                setNextDayPlans,
                'What do you plan to work on tomorrow?'
              )}
            </div>
          </div>

          {/* Progress Score */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Progress Score: {progressScore[0]}/10
            </Label>
            <div className="space-y-2">
              <Slider
                value={progressScore}
                onValueChange={setProgressScore}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 - Poor Progress</span>
                <span>5 - Average Progress</span>
                <span>10 - Excellent Progress</span>
              </div>
            </div>
            <div className="flex justify-center">
              <Badge 
                variant={progressScore[0] >= 8 ? 'default' : 
                        progressScore[0] >= 6 ? 'secondary' : 'destructive'}
                className="text-sm"
              >
                {progressScore[0] >= 8 ? 'Excellent' : 
                 progressScore[0] >= 6 ? 'Good' : 
                 progressScore[0] >= 4 ? 'Average' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>

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
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Daily Update
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
