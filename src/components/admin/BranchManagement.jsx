import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  Phone, 
  Mail,
  Users,
  Truck,
  Settings,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import apiService from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

const BranchManagement = () => {
  const { user, backendAvailable } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    contact_info: {
      phone: '',
      email: '',
      website: ''
    },
    working_hours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '16:00', closed: false },
      sunday: { open: '09:00', close: '15:00', closed: true }
    },
    manager_name: '',
    capacity: '',
    services_offered: []
  });
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    shift: ''
  });

  const loadBranches = async () => {
    setLoading(true);
    try {
      if (backendAvailable) {
        const response = await apiService.getBranches();
        if (response.success) {
          setBranches(response.data);
        }
      } else {
        // Demo data
        setBranches([
          {
            id: 1,
            name: 'Main Branch',
            location: 'Downtown',
            address: '123 Main St, City',
            contact_info: { phone: '+1234567890', email: 'main@autocare.com' },
            working_hours: {},
            manager_name: 'John Manager',
            capacity: 50,
            truck_count: 5,
            available_trucks: 3,
            staff_members: [
              { id: 1, name: 'Alice Tech', role: 'Technician', phone: '+1111111111' },
              { id: 2, name: 'Bob Mechanic', role: 'Mechanic', phone: '+2222222222' }
            ]
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [backendAvailable]);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      if (backendAvailable) {
        const response = await apiService.createBranch(formData);
        if (response.success) {
          await loadBranches();
          setIsCreateModalOpen(false);
          resetForm();
        }
      } else {
        // Demo mode
        const newBranch = {
          id: Date.now(),
          ...formData,
          truck_count: 0,
          available_trucks: 0,
          staff_members: []
        };
        setBranches(prev => [...prev, newBranch]);
        setIsCreateModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Failed to create branch');
    }
  };

  const handleUpdateBranch = async (e) => {
    e.preventDefault();
    try {
      if (backendAvailable) {
        const response = await apiService.updateBranch(selectedBranch.id, formData);
        if (response.success) {
          await loadBranches();
          setIsEditModalOpen(false);
          setSelectedBranch(null);
          resetForm();
        }
      } else {
        // Demo mode
        setBranches(prev => prev.map(branch => 
          branch.id === selectedBranch.id ? { ...branch, ...formData } : branch
        ));
        setIsEditModalOpen(false);
        setSelectedBranch(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      alert('Failed to update branch');
    }
  };

  const handleDeleteBranch = async (branchId) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    
    try {
      if (backendAvailable) {
        const response = await apiService.deleteBranch(branchId);
        if (response.success) {
          await loadBranches();
        }
      } else {
        setBranches(prev => prev.filter(branch => branch.id !== branchId));
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('Failed to delete branch');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      if (backendAvailable) {
        const response = await apiService.addStaffMember(selectedBranch.id, staffForm);
        if (response.success) {
          await loadBranches();
          setIsStaffModalOpen(false);
          setStaffForm({ name: '', role: '', phone: '', email: '', shift: '' });
        }
      } else {
        // Demo mode
        const newStaff = {
          id: Date.now(),
          ...staffForm,
          added_at: new Date().toISOString()
        };
        setBranches(prev => prev.map(branch => 
          branch.id === selectedBranch.id 
            ? { ...branch, staff_members: [...(branch.staff_members || []), newStaff] }
            : branch
        ));
        setIsStaffModalOpen(false);
        setStaffForm({ name: '', role: '', phone: '', email: '', shift: '' });
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Failed to add staff member');
    }
  };

  const handleRemoveStaff = async (branchId, staffId) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    
    try {
      if (backendAvailable) {
        const response = await apiService.removeStaffMember(branchId, staffId);
        if (response.success) {
          await loadBranches();
        }
      } else {
        setBranches(prev => prev.map(branch => 
          branch.id === branchId 
            ? { ...branch, staff_members: branch.staff_members.filter(staff => staff.id !== staffId) }
            : branch
        ));
      }
    } catch (error) {
      console.error('Error removing staff:', error);
      alert('Failed to remove staff member');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      address: '',
      contact_info: {
        phone: '',
        email: '',
        website: ''
      },
      working_hours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '08:00', close: '16:00', closed: false },
        sunday: { open: '09:00', close: '15:00', closed: true }
      },
      manager_name: '',
      capacity: '',
      services_offered: []
    });
  };

  const openEditModal = (branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name || '',
      location: branch.location || '',
      address: branch.address || '',
      contact_info: branch.contact_info || { phone: '', email: '', website: '' },
      working_hours: branch.working_hours || formData.working_hours,
      manager_name: branch.manager_name || '',
      capacity: branch.capacity || '',
      services_offered: branch.services_offered || []
    });
    setIsEditModalOpen(true);
  };

  const openStaffModal = (branch) => {
    setSelectedBranch(branch);
    setIsStaffModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading branches...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Branch Management</h1>
          <p className="text-gray-400">Manage your garage branches and locations</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Branch
        </Button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <motion.div
            key={branch.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-effect border-red-900/30 hover:border-red-700/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-purple-500" />
                    <div>
                      <CardTitle className="text-white text-lg">{branch.name}</CardTitle>
                      <p className="text-sm text-gray-400">{branch.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(branch)}
                      className="text-gray-300 border-gray-600 hover:bg-gray-700"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="text-red-400 border-red-600 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {branch.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span>{branch.address}</span>
                  </div>
                )}
                
                {branch.contact_info?.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Phone className="h-4 w-4" />
                    <span>{branch.contact_info.phone}</span>
                  </div>
                )}
                
                {branch.contact_info?.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Mail className="h-4 w-4" />
                    <span>{branch.contact_info.email}</span>
                  </div>
                )}
                
                {branch.manager_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Users className="h-4 w-4" />
                    <span>Manager: {branch.manager_name}</span>
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{branch.truck_count || 0}</div>
                    <div className="text-xs text-gray-400">Total Trucks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{branch.available_trucks || 0}</div>
                    <div className="text-xs text-gray-400">Available</div>
                  </div>
                </div>

                {/* Staff Members */}
                {branch.staff_members && branch.staff_members.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white">Staff ({branch.staff_members.length})</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openStaffModal(branch)}
                        className="text-xs text-gray-300 border-gray-600 hover:bg-gray-700"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {branch.staff_members.map((staff) => (
                        <div key={staff.id} className="flex items-center justify-between bg-gray-800/50 p-2 rounded text-xs">
                          <div>
                            <div className="text-white font-medium">{staff.name}</div>
                            <div className="text-gray-400">{staff.role}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveStaff(branch.id, staff.id)}
                            className="text-red-400 hover:bg-red-600 hover:text-white p-1"
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => openStaffModal(branch)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Staff
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {branches.length === 0 && (
        <Card className="glass-effect border-red-900/30">
          <CardContent className="p-8 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Branches Found</h3>
            <p className="text-gray-400 mb-4">
              Create your first branch to start managing multiple locations
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Branch
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <BranchFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        onSubmit={handleCreateBranch}
        formData={formData}
        setFormData={setFormData}
        title="Create New Branch"
        submitLabel="Create Branch"
      />

      <BranchFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBranch(null);
          resetForm();
        }}
        onSubmit={handleUpdateBranch}
        formData={formData}
        setFormData={setFormData}
        title="Edit Branch"
        submitLabel="Update Branch"
      />

      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => {
          setIsStaffModalOpen(false);
          setSelectedBranch(null);
          setStaffForm({ name: '', role: '', phone: '', email: '', shift: '' });
        }}
        onSubmit={handleAddStaff}
        staffForm={staffForm}
        setStaffForm={setStaffForm}
        branch={selectedBranch}
      />
    </div>
  );
};

// Branch Form Modal Component
const BranchFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  title, 
  submitLabel 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-red-900/30 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">Branch Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-black/50 border-red-900/50 text-white"
                  placeholder="e.g., Main Branch"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="location" className="text-gray-300">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="bg-black/50 border-red-900/50 text-white"
                  placeholder="e.g., Downtown"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="address" className="text-gray-300">Full Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="bg-black/50 border-red-900/50 text-white"
                  placeholder="e.g., 123 Main St, City, State, ZIP"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="manager_name" className="text-gray-300">Manager Name</Label>
                <Input
                  id="manager_name"
                  value={formData.manager_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager_name: e.target.value }))}
                  className="bg-black/50 border-red-900/50 text-white"
                  placeholder="e.g., John Manager"
                />
              </div>
              
              <div>
                <Label htmlFor="capacity" className="text-gray-300">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  className="bg-black/50 border-red-900/50 text-white"
                  placeholder="e.g., 50"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                <Input
                  id="phone"
                  value={formData.contact_info.phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact_info: { ...prev.contact_info, phone: e.target.value }
                  }))}
                  className="bg-black/50 border-red-900/50 text-white"
                  placeholder="+1234567890"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact_info.email}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact_info: { ...prev.contact_info, email: e.target.value }
                  }))}
                  className="bg-black/50 border-red-900/50 text-white"
                  placeholder="branch@autocare.com"
                />
              </div>
              
              <div>
                <Label htmlFor="website" className="text-gray-300">Website</Label>
                <Input
                  id="website"
                  value={formData.contact_info.website}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact_info: { ...prev.contact_info, website: e.target.value }
                  }))}
                  className="bg-black/50 border-red-900/50 text-white"
                  placeholder="https://branch.autocare.com"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Staff Modal Component
const StaffModal = ({ isOpen, onClose, onSubmit, staffForm, setStaffForm, branch }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-red-900/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add Staff Member</DialogTitle>
          <p className="text-gray-400 text-sm">Adding to: {branch?.name}</p>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="staff_name" className="text-gray-300">Name *</Label>
            <Input
              id="staff_name"
              value={staffForm.name}
              onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
              className="bg-black/50 border-red-900/50 text-white"
              placeholder="e.g., Alice Tech"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="staff_role" className="text-gray-300">Role *</Label>
            <Input
              id="staff_role"
              value={staffForm.role}
              onChange={(e) => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
              className="bg-black/50 border-red-900/50 text-white"
              placeholder="e.g., Technician, Mechanic, Manager"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="staff_phone" className="text-gray-300">Phone</Label>
            <Input
              id="staff_phone"
              value={staffForm.phone}
              onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-black/50 border-red-900/50 text-white"
              placeholder="+1234567890"
            />
          </div>
          
          <div>
            <Label htmlFor="staff_email" className="text-gray-300">Email</Label>
            <Input
              id="staff_email"
              type="email"
              value={staffForm.email}
              onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
              className="bg-black/50 border-red-900/50 text-white"
              placeholder="staff@autocare.com"
            />
          </div>
          
          <div>
            <Label htmlFor="staff_shift" className="text-gray-300">Shift</Label>
            <Input
              id="staff_shift"
              value={staffForm.shift}
              onChange={(e) => setStaffForm(prev => ({ ...prev, shift: e.target.value }))}
              className="bg-black/50 border-red-900/50 text-white"
              placeholder="e.g., Morning, Evening, Night"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              Add Staff Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BranchManagement;