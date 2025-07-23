import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const AdminMessages = () => {
  const { user } = useAuth();
  const { conversations, sendMessageToUser, usersWithMessages, refreshUsersWithMessages, loading, backendAvailable } = useMessages();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (usersWithMessages.length > 0 && !selectedUser) {
      const firstUser = usersWithMessages[0];
      setSelectedUser(firstUser);
      if (backendAvailable) {
        setSelectedConversation(firstUser.conversation_id);
      }
    }
  }, [usersWithMessages, selectedUser, backendAvailable]);

  // Update conversations when new messages arrive
  useEffect(() => {
    // This will trigger re-render when conversations update
  }, [conversations]);

  // Listen for new user messages
  useEffect(() => {
    const handleNewUserMessage = () => {
      refreshUsersWithMessages();
    };

    window.addEventListener('newUserMessage', handleNewUserMessage);
    return () => window.removeEventListener('newUserMessage', handleNewUserMessage);
  }, [refreshUsersWithMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [conversations, selectedUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedUser) {
      try {
        setIsLoadingMessages(true);
        if (backendAvailable && selectedConversation) {
          await sendMessageToUser(null, newMessage, selectedConversation);
        } else {
          await sendMessageToUser(selectedUser.id || selectedUser.user_id, newMessage);
        }
        setNewMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    }
  };

  // Get current messages based on backend or localStorage mode
  const getCurrentMessages = () => {
    if (!selectedUser) return [];
    
    if (backendAvailable && selectedConversation) {
      return conversations[selectedConversation] || [];
    } else {
      return conversations[selectedUser.id || selectedUser.user_id] || [];
    }
  };
  
  const currentMessages = getCurrentMessages();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="col-span-3 mb-4 p-4 bg-yellow-900/20 border border-yellow-600 rounded text-yellow-200 text-sm">
          <strong>Debug Info:</strong>
          <br />Users with messages: {usersWithMessages.length}
          <br />Selected user: {selectedUser?.name || 'None'}
          <br />Conversations keys: {Object.keys(conversations).join(', ')}
          <br />Current messages: {currentMessages.length}
        </div>
      )}
      
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:col-span-1"
      >
        <Card className="glass-effect border-red-900/30 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-white">Conversations ({usersWithMessages.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto space-y-2">
            {usersWithMessages.length > 0 ? (
              usersWithMessages.map((convUser, index) => {
                const userId = convUser.id || convUser.user_id;
                const userName = convUser.user_name || convUser.name;
                const conversationId = convUser.conversation_id;
                const lastMessage = backendAvailable ? convUser.last_message : 
                  conversations[userId]?.slice(-1)[0]?.text;
                
                return (
                  <div
                    key={conversationId || userId || index}
                    onClick={() => {
                      setSelectedUser(convUser);
                      if (backendAvailable && conversationId) {
                        setSelectedConversation(conversationId);
                      }
                    }}
                    className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
                      (backendAvailable ? selectedConversation === conversationId : selectedUser?.id === userId) 
                        ? 'bg-red-600/50' : 'hover:bg-white/10'
                    }`}
                  >
                    <Avatar>
                      <AvatarFallback className="bg-blue-600 text-white">
                        {userName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{userName || 'Unknown User'}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {lastMessage || 'No messages yet'}
                      </p>
                      {backendAvailable && convUser.unread_count > 0 && (
                        <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full mt-1">
                          {convUser.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No conversations yet</p>
                <p className="text-sm text-gray-500 mt-1">Messages from users will appear here</p>
                <button 
                  onClick={() => refreshUsersWithMessages()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Refresh Messages
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="lg:col-span-2"
      >
        <Card className="glass-effect border-red-900/30 h-full flex flex-col">
          {selectedUser ? (
            <>
              <CardHeader className="border-b border-red-900/30">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-blue-600 text-white">
                      {(selectedUser.user_name || selectedUser.name)?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-white">
                      {selectedUser.user_name || selectedUser.name || 'Unknown User'}
                    </CardTitle>
                    {backendAvailable && selectedUser.user_email && (
                      <p className="text-sm text-gray-400">{selectedUser.user_email}</p>
                    )}
                    {backendAvailable && (
                      <p className="text-xs text-gray-500">
                        {selectedUser.unread_count || 0} unread • Last: {
                          selectedUser.last_message_time ? 
                            new Date(selectedUser.last_message_time).toLocaleDateString() : 
                            'Never'
                        }
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto pr-4 space-y-4 py-4">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="text-gray-400">Loading messages...</div>
                  </div>
                ) : currentMessages.length > 0 ? (
                  currentMessages.map((message) => {
                    // Handle both backend and localStorage message formats
                    const isAdminMessage = backendAvailable ? 
                      (message.sender_name && (user?.name === message.sender_name || user?.email === message.sender_email)) :
                      (message.sender === 'admin');
                    
                    const messageText = message.message || message.text;
                    const messageTime = message.created_at || message.timestamp;
                    const userName = selectedUser.user_name || selectedUser.name;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-3 ${
                          isAdminMessage ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isAdminMessage && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-600 text-white">
                              {userName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                            isAdminMessage
                              ? 'bg-red-600 text-white rounded-br-none'
                              : 'bg-gray-700 text-white rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{messageText}</p>
                          <p className="text-xs opacity-70 mt-1 text-right">
                            {new Date(messageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {isAdminMessage && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-red-600 text-white">A</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex justify-center items-center h-32">
                    <div className="text-gray-400">No messages yet</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              <div className="p-4 border-t border-red-900/30">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Reply to ${selectedUser.user_name || selectedUser.name || 'user'}...`}
                    disabled={isLoadingMessages}
                    className="bg-black/50 border-red-900/50 text-white placeholder:text-gray-400"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoadingMessages}
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white disabled:opacity-50"
                  >
                    {isLoadingMessages ? (
                      <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <User className="w-16 h-16 text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-white">Select a Conversation</h3>
              <p className="text-gray-400">Choose a user from the list to view messages.</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminMessages;