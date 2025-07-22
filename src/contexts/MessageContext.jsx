import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { messageStorage, userStorage } from '@/utils/storage';

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
    id: user.id,
    name: user.name,
    email: user.email
  });
};


export const MessageProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState({});
  const [usersWithMessages, setUsersWithMessages] = useState([]);

  useEffect(() => {
    if (user?.isAdmin) {
      // Load all conversations for admin
      const allConvos = getAllConversations();
      setConversations(allConvos);
      
      // Load users who have sent messages
      const messageUsers = getUsersWithMessages();
      setUsersWithMessages(Object.values(messageUsers));
    } else if (user) {
      // Load user's own messages
      const savedMessages = messageStorage.getUserMessages(user.id);
      setConversations({ [user.id]: savedMessages });
    } else {
      setConversations({});
      setUsersWithMessages([]);
    }
  }, [user]);

  const sendMessage = (text) => {
    if (!user || user.isAdmin) return;
    
    // Save user info for admin to see
    saveUserInfo(user);
    
    const newMessage = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    
    const userMessages = conversations[user.id] || [];
    const updatedMessages = [...userMessages, newMessage];
    
    // Update state immediately
    setConversations(prev => ({ ...prev, [user.id]: updatedMessages }));
    messageStorage.saveUserMessages(user.id, updatedMessages);

    // Force refresh of admin's user list if this is a new user
    if (userMessages.length === 0) {
      // Trigger a custom event for real-time updates
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

  const sendMessageToUser = (userId, text) => {
    if (!user || !user.isAdmin) return;

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
  };

  // Function to refresh users list for admin
  const refreshUsersWithMessages = () => {
    if (user?.isAdmin) {
      const messageUsers = getUsersWithMessages();
      setUsersWithMessages(Object.values(messageUsers));
    }
  };

  const value = {
    messages: user && !user.isAdmin ? conversations[user.id] || [] : [],
    conversations,
    usersWithMessages,
    sendMessage,
    sendMessageToUser,
    refreshUsersWithMessages,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};