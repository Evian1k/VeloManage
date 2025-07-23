import express from 'express';
import { dbAsync } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/analytics/dashboard
 * Get main dashboard analytics (admin only)
 */
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const periodCondition = `datetime(created_at) >= datetime('now', '-${period} days')`;

    // Overall statistics
    const overall = await dbAsync.get(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_admin = false) as total_users,
        (SELECT COUNT(*) FROM trucks) as total_trucks,
        (SELECT COUNT(*) FROM branches) as total_branches,
        (SELECT COUNT(*) FROM service_requests WHERE ${periodCondition}) as period_services,
        (SELECT COUNT(*) FROM service_requests WHERE status = 'pending') as pending_services,
        (SELECT COUNT(*) FROM service_requests WHERE status = 'in_progress') as active_services,
        (SELECT COUNT(*) FROM trucks WHERE status = 'available') as available_trucks,
        (SELECT COUNT(*) FROM trucks WHERE status = 'dispatched') as dispatched_trucks
    `);

    // Service requests by status
    const servicesByStatus = await dbAsync.all(`
      SELECT status, COUNT(*) as count
      FROM service_requests
      WHERE ${periodCondition}
      GROUP BY status
    `);

    // Daily service requests (last 7 days)
    const dailyServices = await dbAsync.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM service_requests
      WHERE datetime(created_at) >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Popular service types
    const popularServices = await dbAsync.all(`
      SELECT 
        service_type,
        COUNT(*) as count
      FROM service_requests
      WHERE ${periodCondition}
      GROUP BY service_type
      ORDER BY count DESC
      LIMIT 5
    `);

    // Truck utilization
    const truckUtilization = await dbAsync.all(`
      SELECT 
        status,
        COUNT(*) as count
      FROM trucks
      GROUP BY status
    `);

    // Recent activity
    const recentActivity = await dbAsync.all(`
      SELECT 
        'service' as type,
        sr.id,
        sr.service_type as title,
        u.name as user_name,
        sr.status,
        sr.created_at
      FROM service_requests sr
      LEFT JOIN users u ON sr.user_id = u.id
      WHERE datetime(sr.created_at) >= datetime('now', '-24 hours')
      
      UNION ALL
      
      SELECT 
        'truck' as type,
        t.id,
        'Truck ' || t.name as title,
        '' as user_name,
        t.status,
        t.updated_at as created_at
      FROM trucks t
      WHERE datetime(t.updated_at) >= datetime('now', '-24 hours')
      
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Performance metrics
    const performance = await dbAsync.get(`
      SELECT 
        AVG(
          CASE 
            WHEN status = 'completed' THEN 
              (julianday(updated_at) - julianday(created_at)) * 24 * 60
            ELSE NULL 
          END
        ) as avg_completion_time_minutes,
        
        ROUND(
          (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 2
        ) as completion_rate,
        
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_requests
        
      FROM service_requests
      WHERE ${periodCondition}
    `);

    res.json({
      success: true,
      data: {
        overall,
        servicesByStatus,
        dailyServices,
        popularServices,
        truckUtilization,
        recentActivity,
        performance: {
          avgCompletionTime: Math.round(performance.avg_completion_time_minutes || 0),
          completionRate: performance.completion_rate || 0,
          urgentRequests: performance.urgent_requests || 0
        }
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard analytics'
    });
  }
});

/**
 * GET /api/analytics/fleet
 * Get fleet analytics (admin only)
 */
router.get('/fleet', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Fleet overview
    const fleetOverview = await dbAsync.get(`
      SELECT 
        COUNT(*) as total_trucks,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'dispatched' THEN 1 END) as dispatched,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline
      FROM trucks
    `);

    // Trucks by branch
    const trucksByBranch = await dbAsync.all(`
      SELECT 
        COALESCE(b.name, 'Unassigned') as branch_name,
        COUNT(t.id) as truck_count,
        COUNT(CASE WHEN t.status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN t.status = 'dispatched' THEN 1 END) as dispatched
      FROM trucks t
      LEFT JOIN branches b ON t.branch_id = b.id
      GROUP BY b.name
      ORDER BY truck_count DESC
    `);

    // Most active trucks (last 30 days)
    const activeTrucks = await dbAsync.all(`
      SELECT 
        t.name,
        t.license_plate,
        COUNT(sr.id) as completed_services,
        AVG(
          CASE 
            WHEN sr.status = 'completed' THEN 
              (julianday(sr.updated_at) - julianday(sr.created_at)) * 24 * 60
            ELSE NULL 
          END
        ) as avg_service_time
      FROM trucks t
      LEFT JOIN service_requests sr ON t.id = (
        SELECT truck_id FROM audit_logs 
        WHERE action = 'truck_dispatch' 
        AND resource_id = sr.id 
        LIMIT 1
      )
      WHERE datetime(sr.created_at) >= datetime('now', '-30 days')
      GROUP BY t.id
      ORDER BY completed_services DESC
      LIMIT 10
    `);

    // Fleet utilization over time (last 7 days)
    const utilization = await dbAsync.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN action = 'truck_dispatch' THEN 1 END) as dispatches,
        COUNT(CASE WHEN action = 'truck_complete' THEN 1 END) as completions
      FROM audit_logs
      WHERE datetime(created_at) >= datetime('now', '-7 days')
      AND action IN ('truck_dispatch', 'truck_complete')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: {
        fleetOverview,
        trucksByBranch,
        activeTrucks,
        utilization
      }
    });

  } catch (error) {
    console.error('Fleet analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get fleet analytics'
    });
  }
});

/**
 * GET /api/analytics/users
 * Get user analytics (admin only)
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // User growth over time (last 30 days)
    const userGrowth = await dbAsync.all(`
      SELECT 
        DATE(join_date) as date,
        COUNT(*) as new_users
      FROM users
      WHERE datetime(join_date) >= datetime('now', '-30 days')
      AND is_admin = false
      GROUP BY DATE(join_date)
      ORDER BY date DESC
    `);

    // Most active users
    const activeUsers = await dbAsync.all(`
      SELECT 
        u.name,
        u.email,
        u.join_date,
        COUNT(sr.id) as total_requests,
        MAX(sr.created_at) as last_request,
        COUNT(CASE WHEN sr.status = 'completed' THEN 1 END) as completed_requests
      FROM users u
      LEFT JOIN service_requests sr ON u.id = sr.user_id
      WHERE u.is_admin = false
      GROUP BY u.id
      ORDER BY total_requests DESC
      LIMIT 10
    `);

    // User engagement metrics
    const engagement = await dbAsync.get(`
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN datetime(u.last_login) >= datetime('now', '-7 days') THEN u.id END) as active_weekly,
        COUNT(DISTINCT CASE WHEN datetime(u.last_login) >= datetime('now', '-30 days') THEN u.id END) as active_monthly,
        AVG(sr_count.request_count) as avg_requests_per_user
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as request_count
        FROM service_requests
        GROUP BY user_id
      ) sr_count ON u.id = sr_count.user_id
      WHERE u.is_admin = false
    `);

    res.json({
      success: true,
      data: {
        userGrowth,
        activeUsers,
        engagement: {
          totalUsers: engagement.total_users || 0,
          activeWeekly: engagement.active_weekly || 0,
          activeMonthly: engagement.active_monthly || 0,
          avgRequestsPerUser: Math.round((engagement.avg_requests_per_user || 0) * 10) / 10
        }
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user analytics'
    });
  }
});

/**
 * GET /api/analytics/revenue
 * Get revenue analytics (admin only) - placeholder for future implementation
 */
router.get('/revenue', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // This would be implemented when payment/pricing is added
    const mockRevenue = {
      totalRevenue: 0,
      monthlyRevenue: 0,
      revenueByService: [],
      projectedRevenue: 0
    };

    res.json({
      success: true,
      data: mockRevenue,
      note: 'Revenue tracking will be implemented with payment system'
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue analytics'
    });
  }
});

/**
 * GET /api/analytics/export
 * Export analytics data (admin only)
 */
router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type = 'services', format = 'json', start_date, end_date } = req.query;
    
    let dateCondition = '';
    const params = [];
    
    if (start_date && end_date) {
      dateCondition = 'WHERE datetime(created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    let data = [];
    
    switch (type) {
      case 'services':
        data = await dbAsync.all(`
          SELECT 
            sr.*,
            u.name as user_name,
            u.email as user_email,
            u.phone as user_phone
          FROM service_requests sr
          LEFT JOIN users u ON sr.user_id = u.id
          ${dateCondition}
          ORDER BY sr.created_at DESC
        `, params);
        break;
        
      case 'users':
        data = await dbAsync.all(`
          SELECT 
            id, name, email, phone, role, is_admin, 
            join_date, last_login
          FROM users
          WHERE is_admin = false
          ORDER BY join_date DESC
        `);
        break;
        
      case 'trucks':
        data = await dbAsync.all(`
          SELECT 
            t.*,
            b.name as branch_name
          FROM trucks t
          LEFT JOIN branches b ON t.branch_id = b.id
          ORDER BY t.created_at DESC
        `);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      // Convert to CSV format
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No data to export'
        });
      }
      
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => 
            JSON.stringify(row[header] || '')
          ).join(',')
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data,
        metadata: {
          type,
          exportDate: new Date().toISOString(),
          recordCount: data.length
        }
      });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data'
    });
  }
});

export default router;