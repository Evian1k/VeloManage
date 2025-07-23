import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Send, CheckCircle, Clock, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useService } from '@/contexts/ServiceContext';
import { useToast } from '@/components/ui/use-toast';
import SimpleMap from '@/components/common/SimpleMap';

const LocationSharing = () => {
  const { user } = useAuth();
  const { requests } = useService();
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState(null);
  const [manualAddress, setManualAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [sharedLocations, setSharedLocations] = useState({});
  const [truckInfo, setTruckInfo] = useState({});

  // Get user's pickup requests
  const pickupRequests = requests.filter(r => 
    r.serviceType === 'Vehicle Pickup' && 
    (r.status === 'approved' || r.status === 'in_progress')
  );

  useEffect(() => {
    // Load shared locations and truck info
    const savedLocations = localStorage.getItem(`autocare_user_locations_${user.id}`);
    if (savedLocations) {
      setSharedLocations(JSON.parse(savedLocations));
    }

    // Check for active dispatches
    const savedDispatches = localStorage.getItem('autocare_dispatches');
    if (savedDispatches) {
      const dispatches = JSON.parse(savedDispatches);
      const userDispatches = {};
      
      dispatches.forEach(dispatch => {
        const request = requests.find(r => r.id === dispatch.requestId);
        if (request && request.userId === user.id) {
          userDispatches[dispatch.requestId] = dispatch;
        }
      });
      
      setTruckInfo(userDispatches);
    }
  }, [user.id, requests]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        
        // Reverse geocoding simulation (in real app, use Google Maps API)
        location.address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
        
        setUserLocation(location);
        setIsGettingLocation(false);
        
        toast({
          title: "Location Found",
          description: "Your current location has been detected.",
        });
      },
      (error) => {
        console.error('Location error:', error);
        setIsGettingLocation(false);
        
        let message = "Unable to get your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access was denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const shareLocationWithTruck = (requestId, location) => {
    const locationData = {
      requestId,
      location,
      sharedAt: new Date().toISOString(),
      userId: user.id
    };

    // Save location locally
    const updatedLocations = {
      ...sharedLocations,
      [requestId]: locationData
    };
    
    setSharedLocations(updatedLocations);
    localStorage.setItem(`autocare_user_locations_${user.id}`, JSON.stringify(updatedLocations));

    // Update the dispatch with customer location
    const savedDispatches = localStorage.getItem('autocare_dispatches');
    if (savedDispatches) {
      const dispatches = JSON.parse(savedDispatches);
      const updatedDispatches = dispatches.map(dispatch => {
        if (dispatch.requestId === requestId) {
          return {
            ...dispatch,
            customerLocation: location
          };
        }
        return dispatch;
      });
      
      localStorage.setItem('autocare_dispatches', JSON.stringify(updatedDispatches));
    }

    toast({
      title: "Location Shared",
      description: "Your location has been sent to the truck driver.",
    });
  };

  const shareManualAddress = (requestId) => {
    if (!manualAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your address.",
        variant: "destructive"
      });
      return;
    }

    const location = {
      address: manualAddress,
      isManual: true,
      timestamp: new Date().toISOString()
    };

    shareLocationWithTruck(requestId, location);
    setManualAddress('');
  };

  const getTruckETA = (requestId) => {
    const dispatch = truckInfo[requestId];
    if (!dispatch) return null;
    
    const eta = new Date(dispatch.estimatedArrival);
    const now = new Date();
    const diffMinutes = Math.max(0, Math.floor((eta - now) / (1000 * 60)));
    
    return diffMinutes;
  };

  return (
    <div className="space-y-6">
      {/* Current Location Detection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="glass-effect border-red-900/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Share Your Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {isGettingLocation ? 'Getting Location...' : 'Get Current Location'}
              </Button>
              
              {userLocation && (
                <div className="flex-1 bg-black/40 rounded p-3 border border-green-500/30">
                  <p className="text-sm text-green-300">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Location detected: {userLocation.address}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Accuracy: ±{Math.round(userLocation.accuracy)}m
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-red-900/30 pt-4">
              <h4 className="text-white font-medium mb-2">Or enter address manually:</h4>
              <div className="flex gap-2">
                <Input
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Enter your full address..."
                  className="bg-black/50 border-red-900/50 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Pickup Requests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="glass-effect border-red-900/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Truck Pickup Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pickupRequests.length > 0 ? (
              <div className="space-y-4">
                {pickupRequests.map((request) => {
                  const sharedLocation = sharedLocations[request.id];
                  const eta = getTruckETA(request.id);
                  const dispatch = truckInfo[request.id];
                  
                  return (
                    <div
                      key={request.id}
                      className="bg-black/40 rounded-lg p-4 border border-red-900/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">
                            Request #{request.id}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {request.vehicleInfo}
                          </p>
                        </div>
                        <Badge className={`${request.status === 'approved' ? 'bg-blue-500' : 'bg-orange-500'} text-white`}>
                          {request.status === 'approved' ? 'Truck Assigned' : 'In Progress'}
                        </Badge>
                      </div>

                      {dispatch && (
                        <div className="bg-blue-900/30 rounded p-3 mb-4 border border-blue-500/30">
                          <h4 className="text-blue-300 font-medium mb-2">Truck Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-200">
                            <p><strong>Driver:</strong> {dispatch.driver || 'John Smith'}</p>
                            <p><strong>Phone:</strong> {dispatch.phone || '+1234567890'}</p>
                            <p><strong>Status:</strong> {dispatch.status}</p>
                            {eta !== null && (
                              <p><strong>ETA:</strong> {eta > 0 ? `${eta} minutes` : 'Arriving now'}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {sharedLocation ? (
                        <div className="bg-green-900/30 rounded p-3 border border-green-500/30">
                          <p className="text-sm text-green-300 mb-2">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Location shared with truck driver
                          </p>
                          <p className="text-xs text-gray-300">
                            Address: {sharedLocation.location.address}
                          </p>
                          <p className="text-xs text-gray-400">
                            Shared: {new Date(sharedLocation.sharedAt).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-yellow-300 text-sm">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Share your location to help the truck find you
                          </p>
                          
                          <div className="flex gap-2">
                            {userLocation && (
                              <Button
                                onClick={() => shareLocationWithTruck(request.id, userLocation)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Share GPS Location
                              </Button>
                            )}
                            
                            {manualAddress && (
                              <Button
                                onClick={() => shareManualAddress(request.id)}
                                variant="outline"
                                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Share Address
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Live Map */}
                      {dispatch && (sharedLocation || userLocation) && (
                        <div className="mt-4">
                          <SimpleMap
                            truckLocation={{
                              lat: 40.7128 + (Math.random() - 0.5) * 0.01,
                              lng: -74.0060 + (Math.random() - 0.5) * 0.01,
                              address: "Truck Location (Live)",
                              lastUpdate: new Date().toISOString()
                            }}
                            userLocation={sharedLocation?.location || userLocation}
                            showRoute={true}
                            className="h-64"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Truck className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No active pickup requests</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create a vehicle pickup request to see truck status here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LocationSharing;