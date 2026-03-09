import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Real Permission Guard
 * 
 * Checks if the user has a specific permission string.
 * Also supports the legacy 'allowedRoles' check for partial migration.
 */
const RoleGuard = ({ allowedRoles, allowedScopes, permission, children }) => {
    const { user } = useSelector((state) => state.auth);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 1. Permission-based check
    const isSuperAdmin = user.scopeLevel === 'System' || user.role === 'Super Admin';
    const hasRequiredPermission = permission && Array.isArray(user.permissions) && user.permissions.includes(permission);
    const hasRequiredRole = allowedRoles && allowedRoles.includes(user.role);
    const hasRequiredScope = allowedScopes && allowedScopes.includes(user.scopeLevel);

    let isAuthorized = isSuperAdmin || hasRequiredPermission || (allowedRoles && hasRequiredRole) || (allowedScopes && hasRequiredScope) || (!permission && !allowedRoles && !allowedScopes);

    // If permission was strictly requested but they don't have it
    if (permission && !isAuthorized) {
        console.warn(`Access Denied: User '${user.email}' lacks permission '${permission}'`);
        return <Navigate to="/unauthorized" replace />;
    }

    // Role or Scope fallback checks
    if (!isSuperAdmin) {
        const strictRoleCheckFailed = allowedRoles && !allowedRoles.includes(user.role);
        const strictScopeCheckFailed = allowedScopes && !allowedScopes.includes(user.scopeLevel);

        if (allowedScopes && strictScopeCheckFailed) {
            console.warn(`Access Denied: User scopeLevel '${user.scopeLevel}' not in allowed list`);
            return <Navigate to="/unauthorized" replace />;
        } else if (!allowedScopes && allowedRoles && strictRoleCheckFailed) {
            console.warn(`Access Denied: User role '${user.role}' not in allowed list`);
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children ? children : <Outlet />;
};

export default RoleGuard;
