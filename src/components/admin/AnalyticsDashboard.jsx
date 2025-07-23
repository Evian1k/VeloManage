import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  Users, 
  Truck, 
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import apiService from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

const AnalyticsDashboard = () => {
  const { user, backendAvailable } = useAuth();
  const [analytics, setAnalytics] = useState({
    dashboard: null,
    fleet: null,
    users: null,
    revenue: null
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [exportLoading, setExportLoading] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      if (backendAvailable) {
        const [dashboardRes, fleetRes, usersRes, revenueRes] = await Promise.all([
          apiService.getDashboardAnalytics(period),
          apiService.getFleetAnalytics(),
          apiService.getUserAnalytics(),
          apiService.getRevenueAnalytics()
        ]);

        setAnalytics({
          dashboard: dashboardRes.success ? dashboardRes.data : null,
          fleet: fleetRes.success ? fleetRes.data : null,
          users: usersRes.success ? usersRes.data : null,
          revenue: revenueRes.success ? revenueRes.data : null
        });
      } else {
        // Demo data
        setAnalytics({
          dashboard: {
            overall: {
              total_users: 150,
              total_trucks: 25,
              total_branches: 5,
              period_services: 89,
              pending_services: 12,
              active_services: 8,
              available_trucks: 15,
              dispatched_trucks: 7
            },
            servicesByStatus: [
              { status: 'completed', count: 45 },
              { status: 'pending', count: 12 },
              { status: 'in_progress', count: 8 },
              { status: 'cancelled', count: 3 }
            ],
            dailyServices: [
              { date: '2024-01-20', count: 12 },
              { date: '2024-01-21', count: 8 },
              { date: '2024-01-22', count: 15 },
              { date: '2024-01-23', count: 10 },
              { date: '2024-01-24', count: 18 }
            ],
            popularServices: [
              { service_type: 'Oil Change', count: 25 },
              { service_type: 'Tire Repair', count: 18 },
              { service_type: 'Engine Check', count: 15 },
              { service_type: 'Brake Service', count: 12 },
              { service_type: 'AC Repair', count: 8 }
            ],
            performance: {
              avgCompletionTime: 45,
              completionRate: 87.5,
              urgentRequests: 5
            }
          },
          fleet: {
            fleetOverview: {
              total_trucks: 25,
              available: 15,
              dispatched: 7,
              maintenance: 2,
              offline: 1
            },
            trucksByBranch: [
              { branch_name: 'Main Branch', truck_count: 10, available: 6, dispatched: 3 },
              { branch_name: 'North Branch', truck_count: 8, available: 5, dispatched: 2 },
              { branch_name: 'South Branch', truck_count: 7, available: 4, dispatched: 2 }
            ]
          },
          users: {
            engagement: {
              totalUsers: 150,
              activeWeekly: 89,
              activeMonthly: 134,
              avgRequestsPerUser: 2.3
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [backendAvailable, period]);

  const handleExport = async (type, format = 'json') => {
    setExportLoading(true);
    try {
      if (backendAvailable) {
        const response = await apiService.exportAnalytics(type, format);
        
        if (format === 'csv') {
          // Create blob and download for CSV
          const blob = new Blob([response], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          // Download JSON
          const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
            type: 'application/json' 
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        
        alert('Export completed successfully!');
      } else {
        alert('Export feature requires backend connection');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  const { dashboard, fleet, users } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-black/50 border-red-900/50 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-red-900/30">
              <SelectItem value="7" className="text-white">Last 7 days</SelectItem>
              <SelectItem value="30" className="text-white">Last 30 days</SelectItem>
              <SelectItem value="90" className="text-white">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={(value) => handleExport(value)}>
            <SelectTrigger className="w-40 bg-black/50 border-red-900/50 text-white">
              <SelectValue placeholder="Export Data" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-red-900/30">
              <SelectItem value="services" className="text-white">Export Services</SelectItem>
              <SelectItem value="users" className="text-white">Export Users</SelectItem>
              <SelectItem value="trucks" className="text-white">Export Trucks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      {dashboard?.overall && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={dashboard.overall.total_users}
            icon={Users}
            color="blue"
            subtitle={`${dashboard.overall.period_services} services this period`}
          />
          <StatCard
            title="Fleet Size"
            value={dashboard.overall.total_trucks}
            icon={Truck}
            color="green"
            subtitle={`${dashboard.overall.available_trucks} available`}
          />
          <StatCard
            title="Active Services"
            value={dashboard.overall.active_services}
            icon={Activity}
            color="orange"
            subtitle={`${dashboard.overall.pending_services} pending`}
          />
          <StatCard
            title="Branches"
            value={dashboard.overall.total_branches}
            icon={Building2}
            color="purple"
            subtitle="Operational locations"
          />
        </div>
      )}

      {/* Service Status Distribution */}
      {dashboard?.servicesByStatus && (
        <Card className="glass-effect border-red-900/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Service Request Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dashboard.servicesByStatus.map((item) => (
                <div key={item.status} className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{item.count}</div>
                  <div className="text-sm text-gray-400 capitalize">{item.status}</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                      style={{ 
                        width: `${(item.count / Math.max(...dashboard.servicesByStatus.map(s => s.count))) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fleet Analytics */}
      {fleet && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-effect border-red-900/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Fleet Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(fleet.fleetOverview).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-gray-300 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                    <Badge className={`${getTruckStatusColor(status)} text-white`}>
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-red-900/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Trucks by Branch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fleet.trucksByBranch?.map((branch) => (
                  <div key={branch.branch_name} className="bg-gray-800/50 p-3 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-white font-medium">{branch.branch_name}</h4>
                      <span className="text-gray-400">{branch.truck_count} trucks</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-400">
                        Available: {branch.available}
                      </span>
                      <span className="text-blue-400">
                        Dispatched: {branch.dispatched}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Popular Services */}
      {dashboard?.popularServices && (
        <Card className="glass-effect border-red-900/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Popular Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.popularServices.map((service, index) => (
                <div key={service.service_type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <span className="text-white">{service.service_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{service.count} requests</span>
                    <div className="w-20 bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 bg-red-500 rounded-full"
                        style={{ 
                          width: `${(service.count / dashboard.popularServices[0].count) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {dashboard?.performance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-effect border-red-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Completion Time</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboard.performance.avgCompletionTime}min
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-red-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboard.performance.completionRate}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-red-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Urgent Requests</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboard.performance.urgentRequests}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Engagement */}
      {users?.engagement && (
        <Card className="glass-effect border-red-900/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{users.engagement.totalUsers}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{users.engagement.activeWeekly}</div>
                <div className="text-sm text-gray-400">Weekly Active</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{users.engagement.activeMonthly}</div>
                <div className="text-sm text-gray-400">Monthly Active</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{users.engagement.avgRequestsPerUser}</div>
                <div className="text-sm text-gray-400">Avg Requests/User</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Utility Components
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    orange: 'text-orange-500',
    purple: 'text-purple-500',
    red: 'text-red-500'
  };

  return (
    <Card className="glass-effect border-red-900/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
        </div>
      </CardContent>
    </Card>
  );
};

// Utility functions
const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500'
  };
  return colors[status] || 'bg-gray-500';
};

const getTruckStatusColor = (status) => {
  const colors = {
    total_trucks: 'bg-gray-500',
    available: 'bg-green-500',
    dispatched: 'bg-blue-500',
    maintenance: 'bg-yellow-500',
    offline: 'bg-red-500'
  };
  return colors[status] || 'bg-gray-500';
};

export default AnalyticsDashboard;