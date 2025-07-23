import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const UserMessages = () => {
  const { user, backendAvailable } = useAuth();
  const { messages, sendMessage, loading } = useMessages();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log('👤 UserMessages - Current state:', {
      user: user?.name,
      messagesCount: messages?.length || 0,
      messages: messages,
      backendAvailable,
      loading
    });
  }, [user, messages, backendAvailable, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && !isLoading) {
      setIsLoading(true);
      try {
        await sendMessage(newMessage);
        setNewMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
        alert('Failed to send message. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="glass-effect border-red-900/30 h-[70vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-white">Contact Support</CardTitle>
            {backendAvailable && (
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                Online
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Send a message to our support team. We'll get back to you shortly!
          </p>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-y-auto pr-4 space-y-4 py-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-400">Loading messages...</div>
            </div>
          ) : messages.length > 0 ? (
            messages.map((message) => {
              // Handle both backend and localStorage message formats
              const isUserMessage = backendAvailable ? 
                (message.sender_id === user?.id) : 
                (message.sender === 'user');
              
              const messageText = message.message || message.text;
              const messageTime = message.created_at || message.timestamp;
              const senderName = message.sender_name || (isUserMessage ? user?.name : 'Admin');
              
              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-3 ${
                    isUserMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Admin avatar (left side for admin messages) */}
                  {!isUserMessage && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-red-600 text-white">
                        A
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                      isUserMessage
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-700 text-white rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{messageText}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">
                        {formatTime(messageTime)}
                      </span>
                      {message.isAutoReply && (
                        <span className="text-xs bg-white/20 px-1 rounded text-gray-300">
                          Auto
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User avatar (right side for user messages) */}
                  {isUserMessage && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-400 mb-2">No messages yet</p>
              <p className="text-sm text-gray-500">
                Start a conversation with our support team
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        
        <div className="p-4 border-t border-red-900/30">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="bg-black/50 border-red-900/50 text-white placeholder:text-gray-400 disabled:opacity-50"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !newMessage.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          
          {backendAvailable && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              ✅ Connected to support system • Messages are delivered instantly
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default UserMessages;