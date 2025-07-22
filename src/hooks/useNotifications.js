import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  // Load notifications from localStorage
  useEffect(() => {
    if (user) {
      const savedNotifications = localStorage.getItem(`autocare_notifications_${user.id}`);
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      }
    }
  }, [user]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (event) => {
      if (user) {
        const { senderId, message, type = 'message' } = event.detail || {};
        
        addNotification({
          type,
          title: type === 'message' ? 'New Message' : 'New Notification',
          message: message || 'You have a new message',
          senderId,
          timestamp: new Date().toISOString()
        });
      }
    };

    const handleServiceUpdate = (event) => {
      if (user) {
        const { requestId, status, type = 'service' } = event.detail || {};
        
        addNotification({
          type,
          title: 'Service Update',
          message: `Your service request #${requestId} is now ${status}`,
          requestId,
          timestamp: new Date().toISOString()
        });
      }
    };

    window.addEventListener('newMessage', handleNewMessage);
    window.addEventListener('serviceUpdate', handleServiceUpdate);
    
    return () => {
      window.removeEventListener('newMessage', handleNewMessage);
      window.removeEventListener('serviceUpdate', handleServiceUpdate);
    };
  }, [user]);

  // Check for new messages periodically
  useEffect(() => {
    if (!user) return;

    const checkMessages = () => {
      const messages = JSON.parse(localStorage.getItem(`autocare_messages_${user.id}`) || '[]');
      const lastCheck = localStorage.getItem(`autocare_last_message_check_${user.id}`);
      const lastCheckTime = lastCheck ? new Date(lastCheck) : new Date(0);
      
      const newMessages = messages.filter(msg => 
        new Date(msg.timestamp) > lastCheckTime && msg.sender !== (user.isAdmin ? 'admin' : 'user')
      );

      if (newMessages.length > 0) {
        newMessages.forEach(msg => {
          // Trigger notification sound/visual
          showNotificationBriefly();
          
          // Add to notifications
          addNotification({
            type: 'message',
            title: 'New Message',
            message: msg.text.substring(0, 50) + (msg.text.length > 50 ? '...' : ''),
            senderId: msg.sender,
            timestamp: msg.timestamp
          });
        });
        
        localStorage.setItem(`autocare_last_message_check_${user.id}`, new Date().toISOString());
      }
    };

    // Check immediately and then every 5 seconds
    checkMessages();
    const interval = setInterval(checkMessages, 5000);
    
    return () => clearInterval(interval);
  }, [user]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      read: false,
      ...notification
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50); // Keep last 50
      localStorage.setItem(`autocare_notifications_${user?.id}`, JSON.stringify(updated));
      return updated;
    });

    setUnreadCount(prev => prev + 1);
    showNotificationBriefly();
  }, [user]);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem(`autocare_notifications_${user?.id}`, JSON.stringify(updated));
      return updated;
    });

    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [user]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem(`autocare_notifications_${user?.id}`, JSON.stringify(updated));
      return updated;
    });

    setUnreadCount(0);
  }, [user]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(`autocare_notifications_${user?.id}`);
  }, [user]);

  const showNotificationBriefly = useCallback(() => {
    setShowNotification(true);
    
    // Play notification sound (if enabled)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBy+R1O/PfC4EJnzE7+OZRA0Oj+bkrmIcBDuR1O3/fC0FJHnE7+GYRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBC+R1O3/fC0FJHnE7+GYRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0Pb+XSrF4eBDmR0+3/fyUIJHfC7eSJRA0P');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio fails
    } catch (e) {
      // Audio not supported or blocked
    }

    setTimeout(() => setShowNotification(false), 3000);
  }, []);

  return {
    notifications,
    unreadCount,
    showNotification,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
};