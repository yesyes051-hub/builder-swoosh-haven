import React, { useEffect, useState } from 'react';
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
import { Loader2 } from 'lucide-react';

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

  const fetchDashboardData = async () => {
    if (!user || !token) return;

    try {
      setLoading(true);
      const endpoint = `/api/dashboard/${user.role}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // For non-JSON error responses, get text or use status text
        let errorMessage = 'Failed to fetch dashboard data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data: ApiResponse<any> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }

      setDashboardData(data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <CardContent className="text-center">
            <h3 className="font-semibold text-red-600 mb-2">Error Loading Dashboard</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
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
