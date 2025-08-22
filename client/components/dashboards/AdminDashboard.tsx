import React, { useState, useEffect } from "react";
import { AdminDashboard as AdminDashboardType } from "@shared/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Activity,
  BarChart3,
  Settings,
  Shield,
  Database,
  TrendingUp,
  UserPlus,
  Calendar,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import AddUserModal from '@/components/pms/AddUserModal';
import UserManagementModal from '@/components/pms/UserManagementModal';
import ViewAllUsersModal from '@/components/pms/ViewAllUsersModal';
import PendingInterviewsModal from '@/components/interviews/PendingInterviewsModal';
import { useAuth } from '@/contexts/AuthContext';


interface Props {
  data: AdminDashboardType;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersLast30Days: number;
  roleBreakdown: {
    hr: number;
    manager: number;
    employee: number;
  };
}

export default function AdminDashboard({ data }: Props) {
  const { token } = useAuth();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] =
    useState(false);
  const [isViewAllUsersModalOpen, setIsViewAllUsersModalOpen] = useState(false);
  const [isPendingInterviewsModalOpen, setIsPendingInterviewsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchUserStats = async (retryCount = 0) => {
    if (!token) {
      console.warn("No token available for fetching user stats");
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);
      console.log(`Fetching user stats (attempt ${retryCount + 1})`);

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/user-stats", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(
        "✅ User stats response:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Keep the HTTP status message if JSON parsing fails
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setUserStats(result.data);
        console.log("✅ User stats fetched successfully:", result.data);
      } else {
        throw new Error(result.error || "API returned unsuccessful response");
      }
    } catch (error) {
      console.error("❌ Error fetching user stats:", error);

      // Provide more specific error information and retry logic
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.error("Request timed out after 10 seconds");
        } else if (error.message.includes("Failed to fetch")) {
          console.error("Network error - server may be unreachable");

          // Retry up to 2 times with exponential backoff
          if (retryCount < 2) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s delays
            console.log(`Retrying in ${delay}ms...`);
            setTimeout(() => fetchUserStats(retryCount + 1), delay);
            return;
          }
        }
      }

      // Fallback to showing the original dashboard data on error
      setUserStats(null);
    } finally {
      if (retryCount <= 2) {
        setStatsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserStats();
    } else {
      setStatsLoading(false);
    }
  }, [token, refreshTrigger]);

  const handleUserAdded = () => {
    // Trigger a refresh of user data
    setRefreshTrigger((prev) => prev + 1);
  };
  return (
    <DashboardLayout user={data.user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            System Administration - {data.user.firstName} {data.user.lastName}
          </h1>
          <p className="text-red-100">Complete system oversight and control</p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 dynamic-content">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statsLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  (userStats?.totalUsers ?? data.systemStats.totalUsers)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered accounts{" "}
                {userStats === null ? "(using fallback data)" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsLoading
                  ? "..."
                  : (userStats?.activeUsers ?? data.systemStats.activeUsers)}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.systemStats.totalProjects}
              </div>
              <p className="text-xs text-muted-foreground">All projects</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
            onClick={() => setIsPendingInterviewsModalOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Interviews
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {data.systemStats.pendingInterviews}
              </div>
<<<<<<< HEAD
              <p className="text-xs text-muted-foreground">
                Click to view details
              </p>
=======
              <p className="text-xs text-muted-foreground">Scheduled</p>
>>>>>>> refs/remotes/origin/main
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Recent System Activity</span>
            </CardTitle>
            <CardDescription>
              Activity summary for the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 dynamic-content">
              <div className="text-center p-4 border rounded-lg">
                <UserPlus className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">
                  {statsLoading
                    ? "..."
                    : (userStats?.newUsersLast30Days ??
                      data.recentActivity.newUsers)}
                </div>
                <p className="text-sm text-gray-600">New Users (30 days)</p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-600">
                  {data.recentActivity.newUpdates}
                </div>
                <p className="text-sm text-gray-600">Daily Updates</p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">
                  {data.recentActivity.completedInterviews}
                </div>
                <p className="text-sm text-gray-600">Completed Interviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Administrative Actions</span>
            </CardTitle>
            <CardDescription>
              System management and configuration tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => setIsUserManagementModalOpen(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
              <Button variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Database Admin
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Management Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="border rounded-lg p-3 text-center hover:bg-gray-50 cursor-pointer"
                    onClick={() => setIsAddUserModalOpen(true)}
                  >
                    <UserPlus className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">Add User</p>
                  </div>
                  <div
                    className="border rounded-lg p-3 text-center hover:bg-gray-50 cursor-pointer"
                    onClick={() => setIsViewAllUsersModalOpen(true)}
                  >
                    <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">View All Users</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">HR Users:</span>
                    <Badge variant="secondary">
                      {statsLoading
                        ? "..."
                        : (userStats?.roleBreakdown.hr ?? 1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Managers:</span>
                    <Badge variant="secondary">
                      {statsLoading
                        ? "..."
                        : (userStats?.roleBreakdown.manager ?? 1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Employees:</span>
                    <Badge variant="secondary">
                      {statsLoading
                        ? "..."
                        : (userStats?.roleBreakdown.employee ??
                          data.systemStats.totalUsers - 3)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>System Health</span>
              </CardTitle>
              <CardDescription>
                Monitor system performance and issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Database Connection</span>
                  </div>
                  <Badge variant="secondary">Healthy</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">API Performance</span>
                  </div>
                  <Badge variant="secondary">Good</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Storage Usage</span>
                  </div>
                  <Badge variant="outline">68%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">User Sessions</span>
                  </div>
                  <Badge variant="secondary">
                    {data.systemStats.activeUsers} Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        onUserChanged={handleUserAdded}
      />

      <ViewAllUsersModal
        isOpen={isViewAllUsersModalOpen}
        onClose={() => setIsViewAllUsersModalOpen(false)}
      />

      <PendingInterviewsModal
        isOpen={isPendingInterviewsModalOpen}
        onClose={() => setIsPendingInterviewsModalOpen(false)}
      />
    </DashboardLayout>
  );
}
