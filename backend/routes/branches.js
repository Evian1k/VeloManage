import express from 'express';
import { dbAsync } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/branches
 * Get all branches
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const branches = await dbAsync.all(`
      SELECT b.*, 
             COUNT(t.id) as truck_count,
             COUNT(CASE WHEN t.status = 'available' THEN 1 END) as available_trucks,
             COUNT(CASE WHEN t.status = 'dispatched' THEN 1 END) as dispatched_trucks
      FROM branches b
      LEFT JOIN trucks t ON b.id = t.branch_id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);

    res.json({
      success: true,
      data: branches.map(branch => ({
        ...branch,
        contact_info: JSON.parse(branch.contact_info || '{}'),
        working_hours: JSON.parse(branch.working_hours || '{}'),
        staff_members: JSON.parse(branch.staff_members || '[]')
      }))
    });

  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get branches'
    });
  }
});

/**
 * POST /api/branches
 * Create a new branch (admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      location,
      address,
      contact_info,
      working_hours,
      staff_members,
      manager_name,
      capacity,
      services_offered
    } = req.body;

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Branch name and location are required'
      });
    }

    const result = await dbAsync.run(`
      INSERT INTO branches (
        name, location, address, contact_info, working_hours, 
        staff_members, manager_name, capacity, services_offered
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      location,
      address || null,
      JSON.stringify(contact_info || {}),
      JSON.stringify(working_hours || {}),
      JSON.stringify(staff_members || []),
      manager_name || null,
      capacity || null,
      JSON.stringify(services_offered || [])
    ]);

    const newBranch = await dbAsync.get(
      'SELECT * FROM branches WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: {
        ...newBranch,
        contact_info: JSON.parse(newBranch.contact_info || '{}'),
        working_hours: JSON.parse(newBranch.working_hours || '{}'),
        staff_members: JSON.parse(newBranch.staff_members || '[]'),
        services_offered: JSON.parse(newBranch.services_offered || '[]')
      }
    });

  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create branch'
    });
  }
});

/**
 * GET /api/branches/:id
 * Get single branch details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await dbAsync.get(
      'SELECT * FROM branches WHERE id = ?',
      [id]
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Get branch trucks
    const trucks = await dbAsync.all(`
      SELECT * FROM trucks WHERE branch_id = ?
      ORDER BY status, name
    `, [id]);

    res.json({
      success: true,
      data: {
        ...branch,
        contact_info: JSON.parse(branch.contact_info || '{}'),
        working_hours: JSON.parse(branch.working_hours || '{}'),
        staff_members: JSON.parse(branch.staff_members || '[]'),
        services_offered: JSON.parse(branch.services_offered || '[]'),
        trucks
      }
    });

  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get branch'
    });
  }
});

/**
 * PUT /api/branches/:id
 * Update branch details (admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      location,
      address,
      contact_info,
      working_hours,
      staff_members,
      manager_name,
      capacity,
      services_offered
    } = req.body;

    const branch = await dbAsync.get('SELECT * FROM branches WHERE id = ?', [id]);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    await dbAsync.run(`
      UPDATE branches 
      SET name = COALESCE(?, name),
          location = COALESCE(?, location),
          address = COALESCE(?, address),
          contact_info = COALESCE(?, contact_info),
          working_hours = COALESCE(?, working_hours),
          staff_members = COALESCE(?, staff_members),
          manager_name = COALESCE(?, manager_name),
          capacity = COALESCE(?, capacity),
          services_offered = COALESCE(?, services_offered),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      location,
      address,
      contact_info ? JSON.stringify(contact_info) : null,
      working_hours ? JSON.stringify(working_hours) : null,
      staff_members ? JSON.stringify(staff_members) : null,
      manager_name,
      capacity,
      services_offered ? JSON.stringify(services_offered) : null,
      id
    ]);

    const updatedBranch = await dbAsync.get(
      'SELECT * FROM branches WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Branch updated successfully',
      data: {
        ...updatedBranch,
        contact_info: JSON.parse(updatedBranch.contact_info || '{}'),
        working_hours: JSON.parse(updatedBranch.working_hours || '{}'),
        staff_members: JSON.parse(updatedBranch.staff_members || '[]'),
        services_offered: JSON.parse(updatedBranch.services_offered || '[]')
      }
    });

  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update branch'
    });
  }
});

/**
 * DELETE /api/branches/:id
 * Delete branch (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if branch has assigned trucks
    const trucksCount = await dbAsync.get(
      'SELECT COUNT(*) as count FROM trucks WHERE branch_id = ?',
      [id]
    );

    if (trucksCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete branch that has assigned trucks. Please reassign trucks first.'
      });
    }

    const result = await dbAsync.run(
      'DELETE FROM branches WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });

  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete branch'
    });
  }
});

/**
 * GET /api/branches/:id/analytics
 * Get branch analytics (admin only)
 */
router.get('/:id/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const analytics = await dbAsync.get(`
      SELECT 
        COUNT(t.id) as total_trucks,
        COUNT(CASE WHEN t.status = 'available' THEN 1 END) as available_trucks,
        COUNT(CASE WHEN t.status = 'dispatched' THEN 1 END) as dispatched_trucks,
        COUNT(CASE WHEN t.status = 'maintenance' THEN 1 END) as maintenance_trucks,
        COUNT(CASE WHEN t.status = 'offline' THEN 1 END) as offline_trucks
      FROM trucks t
      WHERE t.branch_id = ?
    `, [id]);

    // Get recent service requests for this branch
    const recentServices = await dbAsync.all(`
      SELECT sr.*, u.name as user_name, t.name as truck_name
      FROM service_requests sr
      LEFT JOIN users u ON sr.user_id = u.id
      LEFT JOIN trucks t ON t.assigned_request_id = sr.id
      WHERE t.branch_id = ?
      ORDER BY sr.created_at DESC
      LIMIT 10
    `, [id]);

    res.json({
      success: true,
      data: {
        analytics,
        recentServices
      }
    });

  } catch (error) {
    console.error('Get branch analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get branch analytics'
    });
  }
});

/**
 * POST /api/branches/:id/staff
 * Add staff member to branch (admin only)
 */
router.post('/:id/staff', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, email, shift } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Staff name and role are required'
      });
    }

    const branch = await dbAsync.get('SELECT * FROM branches WHERE id = ?', [id]);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const currentStaff = JSON.parse(branch.staff_members || '[]');
    const newStaffMember = {
      id: Date.now(),
      name,
      role,
      phone: phone || null,
      email: email || null,
      shift: shift || null,
      added_at: new Date().toISOString()
    };

    currentStaff.push(newStaffMember);

    await dbAsync.run(`
      UPDATE branches 
      SET staff_members = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [JSON.stringify(currentStaff), id]);

    res.json({
      success: true,
      message: 'Staff member added successfully',
      data: newStaffMember
    });

  } catch (error) {
    console.error('Add staff member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add staff member'
    });
  }
});

/**
 * DELETE /api/branches/:id/staff/:staff_id
 * Remove staff member from branch (admin only)
 */
router.delete('/:id/staff/:staff_id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, staff_id } = req.params;

    const branch = await dbAsync.get('SELECT * FROM branches WHERE id = ?', [id]);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const currentStaff = JSON.parse(branch.staff_members || '[]');
    const updatedStaff = currentStaff.filter(staff => staff.id != staff_id);

    if (currentStaff.length === updatedStaff.length) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    await dbAsync.run(`
      UPDATE branches 
      SET staff_members = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [JSON.stringify(updatedStaff), id]);

    res.json({
      success: true,
      message: 'Staff member removed successfully'
    });

  } catch (error) {
    console.error('Remove staff member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove staff member'
    });
  }
});

export default router;