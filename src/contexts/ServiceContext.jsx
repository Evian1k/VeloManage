import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import storage from '@/lib/storage';

const ServiceContext = createContext();

export const useService = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  return context;
};

const SERVICE_TYPES = {
  BRAKE_REPAIR: 'Brake Repair',
  ROUTINE_3000KM: '3000km Routine Maintenance',
  VEHICLE_PICKUP: 'Vehicle Pickup',
  OIL_CHANGE: 'Oil Change',
  TIRE_REPLACEMENT: 'Tire Replacement',
  ENGINE_DIAGNOSTIC: 'Engine Diagnostic',
  TRANSMISSION_SERVICE: 'Transmission Service',
  AC_REPAIR: 'AC Repair'
};

const SPARE_PARTS = {
  BRAKE_REPAIR: ['Brake Pads', 'Brake Discs', 'Brake Fluid'],
  ROUTINE_3000KM: ['Engine Oil', 'Oil Filter', 'Air Filter'],
  OIL_CHANGE: ['Engine Oil', 'Oil Filter'],
  TIRE_REPLACEMENT: ['Tires', 'Wheel Alignment'],
  ENGINE_DIAGNOSTIC: ['Spark Plugs', 'Engine Oil'],
  TRANSMISSION_SERVICE: ['Transmission Fluid', 'Transmission Filter'],
  AC_REPAIR: ['AC Refrigerant', 'AC Filter', 'AC Compressor']
};

const initialVehicles = [
  { id: 1, userId: 1, make: 'Toyota', model: 'Camry', year: '2020', licensePlate: 'KDA 123A' },
  { id: 2, userId: 1, make: 'Ford', model: 'Ranger', year: '2018', licensePlate: 'KDB 456B' },
];

export const ServiceProvider = ({ children }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
    if (user) {
      const savedRequests = storage.getRequests(user.id);
      setRequests(savedRequests);
      
      const savedNotifications = storage.getNotifications(user.id);
      setNotifications(savedNotifications);
      
      const savedVehicles = storage.getVehicles();
      setVehicles(savedVehicles.length > 0 ? savedVehicles : initialVehicles);
      
      generateServiceReminders();
    }
  }, [user]);

  const generateServiceReminders = () => {
    if (!user || !user.lastService) return;
    
    const lastServiceDate = new Date(user.lastService);
    const daysSinceService = Math.floor((Date.now() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceService >= 90) {
      const reminder = {
        id: `reminder_${Date.now()}`,
        type: 'service_reminder',
        title: '3000km Service Due',
        message: 'Your vehicle is due for routine maintenance. Book your service today!',
        timestamp: new Date().toISOString(),
        read: false
      };
      
      setNotifications(prev => {
        const exists = prev.some(n => n.type === 'service_reminder');
        if (!exists) {
          const updated = [reminder, ...prev];
          storage.setNotifications(user.id, updated);
          return updated;
        }
        return prev;
      });
    }
  };

  const createServiceRequest = (requestData) => {
    const newRequest = {
      id: `REQ_${Date.now()}`,
      userId: user.id,
      ...requestData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      suggestedParts: SPARE_PARTS[requestData.serviceType] || [],
      trackingEnabled: requestData.serviceType === 'Vehicle Pickup'
    };
    
    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    storage.setRequests(user.id, updatedRequests);
    
    if (user.isAdmin) {
      const notification = {
        id: `notif_${Date.now()}`,
        type: 'new_request',
        title: 'New Service Request',
        message: `${newRequest.serviceType} requested by ${user.name}`,
        timestamp: new Date().toISOString(),
        read: false,
        requestId: newRequest.id
      };
      
      const updatedNotifications = [notification, ...notifications];
      setNotifications(updatedNotifications);
      storage.setNotifications(user.id, updatedNotifications);
    }
    
    return newRequest;
  };

  const updateRequestStatus = (requestId, status, adminNotes = '') => {
    const allRequests = getAllRequests();
    const updatedRequests = allRequests.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status, 
            adminNotes,
            updatedAt: new Date().toISOString(),
            ...(status === 'approved' && req.trackingEnabled && {
              truckLocation: { lat: -1.2921, lng: 36.8219 }, // Nairobi coordinates
              estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            })
          }
        : req
    );
    
    // This is tricky with localStorage for multiple users. We'll just update the current user's view.
    // A real backend would handle this better.
    const userRequests = updatedRequests.filter(r => r.userId === user.id);
    setRequests(userRequests);
    storage.setRequests(user.id, userRequests);

    // A bit of a hack to update other users' data in localStorage
    const otherUsersRequests = updatedRequests.filter(r => r.userId !== user.id);
    const userIds = [...new Set(otherUsersRequests.map(r => r.userId))];
    userIds.forEach(uid => {
        const specificUserRequests = otherUsersRequests.filter(r => r.userId === uid);
        storage.setRequests(uid, specificUserRequests);
    });
    
    const request = updatedRequests.find(req => req.id === requestId);
    if (request) {
      const notification = {
        id: `notif_${Date.now()}`,
        type: 'status_update',
        title: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your ${request.serviceType} request has been ${status}`,
        timestamp: new Date().toISOString(),
        read: false,
        requestId
      };
      
      const updatedNotifications = [notification, ...notifications];
      setNotifications(updatedNotifications);
      storage.setNotifications(request.userId, updatedNotifications);
    }
  };

  const markNotificationAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    storage.setNotifications(user.id, updatedNotifications);
  };

  const getAllRequests = () => {
    const allRequests = [];
    // Get all request data from enhanced storage
    const storageData = storage.exportData();
    Object.entries(storageData.data).forEach(([key, value]) => {
      if (key.startsWith('autocare_requests_') && Array.isArray(value)) {
        allRequests.push(...value);
      }
    });
    return allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const addVehicle = (vehicleData) => {
    const newVehicle = {
      id: `VEH_${Date.now()}`,
      userId: user.id,
      ...vehicleData
    };
    const updatedVehicles = [...vehicles, newVehicle];
    setVehicles(updatedVehicles);
    storage.setVehicles(updatedVehicles);
  };

  const updateVehicle = (vehicleData) => {
    const updatedVehicles = vehicles.map(v => v.id === vehicleData.id ? vehicleData : v);
    setVehicles(updatedVehicles);
    storage.setVehicles(updatedVehicles);
  };

  const deleteVehicle = (vehicleId) => {
    const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);
    setVehicles(updatedVehicles);
    storage.setVehicles(updatedVehicles);
  };

  const value = {
    requests: user?.isAdmin ? getAllRequests() : requests,
    notifications,
    vehicles,
    serviceTypes: SERVICE_TYPES,
    spareParts: SPARE_PARTS,
    createServiceRequest,
    updateRequestStatus,
    markNotificationAsRead,
    generateServiceReminders,
    addVehicle,
    updateVehicle,
    deleteVehicle
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
};