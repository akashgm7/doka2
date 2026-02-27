import React from 'react';
import { useSelector } from 'react-redux';
import { checkPermission } from '../../utils/permissions';

// Usage: <PermissionGate resource="user" action="delete"> <DeleteButton /> </PermissionGate>
// If fallback is provided, renders that instead of null when unauthorized.
const PermissionGate = ({ children, resource, action, fallback = null }) => {
    const { user } = useSelector(state => state.auth);

    if (!user) return fallback;

    const hasPermission = checkPermission(user.role, resource, action);

    if (!hasPermission) {
        return fallback;
    }

    return <>{children}</>;
};

export default PermissionGate;
