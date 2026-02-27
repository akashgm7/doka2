import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Real Permission Guard
 * 
 * Checks if the user has a specific permission string.
 * Also supports the legacy 'allowedRoles' check for partial migration.
 */
const RoleGuard = ({ allowedRoles, permission, children }) => {
    const { user } = useSelector((state) => state.auth);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 1. Permission-based check (The Primary implementation)
    const isSuperAdmin = user.role === 'Super Admin';
    const hasRequiredPermission = permission && Array.isArray(user.permissions) && user.permissions.includes(permission);
    const hasRequiredRole = allowedRoles && allowedRoles.includes(user.role);

    const isAuthorized = isSuperAdmin || hasRequiredPermission || (allowedRoles && hasRequiredRole) || (!permission && !allowedRoles);

    // If a permission was specifically requested and they don't have it (and not super admin), AND no fallback role matches
    if (permission && !isAuthorized) {
        console.warn(`Access Denied: User '${user.email}' lacks permission '${permission}'`);
        return <Navigate to="/unauthorized" replace />;
    }

    // Role-based fallback
    if (!permission && allowedRoles && !isAuthorized) {
        console.warn(`Access Denied: User role '${user.role}' not in allowed list [${allowedRoles.join(', ')}]`);
        return <Navigate to="/unauthorized" replace />;
    }
    // 2. Fallback to Role-based check (Legacy - for compatibility)
    else if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'Super Admin') {
        console.warn(`Access Denied: User role '${user.role}' not in allowed list [${allowedRoles.join(', ')}]`);
        return <Navigate to="/unauthorized" replace />;
    }

    return children ? children : <Outlet />;
};

export default RoleGuard;
