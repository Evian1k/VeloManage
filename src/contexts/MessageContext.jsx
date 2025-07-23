import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { messageStorage, userStorage } from '@/utils/storage';
import apiService from '@/utils/api';

const MessageContext = createContext();

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

// Get all conversations from storage
const getAllConversations = () => {
  return messageStorage.getAllMessages();
};

// Get users who have sent messages
const getUsersWithMessages = () => {
  return messageStorage.getMessageUsers();
};

// Save user info when they send their first message
const saveUserInfo = (user) => {
  messageStorage.saveMessageUser(user.id, {
    name: user.name,
    email: user.email
  });
};


export const MessageProvider = ({ children }) => {
  const { user, backendAvailable } = useAuth();
  const [conversations, setConversations] = useState({});
  const [usersWithMessages, setUsersWithMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMessages = async () => {
    if (!user) {
      setConversations({});
      setUsersWithMessages([]);
      return;
    }

    setLoading(true);
    try {
      // Always use localStorage for consistent messaging
      console.log('📱 Loading messages from localStorage (reliable mode)...');
        // Fallback to localStorage
        if (user.isAdmin || user.is_admin) {
          const allConvos = getAllConversations();
          setConversations(allConvos);
          
          const messageUsers = getUsersWithMessages();
          setUsersWithMessages(Object.values(messageUsers));
        } else {
          const savedMessages = messageStorage.getUserMessages(user.id);
          setConversations({ [user.id]: savedMessages });
        }
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      // Fallback to localStorage on error
      try {
        if (user.isAdmin || user.is_admin) {
          const allConvos = getAllConversations();
          setConversations(allConvos);
          const messageUsers = getUsersWithMessages();
          setUsersWithMessages(Object.values(messageUsers));
        } else {
          const savedMessages = messageStorage.getUserMessages(user.id);
          setConversations({ [user.id]: savedMessages });
        }
      } catch (fallbackError) {
        console.error('❌ Fallback loading failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [user, backendAvailable]);

  const sendMessage = async (text) => {
    if (!user || !text?.trim()) {
      console.log('❌ SendMessage failed - user or text missing:', { user: !!user, text: !!text?.trim() });
      return;
    }
    
          console.log('📤 Sending message:', { text, user: user.name, isAdmin: user?.isAdmin || user?.is_admin });
    
          try {
                // Always use localStorage for reliability
        console.log('📱 Sending message via localStorage (reliable mode)...');
      
      // Save user info when they send their first message
      saveUserInfo(user);
      
      const newMessage = {
        id: Date.now(),
        sender: 'user',
        text,
        timestamp: new Date().toISOString()
      };
      
      console.log('📝 Creating new message:', newMessage);
      
      const userMessages = conversations[user.id] || [];
      const updatedMessages = [...userMessages, newMessage];
      
      console.log('💾 Updating messages:', { 
        userId: user.id, 
        previousCount: userMessages.length, 
        newCount: updatedMessages.length 
      });
      
      // Update state immediately
      setConversations(prev => {
        const updated = { ...prev, [user.id]: updatedMessages };
        console.log('🔄 State updated:', updated);
        return updated;
      });
      messageStorage.saveUserMessages(user.id, updatedMessages);

      // Force refresh of admin's user list if this is a new user
      if (userMessages.length === 0) {
        window.dispatchEvent(new CustomEvent('newUserMessage', { detail: { userId: user.id } }));
      }

      // Trigger notification for admins
      window.dispatchEvent(new CustomEvent('newMessage', { 
        detail: { 
          senderId: user.id, 
          message: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          type: 'message'
        } 
      }));
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }

    // Send auto-reply only for the first message or if no admin has replied yet
    const hasAdminReplied = userMessages.some(msg => msg.sender === 'admin' && !msg.isAutoReply);
    
    if (!hasAdminReplied) {
      setTimeout(() => {
        const reply = {
          id: Date.now() + 1,
          sender: 'admin',
          text: "Thanks for your message! An admin will review it shortly and get back to you.",
          timestamp: new Date().toISOString(),
          isAutoReply: true
        };
        
        const messagesWithReply = [...updatedMessages, reply];
        setConversations(prev => ({ ...prev, [user.id]: messagesWithReply }));
        messageStorage.saveUserMessages(user.id, messagesWithReply);
      }, 1000);
    }
  };

  const sendMessageToUser = async (userId, text, conversationId = null) => {
    if (!user || (!user.isAdmin && !user.is_admin)) return;

    try {
      if (backendAvailable) {
        console.log('📡 Admin sending message via backend...');
        const response = await apiService.sendMessage(text, userId, conversationId);
        if (response.success) {
          console.log('✅ Admin message sent via backend');
          // Reload messages to get the latest
          await loadMessages();
          return;
        }
      }
      
      console.log('📱 Admin sending message via localStorage...');
      // Fallback to localStorage
      const newMessage = {
        id: Date.now(),
        sender: 'admin',
        text,
        timestamp: new Date().toISOString(),
        isAutoReply: false
      };

      const userMessages = conversations[userId] || [];
      const updatedMessages = [...userMessages, newMessage];
      
      // Update state immediately
      setConversations(prev => ({ ...prev, [userId]: updatedMessages }));
      messageStorage.saveUserMessages(userId, updatedMessages);

      // Trigger notification for the user
      window.dispatchEvent(new CustomEvent('newMessage', { 
        detail: { 
          senderId: user.id, 
          message: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          type: 'message'
        } 
      }));
    } catch (error) {
      console.error('❌ Failed to send admin message:', error);
      throw error;
    }
  };

  // Function to refresh users list for admin
  const refreshUsersWithMessages = () => {
    if (user?.isAdmin) {
      const messageUsers = getUsersWithMessages();
      setUsersWithMessages(Object.values(messageUsers));
    }
  };

  const isAdmin = user?.isAdmin || user?.is_admin || user?.role?.includes('Admin');
  
  const value = {
    messages: user && !isAdmin ? conversations[user.id] || [] : [],
    conversations,
    usersWithMessages,
    sendMessage,
    sendMessageToUser,
    refreshUsersWithMessages: loadMessages,
    loading,
    backendAvailable
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};