import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  User, 
  Settings, 
  Calendar,
  Navigation,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import apiService from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

const TruckManagement = () => {
  const { user, backendAvailable } = useAuth();
  const [trucks, setTrucks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    model: '',
    capacity: '',
    driver_name: '',
    driver_phone: '',
    branch_id: '',
    status: 'available'
  });

  const statusColors = {
    available: 'bg-green-500',
    dispatched: 'bg-blue-500',
    maintenance: 'bg-yellow-500',
    offline: 'bg-red-500'
  };

  const statusIcons = {
    available: CheckCircle,
    dispatched: Navigation,
    maintenance: Wrench,
    offline: AlertCircle
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (backendAvailable) {
        const [trucksRes, branchesRes, servicesRes] = await Promise.all([
          apiService.getTrucks(),
          apiService.getBranches(),
          apiService.getServices()
        ]);

        if (trucksRes.success) setTrucks(trucksRes.data);
        if (branchesRes.success) setBranches(branchesRes.data);
        if (servicesRes.success) setServices(servicesRes.data);
      } else {
        // Fallback to demo data
        setTrucks([
          {
            id: 1,
            name: 'Fleet Truck 01',
            license_plate: 'ABC-123',
            model: 'Ford Transit',
            capacity: '3.5 tons',
            driver_name: 'John Doe',
            driver_phone: '+1234567890',
            status: 'available',
            branch_name: 'Main Branch'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [backendAvailable]);

  const handleCreateTruck = async (e) => {
    e.preventDefault();
    try {
      if (backendAvailable) {
        const response = await apiService.createTruck(formData);
        if (response.success) {
          await loadData();
          setIsCreateModalOpen(false);
          resetForm();
        }
      } else {
        // Demo mode
        const newTruck = {
          id: Date.now(),
          ...formData,
          created_at: new Date().toISOString()
        };
        setTrucks(prev => [...prev, newTruck]);
        setIsCreateModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating truck:', error);
      alert('Failed to create truck');
    }
  };

  const handleUpdateTruck = async (e) => {
    e.preventDefault();
    try {
      if (backendAvailable) {
        const response = await apiService.updateTruck(selectedTruck.id, formData);
        if (response.success) {
          await loadData();
          setIsEditModalOpen(false);
          setSelectedTruck(null);
          resetForm();
        }
      } else {
        // Demo mode
        setTrucks(prev => prev.map(truck => 
          truck.id === selectedTruck.id ? { ...truck, ...formData } : truck
        ));
        setIsEditModalOpen(false);
        setSelectedTruck(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating truck:', error);
      alert('Failed to update truck');
    }
  };

  const handleDeleteTruck = async (truckId) => {
    if (!confirm('Are you sure you want to delete this truck?')) return;
    
    try {
      if (backendAvailable) {
        const response = await apiService.deleteTruck(truckId);
        if (response.success) {
          await loadData();
        }
      } else {
        setTrucks(prev => prev.filter(truck => truck.id !== truckId));
      }
    } catch (error) {
      console.error('Error deleting truck:', error);
      alert('Failed to delete truck');
    }
  };

  const handleDispatchTruck = async (truckId) => {
    const availableServices = services.filter(s => s.status === 'pending');
    if (availableServices.length === 0) {
      alert('No pending service requests available for dispatch');
      return;
    }

    const serviceId = prompt(`Enter service request ID (Available: ${availableServices.map(s => s.id).join(', ')}):`);
    if (!serviceId) return;

    try {
      if (backendAvailable) {
        const response = await apiService.dispatchTruck(truckId, parseInt(serviceId));
        if (response.success) {
          await loadData();
          alert('Truck dispatched successfully!');
        }
      } else {
        // Demo mode
        setTrucks(prev => prev.map(truck => 
          truck.id === truckId ? { ...truck, status: 'dispatched' } : truck
        ));
        alert('Truck dispatched successfully!');
      }
    } catch (error) {
      console.error('Error dispatching truck:', error);
      alert('Failed to dispatch truck');
    }
  };

  const handleCompleteTruck = async (truckId) => {
    const notes = prompt('Enter completion notes:');
    
    try {
      if (backendAvailable) {
        const response = await apiService.completeTruckService(truckId, notes);
        if (response.success) {
          await loadData();
          alert('Service completed successfully!');
        }
      } else {
        // Demo mode
        setTrucks(prev => prev.map(truck => 
          truck.id === truckId ? { ...truck, status: 'available' } : truck
        ));
        alert('Service completed successfully!');
      }
    } catch (error) {
      console.error('Error completing service:', error);
      alert('Failed to complete service');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      license_plate: '',
      model: '',
      capacity: '',
      driver_name: '',
      driver_phone: '',
      branch_id: '',
      status: 'available'
    });
  };

  const openEditModal = (truck) => {
    setSelectedTruck(truck);
    setFormData({
      name: truck.name || '',
      license_plate: truck.license_plate || '',
      model: truck.model || '',
      capacity: truck.capacity || '',
      driver_name: truck.driver_name || '',
      driver_phone: truck.driver_phone || '',
      branch_id: truck.branch_id || '',
      status: truck.status || 'available'
    });
    setIsEditModalOpen(true);
  };

  const StatusIcon = ({ status }) => {
    const Icon = statusIcons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading trucks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Fleet Management</h1>
          <p className="text-gray-400">Manage your truck fleet and dispatching</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Truck
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusColors).map(([status, color]) => {
          const count = trucks.filter(truck => truck.status === status).length;
          const Icon = statusIcons[status];
          
          return (
            <Card key={status} className="glass-effect border-red-900/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 capitalize">{status}</p>
                    <p className="text-2xl font-bold text-white">{count}</p>
                  </div>
                  <div className={`p-2 rounded-full ${color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trucks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {trucks.map((truck) => (
          <motion.div
            key={truck.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-effect border-red-900/30 hover:border-red-700/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-red-500" />
                    <div>
                      <CardTitle className="text-white text-lg">{truck.name}</CardTitle>
                      <p className="text-sm text-gray-400">{truck.license_plate}</p>
                    </div>
                  </div>
                  <Badge className={`${statusColors[truck.status]} text-white`}>
                    <StatusIcon status={truck.status} />
                    <span className="ml-1 capitalize">{truck.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {truck.model && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Settings className="h-4 w-4" />
                    <span>{truck.model}</span>
                    {truck.capacity && <span>• {truck.capacity}</span>}
                  </div>
                )}
                
                {truck.driver_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <User className="h-4 w-4" />
                    <span>{truck.driver_name}</span>
                    {truck.driver_phone && (
                      <span className="text-xs text-gray-400">({truck.driver_phone})</span>
                    )}
                  </div>
                )}
                
                {truck.branch_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span>{truck.branch_name}</span>
                  </div>
                )}

                {truck.current_lat && truck.current_lng && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Navigation className="h-4 w-4" />
                    <span>GPS: {truck.current_lat.toFixed(4)}, {truck.current_lng.toFixed(4)}</span>
                  </div>
                )}

                {truck.assigned_service_type && (
                  <div className="flex items-center gap-2 text-sm text-blue-300">
                    <Calendar className="h-4 w-4" />
                    <span>Assigned: {truck.assigned_service_type}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(truck)}
                    className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  
                  {truck.status === 'available' && (
                    <Button
                      size="sm"
                      onClick={() => handleDispatchTruck(truck.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Dispatch
                    </Button>
                  )}
                  
                  {truck.status === 'dispatched' && (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteTruck(truck.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTruck(truck.id)}
                    className="text-red-400 border-red-600 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {trucks.length === 0 && (
        <Card className="glass-effect border-red-900/30">
          <CardContent className="p-8 text-center">
            <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Trucks Found</h3>
            <p className="text-gray-400 mb-4">
              Start building your fleet by adding your first truck
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Truck
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modals */}
      <TruckFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        onSubmit={handleCreateTruck}
        formData={formData}
        setFormData={setFormData}
        branches={branches}
        title="Add New Truck"
        submitLabel="Create Truck"
      />

      <TruckFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTruck(null);
          resetForm();
        }}
        onSubmit={handleUpdateTruck}
        formData={formData}
        setFormData={setFormData}
        branches={branches}
        title="Edit Truck"
        submitLabel="Update Truck"
      />
    </div>
  );
};

// Truck Form Modal Component
const TruckFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  branches, 
  title, 
  submitLabel 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-red-900/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Truck Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-black/50 border-red-900/50 text-white"
                placeholder="e.g., Fleet Truck 01"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="license_plate" className="text-gray-300">License Plate *</Label>
              <Input
                id="license_plate"
                value={formData.license_plate}
                onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                className="bg-black/50 border-red-900/50 text-white"
                placeholder="e.g., ABC-123"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="model" className="text-gray-300">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="bg-black/50 border-red-900/50 text-white"
                placeholder="e.g., Ford Transit"
              />
            </div>
            
            <div>
              <Label htmlFor="capacity" className="text-gray-300">Capacity</Label>
              <Input
                id="capacity"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                className="bg-black/50 border-red-900/50 text-white"
                placeholder="e.g., 3.5 tons"
              />
            </div>
            
            <div>
              <Label htmlFor="driver_name" className="text-gray-300">Driver Name</Label>
              <Input
                id="driver_name"
                value={formData.driver_name}
                onChange={(e) => setFormData(prev => ({ ...prev, driver_name: e.target.value }))}
                className="bg-black/50 border-red-900/50 text-white"
                placeholder="e.g., John Doe"
              />
            </div>
            
            <div>
              <Label htmlFor="driver_phone" className="text-gray-300">Driver Phone</Label>
              <Input
                id="driver_phone"
                value={formData.driver_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, driver_phone: e.target.value }))}
                className="bg-black/50 border-red-900/50 text-white"
                placeholder="e.g., +1234567890"
              />
            </div>
            
            <div>
              <Label htmlFor="branch_id" className="text-gray-300">Branch</Label>
              <Select
                value={formData.branch_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, branch_id: value }))}
              >
                <SelectTrigger className="bg-black/50 border-red-900/50 text-white">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-red-900/30">
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()} className="text-white">
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status" className="text-gray-300">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-black/50 border-red-900/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-red-900/30">
                  <SelectItem value="available" className="text-white">Available</SelectItem>
                  <SelectItem value="maintenance" className="text-white">Maintenance</SelectItem>
                  <SelectItem value="offline" className="text-white">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TruckManagement;