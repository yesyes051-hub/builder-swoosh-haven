import React, { useState, useEffect } from 'react';
import { AdminDashboard as AdminDashboardType, ApiResponse, MockInterview, InterviewFeedback } from '@shared/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Clock,
  Eye,
  Filter,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from './DashboardLayout';
import AddUserModal from '@/components/pms/AddUserModal';
import UserManagementModal from '@/components/pms/UserManagementModal';
import ViewAllUsersModal from '@/components/pms/ViewAllUsersModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

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
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isViewAllUsersModalOpen, setIsViewAllUsersModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Interview management state
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInterview, setSelectedInterview] = useState<MockInterview | null>(null);
  const [interviewDetailModalOpen, setInterviewDetailModalOpen] = useState(false);
  const [selectedInterviewFeedback, setSelectedInterviewFeedback] = useState<InterviewFeedback[]>([]);

  const testServerConnectivity = async () => {
    try {
      console.log('🔗 Testing server connectivity...');
      const response = await fetch('/api/ping', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      console.log('📡 Ping response:', response.status, response.statusText);
      return response.ok;
    } catch (error) {
      console.error('❌ Server connectivity test failed:', error);
      return false;
    }
  };

  const fetchUserStats = async (retryCount = 0) => {
    if (!token) {
      console.warn('No token available for fetching user stats');
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);
      console.log(`Attempting to fetch user stats (attempt ${retryCount + 1})`);
      console.log('Token preview:', token.substring(0, 20) + '...');

      // Test connectivity first on initial attempt
      if (retryCount === 0) {
        const isConnected = await testServerConnectivity();
        if (!isConnected) {
          throw new Error('Server connectivity test failed');
        }
      }

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch('/api/user-stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Response received:', response.status, response.statusText);

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
        console.log('User stats fetched successfully:', result.data);
      } else {
        throw new Error(result.error || 'API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);

      // Provide more specific error information and retry logic
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Request timed out after 8 seconds');
        } else if (error.message.includes('Failed to fetch')) {
          console.error('Network error - server may be unreachable');

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
      if (retryCount === 0) {
        setStatsLoading(false);
      }
    }
  };

  const testAuth = async () => {
    if (!token) return false;

    try {
      console.log('🔐 Testing authentication...');
      const response = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('👤 Auth test response:', response.status);
      return response.ok;
    } catch (error) {
      console.error('❌ Auth test failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      if (token) {
        const authValid = await testAuth();
        if (authValid) {
          fetchUserStats();
        } else {
          console.error('❌ Authentication failed, cannot fetch user stats');
          setStatsLoading(false);
        }
      }
    };

    initializeData();
  }, [token, refreshTrigger]);

  const handleUserAdded = () => {
    // Trigger a refresh of user data
    setRefreshTrigger(prev => prev + 1);
  };
  return (
    <DashboardLayout user={data.user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            System Administration - {data.user.firstName} {data.user.lastName}
          </h1>
          <p className="text-red-100">
            Complete system oversight and control
          </p>
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
                ) : (userStats?.totalUsers ?? data.systemStats.totalUsers)}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered accounts {userStats === null ? '(using fallback data)' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsLoading ? '...' : (userStats?.activeUsers ?? data.systemStats.activeUsers)}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.systemStats.totalProjects}
              </div>
              <p className="text-xs text-muted-foreground">
                All projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {data.systemStats.pendingInterviews}
              </div>
              <p className="text-xs text-muted-foreground">
                Scheduled
              </p>
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
                  {statsLoading ? '...' : (userStats?.newUsersLast30Days ?? data.recentActivity.newUsers)}
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
                      {statsLoading ? '...' : (userStats?.roleBreakdown.hr ?? 1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Managers:</span>
                    <Badge variant="secondary">
                      {statsLoading ? '...' : (userStats?.roleBreakdown.manager ?? 1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Employees:</span>
                    <Badge variant="secondary">
                      {statsLoading ? '...' : (userStats?.roleBreakdown.employee ?? (data.systemStats.totalUsers - 3))}
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
                  <Badge variant="secondary">{data.systemStats.activeUsers} Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>System Configuration</span>
            </CardTitle>
            <CardDescription>
              Global system settings and configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <Shield className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <h3 className="font-medium mb-1">Security Settings</h3>
                <p className="text-sm text-gray-600">Authentication & permissions</p>
              </div>
              
              <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium mb-1">Data Management</h3>
                <p className="text-sm text-gray-600">Backup & maintenance</p>
              </div>
              
              <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium mb-1">Analytics Config</h3>
                <p className="text-sm text-gray-600">Reporting settings</p>
              </div>
              
              <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-medium mb-1">System Logs</h3>
                <p className="text-sm text-gray-600">Error monitoring</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
    </DashboardLayout>
  );
}
