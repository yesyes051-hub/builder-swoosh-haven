import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Calendar, 
  TrendingUp, 
  Target,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import DailyUpdateForm from '@/components/forms/DailyUpdateForm';
import DashboardLayout from '@/components/dashboards/DashboardLayout';
import { DailyUpdate, ApiResponse } from '@shared/api';

export default function DailyUpdates() {
  const { user, token } = useAuth();
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && token) {
      fetchUpdates();
    }
  }, [user, token]);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/daily-updates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data: ApiResponse<DailyUpdate[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch updates');
      }

      setUpdates(data.data || []);
    } catch (err) {
      console.error('Fetch updates error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load updates');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSuccess = (newUpdate: DailyUpdate) => {
    setUpdates([newUpdate, ...updates]);
    setShowForm(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTodaysUpdate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return updates.find(update => {
      const updateDate = new Date(update.date);
      updateDate.setHours(0, 0, 0, 0);
      return updateDate.getTime() === today.getTime();
    });
  };

  const todaysUpdate = getTodaysUpdate();

  if (!user) {
    return null;
  }

  if (showForm) {
    return (
      <DashboardLayout user={user}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Updates</span>
            </Button>
            <h1 className="text-2xl font-bold">Submit Daily Update</h1>
          </div>
          <DailyUpdateForm 
            onSuccess={handleUpdateSuccess}
            onCancel={() => setShowForm(false)}
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
            <h1 className="text-3xl font-bold text-gray-900">Daily Updates</h1>
            <p className="text-gray-600">Track your daily progress and accomplishments</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!!todaysUpdate}
          >
            <Plus className="h-4 w-4 mr-2" />
            {todaysUpdate ? "Today's Update Submitted" : "Submit Today's Update"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Today's Update Status */}
        <Card className={todaysUpdate ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {todaysUpdate ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {todaysUpdate ? "Today's Update Completed" : "Daily Update Pending"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {todaysUpdate 
                      ? `Submitted at ${formatTime(todaysUpdate.createdAt)} with score ${todaysUpdate.progressScore}/10`
                      : "Don't forget to submit your daily update to track your progress"
                    }
                  </p>
                </div>
              </div>
              {todaysUpdate && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Score: {todaysUpdate.progressScore}/10
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Updates List */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Update History</h2>
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Loading updates...</span>
              </CardContent>
            </Card>
          ) : updates.length > 0 ? (
            <div className="space-y-4">
              {updates.map((update) => (
                <Card key={update.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{formatDate(update.date)}</CardTitle>
                        <CardDescription>
                          Submitted at {formatTime(update.createdAt)}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={update.progressScore >= 8 ? 'default' : 
                                update.progressScore >= 6 ? 'secondary' : 'destructive'}
                      >
                        {update.progressScore}/10
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tasks */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium text-sm">Tasks</h4>
                        </div>
                        <ul className="space-y-1">
                          {update.tasks.map((task, index) => (
                            <li key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-blue-200">
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Accomplishments */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <h4 className="font-medium text-sm">Accomplishments</h4>
                        </div>
                        <ul className="space-y-1">
                          {update.accomplishments.map((accomplishment, index) => (
                            <li key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-green-200">
                              {accomplishment}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Challenges */}
                      {update.challenges.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <h4 className="font-medium text-sm">Challenges</h4>
                          </div>
                          <ul className="space-y-1">
                            {update.challenges.map((challenge, index) => (
                              <li key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-orange-200">
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Next Day Plans */}
                      {update.nextDayPlans.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <h4 className="font-medium text-sm">Next Day Plans</h4>
                          </div>
                          <ul className="space-y-1">
                            {update.nextDayPlans.map((plan, index) => (
                              <li key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-purple-200">
                                {plan}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Updates Yet</h3>
                <p className="text-gray-600 mb-4">
                  Start tracking your progress by submitting your first daily update
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Update
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
