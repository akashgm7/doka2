export const ROLES = {
    SUPER_ADMIN: 'Super Admin',
    BRAND_ADMIN: 'Brand Admin',
    AREA_MANAGER: 'Area Manager',
    STORE_MANAGER: 'Store Manager',
    FACTORY_MANAGER: 'Factory Manager',
    STORE_USER: 'Store User',
};

const HIERARCHY = {
    [ROLES.SUPER_ADMIN]: 100,
    [ROLES.BRAND_ADMIN]: 80,
    [ROLES.AREA_MANAGER]: 60,
    [ROLES.FACTORY_MANAGER]: 50,
    [ROLES.STORE_MANAGER]: 40,
    [ROLES.STORE_USER]: 10,
};

// Check if current user has a specific permission string
export const hasPermission = (currentUser, permission) => {
    if (!currentUser) return false;
    // Super Admin bypasses all checks
    if (currentUser.role === ROLES.SUPER_ADMIN) return true;

    return currentUser.permissions && currentUser.permissions.includes(permission);
};

export const getCreatableRoles = (currentUser) => {
    if (!currentUser) return [];

    // Check for manage_users permission first
    if (!hasPermission(currentUser, 'manage_users')) return [];

    const currentUserRole = currentUser.role;
    switch (currentUserRole) {
        case ROLES.SUPER_ADMIN:
            return [ROLES.BRAND_ADMIN, ROLES.AREA_MANAGER, ROLES.FACTORY_MANAGER, ROLES.STORE_MANAGER, ROLES.STORE_USER];
        case ROLES.BRAND_ADMIN:
            return [ROLES.AREA_MANAGER, ROLES.FACTORY_MANAGER, ROLES.STORE_MANAGER, ROLES.STORE_USER];
        case ROLES.AREA_MANAGER:
            return [ROLES.STORE_MANAGER, ROLES.STORE_USER];
        case ROLES.STORE_MANAGER:
            return [ROLES.STORE_USER];
        case ROLES.FACTORY_MANAGER:
            return [ROLES.STORE_USER];
        default:
            return [];
    }
};

export const canManageUser = (currentUser, targetUserRole) => {
    if (!currentUser || !targetUserRole) return false;

    // Check permission first
    if (!hasPermission(currentUser, 'manage_users')) return false;

    const currentLevel = HIERARCHY[currentUser.role] || 0;
    const targetLevel = HIERARCHY[targetUserRole] || 0;

    // Super Admin can manage anyone including other Super Admins
    if (currentUser.role === ROLES.SUPER_ADMIN) return true;

    // Hierarchy rule: only manage those strictly lower than you
    return currentLevel > targetLevel;
};

export const canDeleteUser = (currentUser, targetUser) => {
    return canManageUser(currentUser, targetUser.role);
}
