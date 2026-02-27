import axios from '../utils/axiosConfig';

export const PERMISSIONS = [
    { id: 'view_dashboard', label: 'View Dashboard', category: 'Dashboard' },
    { id: 'manage_users', label: 'Manage Users', category: 'Users' },
    { id: 'manage_roles', label: 'Manage Roles', category: 'Users' },
    { id: 'manage_brands', label: 'Manage Brands', category: 'System' },
    { id: 'manage_locations', label: 'Manage Locations', category: 'System' },
    { id: 'view_menu', label: 'View Menu', category: 'Menu' },
    { id: 'manage_menu', label: 'Manage Menu', category: 'Menu' },
    { id: 'view_orders', label: 'View Orders', category: 'Orders' },
    { id: 'manage_orders', label: 'Manage Orders', category: 'Orders' },
    { id: 'view_reports', label: 'View Reports', category: 'Reports' },
    { id: 'view_production', label: 'View Production', category: 'Production' },
    { id: 'manage_production', label: 'Manage Production', category: 'Production' },
];

export const roleService = {
    async getRoles() {
        const response = await axios.get('/roles');
        return response.data;
    },

    async getRoleById(id) {
        const response = await axios.get(`/roles/${id}`);
        return response.data;
    },

    async createRole(roleData) {
        const response = await axios.post('/roles', roleData);
        return response.data;
    },

    async updateRole(id, roleData) {
        const response = await axios.put(`/roles/${id}`, roleData);
        return response.data;
    },

    async deleteRole(id) {
        const response = await axios.delete(`/roles/${id}`);
        return response.data;
    },

    async getPermissions() {
        const response = await axios.get('/roles/permissions');
        return response.data;
    }
};
