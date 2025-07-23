import express from 'express';
import { dbAsync } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { sendTruckDispatchSMS } from '../services/smsService.js';

const router = express.Router();

/**
 * GET /api/trucks
 * Get all trucks
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, branch_id } = req.query;
    
    let query = `
      SELECT t.*, b.name as branch_name, b.location as branch_location,
             sr.id as assigned_request_id, sr.service_type as assigned_service_type,
             u.name as assigned_user_name
      FROM trucks t
      LEFT JOIN branches b ON t.branch_id = b.id
      LEFT JOIN service_requests sr ON t.assigned_request_id = sr.id
      LEFT JOIN users u ON sr.user_id = u.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    
    if (branch_id) {
      conditions.push('t.branch_id = ?');
      params.push(parseInt(branch_id));
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    const trucks = await dbAsync.all(query, params);

    res.json({
      success: true,
      data: trucks
    });

  } catch (error) {
    console.error('Get trucks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trucks'
    });
  }
});

/**
 * POST /api/trucks
 * Create a new truck (admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      license_plate,
      model,
      capacity,
      driver_name,
      driver_phone,
      branch_id,
      status = 'available'
    } = req.body;

    if (!name || !license_plate) {
      return res.status(400).json({
        success: false,
        message: 'Truck name and license plate are required'
      });
    }

    // Check if license plate already exists
    const existingTruck = await dbAsync.get(
      'SELECT id FROM trucks WHERE license_plate = ?',
      [license_plate.toUpperCase()]
    );

    if (existingTruck) {
      return res.status(409).json({
        success: false,
        message: 'A truck with this license plate already exists'
      });
    }

    const result = await dbAsync.run(`
      INSERT INTO trucks (
        name, license_plate, model, capacity, driver_name, driver_phone, 
        branch_id, status, current_lat, current_lng
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      license_plate.toUpperCase(),
      model || null,
      capacity || null,
      driver_name || null,
      driver_phone || null,
      branch_id || null,
      status,
      null, // current_lat
      null  // current_lng
    ]);

    const newTruck = await dbAsync.get(
      'SELECT * FROM trucks WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'Truck created successfully',
      data: newTruck
    });

  } catch (error) {
    console.error('Create truck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create truck'
    });
  }
});

/**
 * PUT /api/trucks/:id
 * Update truck details (admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      license_plate,
      model,
      capacity,
      driver_name,
      driver_phone,
      branch_id,
      status
    } = req.body;

    // Check if truck exists
    const truck = await dbAsync.get('SELECT * FROM trucks WHERE id = ?', [id]);
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }

    // Check if license plate conflicts with another truck
    if (license_plate && license_plate.toUpperCase() !== truck.license_plate) {
      const existingTruck = await dbAsync.get(
        'SELECT id FROM trucks WHERE license_plate = ? AND id != ?',
        [license_plate.toUpperCase(), id]
      );

      if (existingTruck) {
        return res.status(409).json({
          success: false,
          message: 'A truck with this license plate already exists'
        });
      }
    }

    await dbAsync.run(`
      UPDATE trucks 
      SET name = COALESCE(?, name),
          license_plate = COALESCE(?, license_plate),
          model = COALESCE(?, model),
          capacity = COALESCE(?, capacity),
          driver_name = COALESCE(?, driver_name),
          driver_phone = COALESCE(?, driver_phone),
          branch_id = COALESCE(?, branch_id),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, 
      license_plate ? license_plate.toUpperCase() : null,
      model,
      capacity,
      driver_name,
      driver_phone,
      branch_id,
      status,
      id
    ]);

    const updatedTruck = await dbAsync.get(
      'SELECT * FROM trucks WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Truck updated successfully',
      data: updatedTruck
    });

  } catch (error) {
    console.error('Update truck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update truck'
    });
  }
});

/**
 * POST /api/trucks/:id/dispatch
 * Dispatch truck to service request (admin only)
 */
router.post('/:id/dispatch', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { service_request_id, estimated_arrival } = req.body;

    if (!service_request_id) {
      return res.status(400).json({
        success: false,
        message: 'Service request ID is required'
      });
    }

    // Check if truck exists and is available
    const truck = await dbAsync.get(
      'SELECT * FROM trucks WHERE id = ? AND status = ?',
      [id, 'available']
    );

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found or not available'
      });
    }

    // Check if service request exists
    const serviceRequest = await dbAsync.get(
      'SELECT sr.*, u.name as user_name, u.phone as user_phone FROM service_requests sr LEFT JOIN users u ON sr.user_id = u.id WHERE sr.id = ?',
      [service_request_id]
    );

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Update truck status and assignment
    await dbAsync.run(`
      UPDATE trucks 
      SET status = 'dispatched', 
          assigned_request_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [service_request_id, id]);

    // Update service request status
    await dbAsync.run(`
      UPDATE service_requests 
      SET status = 'in_progress',
          estimated_completion = ?,
          admin_notes = COALESCE(admin_notes || '\n', '') || ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      estimated_arrival,
      `Truck ${truck.name} (${truck.license_plate}) dispatched by ${req.user.name}`,
      service_request_id
    ]);

    // Create notification for user
    await dbAsync.run(`
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (?, 'truck_dispatch', 'Truck Dispatched', ?, ?)
    `, [
      serviceRequest.user_id,
      `Truck ${truck.name} has been dispatched for your service request`,
      service_request_id
    ]);

    // Send SMS notification to user
    if (serviceRequest.user_phone) {
      try {
        await sendTruckDispatchSMS(
          { name: serviceRequest.user_name, phone: serviceRequest.user_phone },
          truck,
          serviceRequest
        );
      } catch (smsError) {
        console.warn('SMS notification failed:', smsError);
      }
    }

    const updatedTruck = await dbAsync.get(
      'SELECT * FROM trucks WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Truck dispatched successfully',
      data: updatedTruck
    });

  } catch (error) {
    console.error('Dispatch truck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispatch truck'
    });
  }
});

/**
 * POST /api/trucks/:id/complete
 * Mark truck assignment as complete (admin only)
 */
router.post('/:id/complete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { completion_notes } = req.body;

    const truck = await dbAsync.get(
      'SELECT * FROM trucks WHERE id = ? AND status = ?',
      [id, 'dispatched']
    );

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found or not currently dispatched'
      });
    }

    // Update truck status
    await dbAsync.run(`
      UPDATE trucks 
      SET status = 'available', 
          assigned_request_id = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    // Update service request status if assigned
    if (truck.assigned_request_id) {
      await dbAsync.run(`
        UPDATE service_requests 
        SET status = 'completed',
            admin_notes = COALESCE(admin_notes || '\n', '') || ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        completion_notes || `Service completed by truck ${truck.name} (${truck.license_plate})`,
        truck.assigned_request_id
      ]);

      // Create completion notification
      const serviceRequest = await dbAsync.get(
        'SELECT * FROM service_requests WHERE id = ?',
        [truck.assigned_request_id]
      );

      if (serviceRequest) {
        await dbAsync.run(`
          INSERT INTO notifications (user_id, type, title, message, related_id)
          VALUES (?, 'service_complete', 'Service Completed', ?, ?)
        `, [
          serviceRequest.user_id,
          `Your ${serviceRequest.service_type} service has been completed`,
          serviceRequest.id
        ]);
      }
    }

    const updatedTruck = await dbAsync.get(
      'SELECT * FROM trucks WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Service completed successfully',
      data: updatedTruck
    });

  } catch (error) {
    console.error('Complete truck assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete truck assignment'
    });
  }
});

/**
 * PUT /api/trucks/:id/location
 * Update truck GPS location
 */
router.put('/:id/location', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    await dbAsync.run(`
      UPDATE trucks 
      SET current_lat = ?, current_lng = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [latitude, longitude, id]);

    res.json({
      success: true,
      message: 'Truck location updated successfully'
    });

  } catch (error) {
    console.error('Update truck location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update truck location'
    });
  }
});

/**
 * DELETE /api/trucks/:id
 * Delete truck (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if truck is currently dispatched
    const truck = await dbAsync.get(
      'SELECT * FROM trucks WHERE id = ?',
      [id]
    );

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }

    if (truck.status === 'dispatched') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete truck that is currently dispatched'
      });
    }

    const result = await dbAsync.run(
      'DELETE FROM trucks WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Truck deleted successfully'
    });

  } catch (error) {
    console.error('Delete truck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete truck'
    });
  }
});

/**
 * GET /api/trucks/analytics
 * Get truck analytics (admin only)
 */
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const analytics = {
      total: 0,
      available: 0,
      dispatched: 0,
      maintenance: 0,
      offline: 0
    };

    const statusCounts = await dbAsync.all(`
      SELECT status, COUNT(*) as count
      FROM trucks
      GROUP BY status
    `);

    statusCounts.forEach(row => {
      analytics[row.status] = row.count;
      analytics.total += row.count;
    });

    // Get recent activity
    const recentActivity = await dbAsync.all(`
      SELECT t.name, t.license_plate, t.status, t.updated_at,
             sr.service_type, u.name as user_name
      FROM trucks t
      LEFT JOIN service_requests sr ON t.assigned_request_id = sr.id
      LEFT JOIN users u ON sr.user_id = u.id
      ORDER BY t.updated_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        analytics,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Get truck analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get truck analytics'
    });
  }
});

export default router;