import express from 'express';
import { dbAsync } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { sendServiceUpdateSMS } from '../services/smsService.js';

const router = express.Router();

/**
 * GET /api/services
 * Get all service requests (admin) or user's service requests
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query, params;

    if (req.user.is_admin) {
      // Admin sees all service requests
      query = `
        SELECT sr.*, u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM service_requests sr
        LEFT JOIN users u ON sr.user_id = u.id
        ORDER BY sr.created_at DESC
      `;
      params = [];
    } else {
      // User sees only their service requests
      query = `
        SELECT * FROM service_requests 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `;
      params = [req.user.id];
    }

    const services = await dbAsync.all(query, params);

    res.json({
      success: true,
      data: services.map(service => ({
        ...service,
        vehicle_info: JSON.parse(service.vehicle_info || '{}')
      }))
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service requests'
    });
  }
});

/**
 * POST /api/services
 * Create a new service request
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { service_type, vehicle_info, description, priority = 'normal' } = req.body;

    if (!service_type || !vehicle_info) {
      return res.status(400).json({
        success: false,
        message: 'Service type and vehicle info are required'
      });
    }

    const result = await dbAsync.run(`
      INSERT INTO service_requests (
        user_id, service_type, vehicle_info, description, priority, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `, [
      req.user.id,
      service_type,
      JSON.stringify(vehicle_info),
      description || '',
      priority
    ]);

    const newService = await dbAsync.get(
      'SELECT * FROM service_requests WHERE id = ?',
      [result.id]
    );

    // Create notification for admins
    await dbAsync.run(`
      INSERT INTO notifications (user_id, type, title, message, related_id)
      SELECT id, 'service_request', 'New Service Request', ?, ?
      FROM users WHERE is_admin = true
    `, [
      `New ${service_type} request from ${req.user.name}`,
      newService.id
    ]);

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      data: {
        ...newService,
        vehicle_info: JSON.parse(newService.vehicle_info)
      }
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service request'
    });
  }
});

/**
 * PUT /api/services/:id
 * Update service request status (admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, estimated_completion } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Get current service request
    const service = await dbAsync.get(
      'SELECT sr.*, u.name as user_name, u.phone as user_phone FROM service_requests sr LEFT JOIN users u ON sr.user_id = u.id WHERE sr.id = ?',
      [id]
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Update service request
    await dbAsync.run(`
      UPDATE service_requests 
      SET status = ?, admin_notes = ?, estimated_completion = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, admin_notes, estimated_completion, id]);

    // Create notification for user
    await dbAsync.run(`
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (?, 'service_update', 'Service Update', ?, ?)
    `, [
      service.user_id,
      `Your ${service.service_type} request is now ${status}`,
      id
    ]);

    // Send SMS notification to user
    if (service.user_phone) {
      try {
        await sendServiceUpdateSMS(
          { name: service.user_name, phone: service.user_phone },
          { id, status, admin_notes }
        );
      } catch (smsError) {
        console.warn('SMS notification failed:', smsError);
      }
    }

    const updatedService = await dbAsync.get(
      'SELECT * FROM service_requests WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Service request updated successfully',
      data: {
        ...updatedService,
        vehicle_info: JSON.parse(updatedService.vehicle_info)
      }
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service request'
    });
  }
});

/**
 * DELETE /api/services/:id
 * Delete service request (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbAsync.run(
      'DELETE FROM service_requests WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    res.json({
      success: true,
      message: 'Service request deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service request'
    });
  }
});

export default router;