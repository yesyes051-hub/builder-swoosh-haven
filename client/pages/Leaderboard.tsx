import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Target,
  Calendar,
  Users,
  Loader2,
  Crown,
  Star,
} from "lucide-react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import {
  LeaderboardResponse,
  LeaderboardEntry,
  ApiResponse,
} from "@shared/api";

export default function Leaderboard() {
  const { user, token } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null,
  );
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly">(
    "monthly",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && token) {
      fetchLeaderboard();
      if (user.role === "employee") {
        fetchUserRank();
      }
    }
  }, [user, token, period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: ApiResponse<LeaderboardResponse> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch leaderboard");
      }

      setLeaderboard(data.data || null);
    } catch (err) {
      console.error("Fetch leaderboard error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    try {
      const response = await fetch(`/api/leaderboard/rank?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: ApiResponse<LeaderboardEntry> = await response.json();

      if (response.ok && data.success) {
        setUserRank(data.data || null);
      }
    } catch (err) {
      console.error("Fetch user rank error:", err);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Trophy className="h-6 w-6 text-gray-600" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (rank === 2) return "bg-gray-100 text-gray-800 border-gray-200";
    if (rank === 3) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-blue-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
            <p className="text-gray-600">Track team performance and rankings</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={period === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("weekly")}
              className="flex-1 sm:flex-none"
            >
              Weekly
            </Button>
            <Button
              variant={period === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("monthly")}
              className="flex-1 sm:flex-none"
            >
              Monthly
            </Button>
            <Button
              variant={period === "quarterly" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("quarterly")}
              className="flex-1 sm:flex-none"
            >
              Quarterly
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* User Rank Card (for employees) */}
        {user.role === "employee" && userRank && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-blue-600" />
                <span>Your Performance</span>
              </CardTitle>
              <CardDescription>
                Your current ranking for the {period} period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getRankIcon(userRank.rank)}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    #{userRank.rank}
                  </div>
                  <p className="text-sm text-gray-600">Rank</p>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${getScoreColor(userRank.totalScore)}`}
                  >
                    {userRank.totalScore}
                  </div>
                  <p className="text-sm text-gray-600">Total Score</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {userRank.averageProgressScore}
                  </div>
                  <p className="text-sm text-gray-600">Avg Progress</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {userRank.updateConsistency}%
                  </div>
                  <p className="text-sm text-gray-600">Consistency</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <span>Performance Rankings</span>
            </CardTitle>
            <CardDescription>
              {period.charAt(0).toUpperCase() + period.slice(1)} performance
              leaderboard
              {leaderboard && (
                <span className="ml-2 text-xs text-gray-500">
                  (Updated: {new Date(leaderboard.generatedAt).toLocaleString()}
                  )
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Loading leaderboard...</span>
              </div>
            ) : leaderboard && leaderboard.entries.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.entries.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 rounded-lg border ${
                      entry.rank <= 3
                        ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200"
                        : "bg-gray-50 border-gray-200"
                    } ${entry.userId === user?.id ? "ring-2 ring-blue-500" : ""}`}
                  >
                    {/* Top row: Rank and User Info */}
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-10 sm:w-12">
                        {entry.rank <= 3 ? (
                          getRankIcon(entry.rank)
                        ) : (
                          <Badge
                            variant="outline"
                            className={getRankBadgeColor(entry.rank)}
                          >
                            #{entry.rank}
                          </Badge>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {entry.user.firstName} {entry.user.lastName}
                          {entry.userId === user?.id && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {entry.user.department}
                        </p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center min-w-0 sm:min-w-[200px]">
                      <div>
                        <div
                          className={`font-bold ${getScoreColor(entry.totalScore)}`}
                        >
                          {entry.totalScore}
                        </div>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      <div>
                        <div className="font-bold text-green-600">
                          {entry.averageProgressScore}
                        </div>
                        <p className="text-xs text-gray-500">Progress</p>
                      </div>
                      <div>
                        <div className="font-bold text-blue-600">
                          {entry.updateConsistency}%
                        </div>
                        <p className="text-xs text-gray-500">Consistency</p>
                      </div>
                      <div>
                        <div className="font-bold text-purple-600">
                          {entry.projectContributions}
                        </div>
                        <p className="text-xs text-gray-500">Projects</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Rankings Yet
                </h3>
                <p className="text-gray-600">
                  Performance data will appear here as team members submit
                  updates
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>How Rankings Work</span>
            </CardTitle>
            <CardDescription>
              Understanding the performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium mb-1">Progress Score</h3>
                <p className="text-sm text-gray-600">
                  40% weight - Daily progress ratings
                </p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium mb-1">Consistency</h3>
                <p className="text-sm text-gray-600">
                  30% weight - Regular update submissions
                </p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium mb-1">Interview Performance</h3>
                <p className="text-sm text-gray-600">
                  20% weight - Mock interview scores
                </p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-medium mb-1">Project Contributions</h3>
                <p className="text-sm text-gray-600">
                  10% weight - Active project involvement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
