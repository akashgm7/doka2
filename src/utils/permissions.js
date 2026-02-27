// Define resources
export const RESOURCES = {
    USER: 'user',
    MENU: 'menu',
    ORDER: 'order',
    STORE: 'store',
    PRODUCTION: 'production',
    REPORT: 'report'
};

// Define actions
export const ACTIONS = {
    READ: 'read',
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage' // catch-all for broad administrative rights
};

// Permission Map
// Role -> Resource -> Actions allowed
const PERMISSIONS = {
    'Super Admin': {
        [RESOURCES.USER]: [ACTIONS.MANAGE],
        [RESOURCES.MENU]: [ACTIONS.MANAGE],
        [RESOURCES.ORDER]: [ACTIONS.MANAGE],
        [RESOURCES.STORE]: [ACTIONS.MANAGE],
        [RESOURCES.PRODUCTION]: [ACTIONS.MANAGE],
        [RESOURCES.REPORT]: [ACTIONS.MANAGE]
    },
    'Brand Admin': {
        [RESOURCES.USER]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE], // Can't delete indiscriminately (logic handled in service too)
        [RESOURCES.MENU]: [ACTIONS.READ, ACTIONS.UPDATE], // Update brand availability
        [RESOURCES.ORDER]: [ACTIONS.READ, ACTIONS.UPDATE],
        [RESOURCES.STORE]: [ACTIONS.READ, ACTIONS.UPDATE],
        [RESOURCES.PRODUCTION]: [ACTIONS.MANAGE],
        [RESOURCES.REPORT]: [ACTIONS.READ]
    },
    'Area Manager': {
        [RESOURCES.USER]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE],
        [RESOURCES.MENU]: [ACTIONS.READ, ACTIONS.UPDATE], // Update outlet availability
        [RESOURCES.ORDER]: [ACTIONS.READ, ACTIONS.UPDATE],
        [RESOURCES.STORE]: [ACTIONS.READ, ACTIONS.UPDATE],
        [RESOURCES.PRODUCTION]: [ACTIONS.READ]
    },
    'Store Manager': {
        [RESOURCES.USER]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE],
        [RESOURCES.MENU]: [ACTIONS.READ, ACTIONS.UPDATE],
        [RESOURCES.ORDER]: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.CREATE],
        [RESOURCES.STORE]: [ACTIONS.READ, ACTIONS.UPDATE], // Open/Close
        [RESOURCES.PRODUCTION]: [ACTIONS.READ]
    },
    'Factory Manager': {
        [RESOURCES.USER]: [ACTIONS.READ],
        [RESOURCES.MENU]: [ACTIONS.READ],
        [RESOURCES.ORDER]: [ACTIONS.READ],
        [RESOURCES.PRODUCTION]: [ACTIONS.MANAGE] // Full slots control
    }
};

export const checkPermission = (role, resource, action) => {
    if (!role) return false;

    // Super Admin has god mode generally, but strict map check is safer and cleaner
    const rolePermissions = PERMISSIONS[role];
    if (!rolePermissions) return false;

    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions) return false;

    if (resourcePermissions.includes(ACTIONS.MANAGE)) return true;
    return resourcePermissions.includes(action);
};
