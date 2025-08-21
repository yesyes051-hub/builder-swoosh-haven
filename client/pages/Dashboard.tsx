import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  EmployeeDashboard as EmployeeDashboardType,
  ManagerDashboard as ManagerDashboardType,
  HRDashboard as HRDashboardType,
  AdminDashboard as AdminDashboardType,
  ApiResponse
} from '@shared/api';
import EmployeeDashboard from '@/components/dashboards/EmployeeDashboard';
import ManagerDashboard from '@/components/dashboards/ManagerDashboard';
import HRDashboard from '@/components/dashboards/HRDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/fetch';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
    }
  }, [user, token]);

  const fetchDashboardData = useCallback(async () => {
    if (!user || !token) return;

    try {
      setLoading(true);
      setError(''); // Clear any previous errors

      // Determine the correct dashboard endpoint
      let dashboardType = user.role;

      // Special handling for admin functionality in HR role
      if (user.role === 'hr' && user.email === 'admin@trackzen.com') {
        dashboardType = 'admin';
      }

      const endpoint = `/api/dashboard/${dashboardType}`;

      const data: ApiResponse<any> = await apiRequest(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }

      setDashboardData(data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="flex items-center space-x-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div>
              <h3 className="font-semibold">Loading Dashboard</h3>
              <p className="text-sm text-gray-600">Fetching your data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-lg w-full">
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="font-semibold text-red-600 text-lg">Error Loading Dashboard</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{error}</p>

            {error.includes('Network error') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Network Issue:</strong> Please check your internet connection and try again.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <Button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case 'employee':
      return <EmployeeDashboard data={dashboardData as EmployeeDashboardType} />;
    case 'manager':
      return <ManagerDashboard data={dashboardData as ManagerDashboardType} />;
    case 'hr':
      // For users with admin-like permissions (HR role in new system), show admin dashboard
      if (user.email === 'admin@trackzen.com') {
        return <AdminDashboard data={dashboardData as AdminDashboardType} />;
      }
      return <HRDashboard data={dashboardData as HRDashboardType} />;
    case 'admin':
      return <AdminDashboard data={dashboardData as AdminDashboardType} />;
    case 'interviewer':
      // For now, show employee dashboard for interviewers
      return <EmployeeDashboard data={dashboardData as EmployeeDashboardType} />;
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="p-8">
            <CardContent className="text-center">
              <h3 className="font-semibold text-red-600">Unknown Role</h3>
              <p className="text-sm text-gray-600">Your account role is not recognized.</p>
            </CardContent>
          </Card>
        </div>
      );
  }
}
