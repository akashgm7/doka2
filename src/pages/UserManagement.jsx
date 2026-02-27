import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setGlobalSearch } from '../features/ui/uiSlice';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Edit2, Trash2, Plus, CheckCircle, XCircle, Search, Users, UserPlus, Filter } from 'lucide-react';
import UserFormModal from '../components/users/UserFormModal';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import { canManageUser, canDeleteUser, getCreatableRoles } from '../utils/rbac';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const UserManagement = () => {
    const { user: currentUser } = useSelector((state) => state.auth);
    const searchTerm = useSelector(state => state.ui?.globalSearch || '');
    const dispatch = useDispatch();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('All');
    const [availableRoles, setAvailableRoles] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [successModal, setSuccessModal] = useState({ isOpen: false, email: '' });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null });

    useEffect(() => {
        const fetchAllData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                const effectiveUser = { ...currentUser, brandId: currentUser.brandId || currentUser.assignedBrand };
                const fetchUsers = async () => {
                    try { const data = await userService.getUsers(effectiveUser); setUsers(data || []); }
                    catch (e) { console.error("Failed to fetch users", e); setUsers([]); }
                };
                const fetchRoles = async () => {
                    try { const data = await roleService.getRoles(); setAvailableRoles(data || []); }
                    catch (e) { console.error("Failed to fetch roles", e); setAvailableRoles([]); }
                };
                await Promise.all([fetchUsers(), fetchRoles()]);
            } catch (error) {
                console.error("Unexpected error in fetchAllData", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [currentUser]);

    const fetchUsers = async () => {
        try { const data = await userService.getUsers(currentUser); setUsers(data); }
        catch (error) { console.error("Failed to refresh users", error); }
    };

    const handleCreateUser = async (formData) => {
        try {
            await userService.createUser(formData);
            fetchUsers();
            setIsModalOpen(false);
            setSuccessModal({ isOpen: true, email: formData.email });
        } catch (e) { console.error("Failed to create user", e); alert("Failed to create user"); }
    };

    const handleUpdateUser = async (formData) => {
        try {
            await userService.updateUser(editingUser._id, formData);
            fetchUsers();
            setEditingUser(null);
        } catch (e) { console.error("Failed to update user", e); alert("Failed to update user"); }
    };

    const handleDeleteUser = (userId) => { setDeleteModal({ isOpen: true, userId }); };

    const confirmDelete = async () => {
        if (!deleteModal.userId) return;
        try {
            await userService.deleteUser(deleteModal.userId);
            fetchUsers();
            setDeleteModal({ isOpen: false, userId: null });
        } catch (e) { console.error("Failed to delete user", e); }
    };

    const handleOpenCreate = () => { setEditingUser(null); setIsModalOpen(true); };
    const handleOpenEdit = (user) => { setEditingUser(user); setIsModalOpen(true); };

    const handleToggleStatus = async (user) => {
        try {
            const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
            await userService.updateUser(user._id, { status: newStatus });
            fetchUsers();
        } catch (e) { console.error("Failed to toggle status", e); }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const columns = [
        {
            header: 'User',
            render: (user) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{user.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-800 truncate">{user.name}</p>
                        <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Role',
            render: (user) => <Badge variant="primary" dot>{user.role}</Badge>
        },
        {
            header: 'Status',
            render: (user) => <Badge variant={user.status === 'Active' ? 'success' : 'neutral'} dot>{user.status}</Badge>
        },
        {
            header: 'Loyalty',
            render: (user) => (
                <span className="text-sm font-semibold text-primary">{user.loyaltyPoints ?? 0}</span>
            )
        },
        {
            header: 'Actions',
            render: (targetUser) => {
                const canEdit = canManageUser(currentUser, targetUser.role);
                const canDelete = canDeleteUser(currentUser, targetUser);
                if (!canEdit) return <span className="text-[11px] text-neutral-300 font-medium">No access</span>;
                return (
                    <div className="flex items-center gap-1">
                        <button onClick={() => handleOpenEdit(targetUser)} className="p-1.5 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary-50 transition-all" title="Edit">
                            <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleToggleStatus(targetUser)} className={`p-1.5 rounded-lg transition-all ${targetUser.status === 'Active' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-neutral-400 hover:bg-neutral-100'}`} title={targetUser.status === 'Active' ? 'Deactivate' : 'Activate'}>
                            {targetUser.status === 'Active' ? <CheckCircle size={15} /> : <XCircle size={15} />}
                        </button>
                        {canDelete && (
                            <button onClick={() => handleDeleteUser(targetUser._id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete">
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                );
            }
        }
    ];

    const canCreate = getCreatableRoles(currentUser).length > 0;
    const activeCount = users.filter(u => u.status === 'Active').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Manage system access, assign roles, and configure scopes</p>
                </div>
                {canCreate && (
                    <Button onClick={handleOpenCreate} icon={UserPlus}>Add User</Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-stagger">
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary-50 text-primary rounded-xl"><Users size={18} /></div>
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total</p>
                            <p className="text-xl font-bold text-neutral-900">{users.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Active</p>
                            <p className="text-xl font-bold text-neutral-900">{activeCount}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card hidden sm:block">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Filter size={18} /></div>
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Roles</p>
                            <p className="text-xl font-bold text-neutral-900">{availableRoles.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters + Table */}
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100/80 overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-3 p-5 border-b border-neutral-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary hover:border-neutral-300 transition-all"
                            value={searchTerm}
                            onChange={(e) => dispatch(setGlobalSearch(e.target.value))}
                        />
                    </div>
                    <select
                        className="px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary cursor-pointer bg-white hover:border-neutral-300 transition-all"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="All">All Roles</option>
                        {availableRoles.map(role => (
                            <option key={role._id} value={role.name}>{role.name}</option>
                        ))}
                    </select>
                </div>

                <Table
                    columns={columns}
                    data={filteredUsers}
                    isLoading={loading}
                    emptyMessage="No users found matching your criteria."
                />
            </div>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentUser={currentUser}
                onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                initialData={editingUser}
            />

            <ConfirmationModal
                isOpen={successModal.isOpen}
                type="success"
                title="User Created Successfully"
                message={`A temporary password has been sent to ${successModal.email}. They will be prompted to change it upon first login.`}
                confirmText="Done"
                onConfirm={() => setSuccessModal({ isOpen: false, email: '' })}
                onCancel={() => setSuccessModal({ isOpen: false, email: '' })}
            />

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                type="danger"
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
                confirmText="Delete"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, userId: null })}
            />
        </div>
    );
};

export default UserManagement;
