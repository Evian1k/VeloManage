import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { requestStorage, notificationStorage } from '@/utils/storage';

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
      // Load all requests (global storage for admin access)
      const allRequests = requestStorage.getAllRequests();
      setRequests(allRequests);
      
      // Load user's notifications
      const userNotifications = notificationStorage.getUserNotifications(user.id);
      setNotifications(userNotifications);

      // Load vehicles (global for now, but filter by user)
      const savedVehicles = localStorage.getItem(`autocare_vehicles`);
      setVehicles(savedVehicles ? JSON.parse(savedVehicles) : initialVehicles);
      
      generateServiceReminders();
    } else {
      // Clear data when no user
      setRequests([]);
      setNotifications([]);
      setVehicles([]);
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
          notificationStorage.saveUserNotifications(user.id, updated);
          return updated;
        }
        return prev;
      });
    }
  };

  const createServiceRequest = (requestData) => {
    const newRequest = {
      id: Date.now(), // Use timestamp as ID
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      ...requestData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      suggestedParts: SPARE_PARTS[requestData.serviceType] || [],
      trackingEnabled: requestData.serviceType === 'Vehicle Pickup'
    };
    
    // Use centralized storage
    const addedRequest = requestStorage.addRequest(newRequest);
    
    // Update local state with all requests
    const allRequests = requestStorage.getAllRequests();
    setRequests(allRequests);
    
    // Create notification for admins
    const notification = {
      id: `notif_${Date.now()}`,
      type: 'new_request',
      title: 'New Service Request',
      message: `${newRequest.serviceType} requested by ${user.name}`,
      timestamp: new Date().toISOString(),
      read: false,
      requestId: addedRequest.id
    };
    
    // Save notification globally for all admins to see
    notificationStorage.addGlobalNotification(notification);
    
    return addedRequest;
  };

  const updateRequestStatus = (requestId, status, adminNotes = '') => {
    // Update using centralized storage
    const updatedRequest = requestStorage.updateRequest(requestId, {
      status,
      adminNotes,
      ...(status === 'approved' && {
        truckLocation: { lat: -1.2921, lng: 36.8219 }, // Nairobi coordinates
        estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      })
    });
    
    // Update local state with all requests
    const allRequests = requestStorage.getAllRequests();
    setRequests(allRequests);
    
    const request = updatedRequest;
    if (request) {
      // Trigger notification for service update
      window.dispatchEvent(new CustomEvent('serviceUpdate', { 
        detail: { 
          requestId, 
          status,
          type: 'service',
          userId: request.userId
        } 
      }));
      
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
      localStorage.setItem(`autocare_notifications_${request.userId}`, JSON.stringify(updatedNotifications));
    }
  };

  const markNotificationAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    notificationStorage.saveUserNotifications(user.id, updatedNotifications);
  };

  const addVehicle = (vehicleData) => {
    const newVehicle = {
      id: `VEH_${Date.now()}`,
      userId: user.id,
      ...vehicleData
    };
    const updatedVehicles = [...vehicles, newVehicle];
    setVehicles(updatedVehicles);
    localStorage.setItem('autocare_vehicles', JSON.stringify(updatedVehicles));
  };

  const updateVehicle = (vehicleData) => {
    const updatedVehicles = vehicles.map(v => v.id === vehicleData.id ? vehicleData : v);
    setVehicles(updatedVehicles);
    localStorage.setItem('autocare_vehicles', JSON.stringify(updatedVehicles));
  };

  const deleteVehicle = (vehicleId) => {
    const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);
    setVehicles(updatedVehicles);
    localStorage.setItem('autocare_vehicles', JSON.stringify(updatedVehicles));
  };

  const value = {
    requests: requests, // All requests are now loaded globally in useEffect
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