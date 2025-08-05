import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar, 
  Star,
  Award,
  CheckCircle,
  Users,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Clock,
  Crown
} from 'lucide-react';
import DashboardLayout from '@/components/dashboards/DashboardLayout';
import { ApiResponse } from '@shared/api';

interface PerformanceMetrics {
  totalUpdates: number;
  averageProgressScore: number;
  updateConsistency: number;
  currentStreak: number;
  longestStreak: number;
  completedInterviews: number;
  averageInterviewScore: number;
  monthlyProgress: {
    month: string;
    updates: number;
    avgScore: number;
  }[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  achievedAt: Date;
  type: 'streak' | 'score' | 'consistency' | 'interview';
}

interface PerformanceData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
  metrics: PerformanceMetrics;
  recentUpdates: any[];
  recentInterviews: any[];
  goals: {
    dailyUpdateTarget: number;
    progressScoreTarget: number;
    interviewScoreTarget: number;
  };
  achievements: Achievement[];
}

interface TeamMember {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
  recentUpdates: number;
  averageScore: number;
  completedInterviews: number;
  lastUpdateDate: Date | null;
}

export default function PMS() {
  const { user, token } = useAuth();
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && token) {
      fetchPerformanceData();
      if (user.role === 'manager' || user.role === 'hr') {
        fetchTeamData();
      }
    }
  }, [user, token]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pms/performance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data: ApiResponse<PerformanceData> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch performance data');
      }

      setPerformanceData(data.data || null);
    } catch (err) {
      console.error('Fetch performance data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async () => {
    try {
      setTeamLoading(true);
      const response = await fetch('/api/pms/team-overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data: ApiResponse<TeamMember[]> = await response.json();

      if (response.ok && data.success) {
        setTeamData(data.data || []);
      }
    } catch (err) {
      console.error('Fetch team data error:', err);
    } finally {
      setTeamLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'streak': return <Target className="h-5 w-5 text-blue-600" />;
      case 'score': return <Star className="h-5 w-5 text-yellow-600" />;
      case 'consistency': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'interview': return <MessageSquare className="h-5 w-5 text-purple-600" />;
      default: return <Award className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user || user.role === 'admin') {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <Card className="p-8">
            <CardContent className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-gray-600">
                {!user ? 'Please log in to access PMS.' : 'PMS is not available for administrators.'}
              </p>
            </CardContent>
          </Card>
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
            <h1 className="text-3xl font-bold text-gray-900">Performance Management System</h1>
            <p className="text-gray-600">Comprehensive view of your performance and growth</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-2 text-sm">
            PMS Dashboard
          </Badge>
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
              <span className="ml-2">Loading performance data...</span>
            </CardContent>
          </Card>
        ) : performanceData ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              {(user.role === 'manager' || user.role === 'hr') && (
                <TabsTrigger value="team">Team Overview</TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {performanceData.metrics.totalUpdates}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Daily progress submissions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Progress Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getScoreColor(performanceData.metrics.averageProgressScore)}`}>
                      {performanceData.metrics.averageProgressScore}/10
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Overall performance rating
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
                      {performanceData.metrics.currentStreak}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Consecutive days • Best: {performanceData.metrics.longestStreak}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Consistency</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {performanceData.metrics.updateConsistency}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last 30 days frequency
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Goals Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Goals Progress</span>
                  </CardTitle>
                  <CardDescription>Track your progress towards monthly targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {/* Daily Updates Goal */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Monthly Updates</span>
                        <span className="text-sm text-gray-600">
                          {Math.min(performanceData.metrics.totalUpdates, performanceData.goals.dailyUpdateTarget)} / {performanceData.goals.dailyUpdateTarget}
                        </span>
                      </div>
                      <Progress 
                        value={(performanceData.metrics.totalUpdates / performanceData.goals.dailyUpdateTarget) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Progress Score Goal */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Average Progress Score</span>
                        <span className="text-sm text-gray-600">
                          {performanceData.metrics.averageProgressScore} / {performanceData.goals.progressScoreTarget}
                        </span>
                      </div>
                      <Progress 
                        value={(performanceData.metrics.averageProgressScore / performanceData.goals.progressScoreTarget) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Interview Score Goal */}
                    {performanceData.metrics.completedInterviews > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Interview Performance</span>
                          <span className="text-sm text-gray-600">
                            {performanceData.metrics.averageInterviewScore} / {performanceData.goals.interviewScoreTarget}
                          </span>
                        </div>
                        <Progress 
                          value={(performanceData.metrics.averageInterviewScore / performanceData.goals.interviewScoreTarget) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Updates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Recent Updates</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performanceData.recentUpdates.length > 0 ? (
                      <div className="space-y-3">
                        {performanceData.recentUpdates.slice(0, 5).map((update: any) => (
                          <div key={update.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{formatDate(update.date)}</p>
                              <p className="text-sm text-gray-600">
                                {update.tasks.length} tasks • {update.accomplishments.length} accomplishments
                              </p>
                            </div>
                            <Badge variant="outline">
                              {update.progressScore}/10
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No updates yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Interviews */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Interview History</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performanceData.recentInterviews.length > 0 ? (
                      <div className="space-y-3">
                        {performanceData.recentInterviews.map((interview: any) => (
                          <div key={interview.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{interview.type} Interview</p>
                              <p className="text-sm text-gray-600">
                                with {interview.interviewer?.firstName} {interview.interviewer?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(interview.scheduledAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{interview.status}</Badge>
                              {interview.feedback && (
                                <p className="text-sm font-medium text-blue-600 mt-1">
                                  Score: {interview.feedback.overallRating}/10
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No interviews yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Progress Tracking Tab */}
            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Monthly Progress Trend</span>
                  </CardTitle>
                  <CardDescription>Your performance over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceData.metrics.monthlyProgress.length > 0 ? (
                    <div className="space-y-4">
                      {performanceData.metrics.monthlyProgress.map((month) => (
                        <div key={month.month} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="w-20 text-sm font-medium">
                            {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">Updates: {month.updates}</span>
                              <span className={`text-sm font-medium ${getScoreColor(month.avgScore)}`}>
                                Avg Score: {month.avgScore}/10
                              </span>
                            </div>
                            <Progress value={(month.avgScore / 10) * 100} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No historical data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span>Your Achievements</span>
                  </CardTitle>
                  <CardDescription>Celebrate your accomplishments and milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceData.achievements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {performanceData.achievements.map((achievement) => (
                        <div key={achievement.id} className="flex items-center space-x-4 p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                          <div className="bg-white p-2 rounded-lg">
                            {getAchievementIcon(achievement.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(achievement.achievedAt)}
                            </p>
                          </div>
                          <Crown className="h-5 w-5 text-yellow-600" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No achievements yet</p>
                      <p className="text-sm">Keep working to unlock your first achievement!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Overview Tab (Manager/HR only) */}
            {(user.role === 'manager' || user.role === 'hr') && (
              <TabsContent value="team" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Team Performance Overview</span>
                    </CardTitle>
                    <CardDescription>Monitor your team's performance and engagement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teamLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2">Loading team data...</span>
                      </div>
                    ) : teamData.length > 0 ? (
                      <div className="space-y-4">
                        {teamData.map((member) => (
                          <div key={member.user.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h3 className="font-semibold">
                                {member.user.firstName} {member.user.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">{member.user.department}</p>
                              <p className="text-xs text-gray-500">
                                Last update: {member.lastUpdateDate ? formatDate(member.lastUpdateDate) : 'Never'}
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-lg font-bold text-blue-600">{member.recentUpdates}</div>
                                <p className="text-xs text-gray-500">Updates</p>
                              </div>
                              <div>
                                <div className={`text-lg font-bold ${getScoreColor(member.averageScore)}`}>
                                  {member.averageScore}
                                </div>
                                <p className="text-xs text-gray-500">Avg Score</p>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-purple-600">{member.completedInterviews}</div>
                                <p className="text-xs text-gray-500">Interviews</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No team members found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No performance data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
