import express from 'express';
import { dbAsync } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/messages
 * Get messages for user or admin
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { conversation_id, limit = 50 } = req.query;
    let query, params;

    if (req.user.is_admin) {
      if (conversation_id) {
        // Admin viewing specific conversation
        query = `
          SELECT m.*, 
                 sender.name as sender_name, sender.email as sender_email,
                 receiver.name as receiver_name, receiver.email as receiver_email
          FROM messages m
          LEFT JOIN users sender ON m.sender_id = sender.id
          LEFT JOIN users receiver ON m.receiver_id = receiver.id
          WHERE m.conversation_id = ?
          ORDER BY m.created_at ASC
          LIMIT ?
        `;
        params = [conversation_id, parseInt(limit)];
      } else {
        // Admin viewing all conversations
        query = `
          SELECT DISTINCT m.conversation_id,
                 MAX(m.created_at) as last_message_time,
                 COUNT(CASE WHEN m.is_read = 0 AND m.sender_id != ? THEN 1 END) as unread_count,
                 u.name as user_name, u.email as user_email,
                 (SELECT message FROM messages WHERE conversation_id = m.conversation_id ORDER BY created_at DESC LIMIT 1) as last_message
          FROM messages m
          LEFT JOIN users u ON u.id = (
            SELECT CASE WHEN m2.sender_id = ? THEN m2.receiver_id ELSE m2.sender_id END
            FROM messages m2 
            WHERE m2.conversation_id = m.conversation_id 
            LIMIT 1
          )
          GROUP BY m.conversation_id
          ORDER BY last_message_time DESC
          LIMIT ?
        `;
        params = [req.user.id, req.user.id, parseInt(limit)];
      }
    } else {
      // Regular user sees their conversation with admins
      const userConversationId = `user_${req.user.id}_admin`;
      query = `
        SELECT m.*, 
               sender.name as sender_name, sender.email as sender_email,
               receiver.name as receiver_name, receiver.email as receiver_email
        FROM messages m
        LEFT JOIN users sender ON m.sender_id = sender.id
        LEFT JOIN users receiver ON m.receiver_id = receiver.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
        LIMIT ?
      `;
      params = [userConversationId, parseInt(limit)];
    }

    const messages = await dbAsync.all(query, params);

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
});

/**
 * POST /api/messages
 * Send a new message
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message, receiver_id, conversation_id } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    let finalConversationId = conversation_id;
    let finalReceiverId = receiver_id;

    // For regular users, always send to admin
    if (!req.user.is_admin) {
      finalConversationId = `user_${req.user.id}_admin`;
      finalReceiverId = null; // Will be handled by admins
    } else {
      // Admin sending to specific user
      if (!conversation_id && !receiver_id) {
        return res.status(400).json({
          success: false,
          message: 'Conversation ID or receiver ID is required for admin messages'
        });
      }
    }

    // Insert message
    const result = await dbAsync.run(`
      INSERT INTO messages (conversation_id, sender_id, receiver_id, message, is_read)
      VALUES (?, ?, ?, ?, false)
    `, [
      finalConversationId,
      req.user.id,
      finalReceiverId,
      message.trim()
    ]);

    // Get the created message with sender info
    const newMessage = await dbAsync.get(`
      SELECT m.*, 
             sender.name as sender_name, sender.email as sender_email,
             receiver.name as receiver_name, receiver.email as receiver_email
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.id = ?
    `, [result.id]);

    // Create notifications for recipients
    if (req.user.is_admin && finalReceiverId) {
      // Admin to specific user
      await dbAsync.run(`
        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES (?, 'message', 'New Message', ?, ?)
      `, [
        finalReceiverId,
        `Message from ${req.user.name}`,
        newMessage.id
      ]);
    } else if (!req.user.is_admin) {
      // User to all admins
      await dbAsync.run(`
        INSERT INTO notifications (user_id, type, title, message, related_id)
        SELECT id, 'message', 'New Message', ?, ?
        FROM users WHERE is_admin = true
      `, [
        `Message from ${req.user.name}`,
        newMessage.id
      ]);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

/**
 * PUT /api/messages/:id/read
 * Mark message as read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await dbAsync.run(`
      UPDATE messages 
      SET is_read = true 
      WHERE id = ? AND (receiver_id = ? OR receiver_id IS NULL)
    `, [id, req.user.id]);

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read'
    });
  }
});

/**
 * PUT /api/messages/conversation/:conversation_id/read
 * Mark all messages in conversation as read
 */
router.put('/conversation/:conversation_id/read', authenticateToken, async (req, res) => {
  try {
    const { conversation_id } = req.params;

    await dbAsync.run(`
      UPDATE messages 
      SET is_read = true 
      WHERE conversation_id = ? AND sender_id != ?
    `, [conversation_id, req.user.id]);

    res.json({
      success: true,
      message: 'All messages marked as read'
    });

  } catch (error) {
    console.error('Mark conversation read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

/**
 * GET /api/messages/conversations
 * Get all conversations for admin
 */
router.get('/conversations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const conversations = await dbAsync.all(`
      SELECT DISTINCT m.conversation_id,
             MAX(m.created_at) as last_message_time,
             COUNT(CASE WHEN m.is_read = 0 AND m.sender_id != ? THEN 1 END) as unread_count,
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             (SELECT message FROM messages WHERE conversation_id = m.conversation_id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT name FROM users WHERE id = (SELECT sender_id FROM messages WHERE conversation_id = m.conversation_id ORDER BY created_at DESC LIMIT 1)) as last_sender_name
      FROM messages m
      LEFT JOIN users u ON u.id = CAST(SUBSTR(m.conversation_id, 6, INSTR(m.conversation_id, '_admin') - 6) AS INTEGER)
      WHERE m.conversation_id LIKE 'user_%_admin'
      GROUP BY m.conversation_id
      ORDER BY last_message_time DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: conversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
});

/**
 * DELETE /api/messages/:id
 * Delete message (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbAsync.run(
      'DELETE FROM messages WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

export default router;