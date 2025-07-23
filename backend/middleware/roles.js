import { dbAsync } from '../config/database.js';

// Role hierarchy
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  MANAGER: 'manager',
  DRIVER: 'driver',
  USER: 'user'
};

// Role permissions
export const PERMISSIONS = {
  // User management
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  VIEW_ALL_USERS: 'view_all_users',
  
  // Truck management
  CREATE_TRUCK: 'create_truck',
  UPDATE_TRUCK: 'update_truck',
  DELETE_TRUCK: 'delete_truck',
  DISPATCH_TRUCK: 'dispatch_truck',
  UPDATE_TRUCK_LOCATION: 'update_truck_location',
  
  // Branch management
  CREATE_BRANCH: 'create_branch',
  UPDATE_BRANCH: 'update_branch',
  DELETE_BRANCH: 'delete_branch',
  MANAGE_STAFF: 'manage_staff',
  
  // Service management
  VIEW_ALL_SERVICES: 'view_all_services',
  UPDATE_SERVICE_STATUS: 'update_service_status',
  DELETE_SERVICE: 'delete_service',
  
  // Messaging
  VIEW_ALL_MESSAGES: 'view_all_messages',
  DELETE_MESSAGE: 'delete_message',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_BRANCH_ANALYTICS: 'view_branch_analytics'
};

// Role permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.CREATE_TRUCK,
    PERMISSIONS.UPDATE_TRUCK,
    PERMISSIONS.DELETE_TRUCK,
    PERMISSIONS.DISPATCH_TRUCK,
    PERMISSIONS.CREATE_BRANCH,
    PERMISSIONS.UPDATE_BRANCH,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_ALL_SERVICES,
    PERMISSIONS.UPDATE_SERVICE_STATUS,
    PERMISSIONS.DELETE_SERVICE,
    PERMISSIONS.VIEW_ALL_MESSAGES,
    PERMISSIONS.DELETE_MESSAGE,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_BRANCH_ANALYTICS
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.UPDATE_TRUCK,
    PERMISSIONS.DISPATCH_TRUCK,
    PERMISSIONS.UPDATE_BRANCH,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_ALL_SERVICES,
    PERMISSIONS.UPDATE_SERVICE_STATUS,
    PERMISSIONS.VIEW_ALL_MESSAGES,
    PERMISSIONS.VIEW_BRANCH_ANALYTICS
  ],
  [ROLES.DRIVER]: [
    PERMISSIONS.UPDATE_TRUCK_LOCATION,
    PERMISSIONS.UPDATE_SERVICE_STATUS
  ],
  [ROLES.USER]: []
};

// Get user's effective role
export const getUserRole = (user) => {
  if (user.role === 'Main Admin') return ROLES.SUPER_ADMIN;
  if (user.is_admin) return ROLES.ADMIN;
  if (user.role === 'Manager') return ROLES.MANAGER;
  if (user.role === 'Driver') return ROLES.DRIVER;
  return ROLES.USER;
};

// Check if user has permission
export const hasPermission = (user, permission) => {
  const userRole = getUserRole(user);
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// Middleware to require specific permission
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to require specific role
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = getUserRole(req.user);
    
    // Check if user has required role or higher
    const roleHierarchy = [
      ROLES.USER,
      ROLES.DRIVER,
      ROLES.MANAGER,
      ROLES.ADMIN,
      ROLES.SUPER_ADMIN
    ];
    
    const requiredIndex = roleHierarchy.indexOf(role);
    const userIndex = roleHierarchy.indexOf(userRole);
    
    if (userIndex < requiredIndex) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role permissions'
      });
    }

    next();
  };
};

// Middleware to check branch access (for managers)
export const requireBranchAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = getUserRole(req.user);
    
    // Super admins and admins have access to all branches
    if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMIN) {
      return next();
    }

    // For managers and drivers, check if they have access to the specific branch
    const branchId = req.params.branch_id || req.body.branch_id || req.query.branch_id;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID required'
      });
    }

    // Check if user is assigned to this branch (this would require extending the user model)
    // For now, we'll allow managers to access any branch
    if (userRole === ROLES.MANAGER) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Branch access denied'
    });

  } catch (error) {
    console.error('Branch access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check branch access'
    });
  }
};

// Middleware to log user actions (audit trail)
export const auditLog = (action) => {
  return async (req, res, next) => {
    try {
      const originalSend = res.json;
      
      res.json = function(data) {
        // Log the action if successful
        if (data.success !== false) {
          setTimeout(async () => {
            try {
              await dbAsync.run(`
                INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
                VALUES (?, ?, ?, ?, ?, ?)
              `, [
                req.user?.id || null,
                action,
                req.route?.path || req.path,
                req.params?.id || null,
                JSON.stringify({
                  method: req.method,
                  body: req.body,
                  query: req.query
                }),
                req.ip
              ]);
            } catch (error) {
              console.warn('Audit log failed:', error);
            }
          }, 0);
        }
        
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Audit log setup error:', error);
      next();
    }
  };
};

export default {
  ROLES,
  PERMISSIONS,
  getUserRole,
  hasPermission,
  requirePermission,
  requireRole,
  requireBranchAccess,
  auditLog
};