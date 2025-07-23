import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Play, Square, Navigation, Clock, User, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useService } from '@/contexts/ServiceContext';
import SimpleMap from '@/components/common/SimpleMap';

const TruckDispatch = () => {
  const { requests } = useService();
  const [trucks, setTrucks] = useState([]);
  const [activeDispatches, setActiveDispatches] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Initialize trucks data
  useEffect(() => {
    const savedTrucks = localStorage.getItem('autocare_trucks');
    if (savedTrucks) {
      setTrucks(JSON.parse(savedTrucks));
    } else {
      // Initialize with default trucks
      const defaultTrucks = [
        {
          id: 'truck-001',
          name: 'Truck Alpha',
          driver: 'John Smith',
          phone: '+1234567890',
          status: 'available',
          location: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
          lastUpdate: new Date().toISOString()
        },
        {
          id: 'truck-002',
          name: 'Truck Beta',
          driver: 'Mike Johnson',
          phone: '+1234567891',
          status: 'available',
          location: { lat: 40.7589, lng: -73.9851, address: 'Manhattan, NY' },
          lastUpdate: new Date().toISOString()
        },
        {
          id: 'truck-003',
          name: 'Truck Gamma',
          driver: 'David Wilson',
          phone: '+1234567892',
          status: 'maintenance',
          location: { lat: 40.6892, lng: -74.0445, address: 'Brooklyn, NY' },
          lastUpdate: new Date().toISOString()
        }
      ];
      setTrucks(defaultTrucks);
      localStorage.setItem('autocare_trucks', JSON.stringify(defaultTrucks));
    }

    // Load active dispatches
    const savedDispatches = localStorage.getItem('autocare_dispatches');
    if (savedDispatches) {
      setActiveDispatches(JSON.parse(savedDispatches));
    }
  }, []);

  // Simulate GPS updates for active trucks
  useEffect(() => {
    const interval = setInterval(() => {
      setTrucks(prevTrucks => {
        const updatedTrucks = prevTrucks.map(truck => {
          if (truck.status === 'dispatched') {
            // Simulate slight GPS movement
            const newLat = truck.location.lat + (Math.random() - 0.5) * 0.001;
            const newLng = truck.location.lng + (Math.random() - 0.5) * 0.001;
            
            return {
              ...truck,
              location: {
                ...truck.location,
                lat: newLat,
                lng: newLng
              },
              lastUpdate: new Date().toISOString()
            };
          }
          return truck;
        });
        
        localStorage.setItem('autocare_trucks', JSON.stringify(updatedTrucks));
        return updatedTrucks;
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const dispatchTruck = (truckId, requestId) => {
    const truck = trucks.find(t => t.id === truckId);
    const request = requests.find(r => r.id === requestId);
    
    if (!truck || !request) return;

    // Create dispatch record
    const dispatch = {
      id: `dispatch-${Date.now()}`,
      truckId,
      requestId,
      startTime: new Date().toISOString(),
      status: 'en_route',
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      customerLocation: request.customerLocation || null
    };

    // Update truck status
    const updatedTrucks = trucks.map(t => 
      t.id === truckId 
        ? { ...t, status: 'dispatched', assignedRequest: requestId }
        : t
    );

    const updatedDispatches = [...activeDispatches, dispatch];

    setTrucks(updatedTrucks);
    setActiveDispatches(updatedDispatches);
    
    localStorage.setItem('autocare_trucks', JSON.stringify(updatedTrucks));
    localStorage.setItem('autocare_dispatches', JSON.stringify(updatedDispatches));


    // Trigger notification for truck dispatch
    window.dispatchEvent(new CustomEvent('serviceUpdate', { 
      detail: { 
        requestId, 
        status: 'truck_dispatched',
        type: 'truck',
        message: `Truck ${truck.name} has been dispatched to your location`
      } 
    }));


   

  };

  const completeTruckService = (dispatchId) => {
    const dispatch = activeDispatches.find(d => d.id === dispatchId);
    if (!dispatch) return;

    // Update truck status back to available
    const updatedTrucks = trucks.map(t => 
      t.id === dispatch.truckId 
        ? { ...t, status: 'available', assignedRequest: null }
        : t
    );

    // Remove from active dispatches
    const updatedDispatches = activeDispatches.filter(d => d.id !== dispatchId);

    setTrucks(updatedTrucks);
    setActiveDispatches(updatedDispatches);
    
    localStorage.setItem('autocare_trucks', JSON.stringify(updatedTrucks));
    localStorage.setItem('autocare_dispatches', JSON.stringify(updatedDispatches));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'dispatched': return 'bg-blue-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const pickupRequests = requests.filter(r => 
    r.serviceType === 'Vehicle Pickup' && r.status === 'approved'
  );

  return (
    <div className="space-y-6">
      {/* Truck Fleet Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="glass-effect border-red-900/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Truck Fleet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trucks.map((truck) => (
                <div
                  key={truck.id}
                  className="bg-black/40 rounded-lg p-4 border border-red-900/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{truck.name}</h3>
                    <Badge className={`${getStatusColor(truck.status)} text-white`}>
                      {truck.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{truck.driver}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{truck.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{truck.location.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Updated: {new Date(truck.lastUpdate).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {truck.status === 'available' && pickupRequests.length > 0 && (
                    <div className="mt-4">
                      <Select onValueChange={(requestId) => dispatchTruck(truck.id, requestId)}>
                        <SelectTrigger className="bg-black/50 border-red-900/50 text-white">
                          <SelectValue placeholder="Dispatch to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {pickupRequests.map((request) => (
                            <SelectItem key={request.id} value={request.id}>
                              Request #{request.id} - {request.vehicleInfo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Dispatches */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="glass-effect border-red-900/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Active Dispatches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeDispatches.length > 0 ? (
              <div className="space-y-4">
                {activeDispatches.map((dispatch) => {
                  const truck = trucks.find(t => t.id === dispatch.truckId);
                  const request = requests.find(r => r.id === dispatch.requestId);
                  
                  return (
                    <div
                      key={dispatch.id}
                      className="bg-black/40 rounded-lg p-4 border border-red-900/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">
                            {truck?.name} → Request #{request?.id}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {request?.vehicleInfo}
                          </p>
                        </div>
                        <Badge className="bg-blue-500 text-white">
                          {dispatch.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div>
                          <p><strong>Driver:</strong> {truck?.driver}</p>
                          <p><strong>Phone:</strong> {truck?.phone}</p>
                          <p><strong>Started:</strong> {new Date(dispatch.startTime).toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p><strong>ETA:</strong> {new Date(dispatch.estimatedArrival).toLocaleTimeString()}</p>
                          <p><strong>Current Location:</strong></p>
                          <p className="text-xs">
                            Lat: {truck?.location.lat.toFixed(4)}, 
                            Lng: {truck?.location.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>

                      {dispatch.customerLocation && (
                        <div className="mt-3 p-3 bg-green-900/30 rounded border border-green-500/30">
                          <p className="text-sm text-green-300">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Customer Location Received: {dispatch.customerLocation.address}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => completeTruckService(dispatch.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Square className="w-4 h-4 mr-1" />
                          Complete Service
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          View on Map
                        </Button>
                      </div>

                      {/* Live Map for this dispatch */}
                      <div className="mt-4">
                        <SimpleMap
                          truckLocation={truck?.location}
                          userLocation={dispatch.customerLocation}
                          showRoute={!!dispatch.customerLocation}
                          className="h-64"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Truck className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No active dispatches</p>
                <p className="text-sm text-gray-500 mt-1">
                  Approved pickup requests will appear here for dispatch
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TruckDispatch;