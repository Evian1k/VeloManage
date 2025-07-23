import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Circle } from 'lucide-react';

const LiveStatusIndicator = ({ className = "" }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update timestamp every 30 seconds
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <motion.div
        animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 2, repeat: isOnline ? Infinity : 0 }}
        className="flex items-center gap-1"
      >
        {isOnline ? (
          <Circle className="w-2 h-2 text-green-500 fill-current" />
        ) : (
          <Circle className="w-2 h-2 text-red-500 fill-current" />
        )}
        <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
          {isOnline ? 'Live' : 'Offline'}
        </span>
      </motion.div>
      
      <span className="text-gray-500">
        • Updated {lastUpdate.toLocaleTimeString()}
      </span>
    </div>
  );
};

export default LiveStatusIndicator;