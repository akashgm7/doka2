import React, { useState, useEffect } from 'react';
import { Shield, Plus, ShieldCheck, Lock, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import RoleFormModal from '../../components/roles/RoleFormModal';
import { roleService } from '../../services/roleService';

const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [availablePermissions, setAvailablePermissions] = useState([]);

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            const perms = await roleService.getPermissions();
            setAvailablePermissions(perms || []);
        } catch (error) {
            console.error('Failed to fetch permissions', error);
        }
    };

    const fetchRoles = async () => {
        setLoading(true);
        try {
            setFetchError(null);
            const data = await roleService.getRoles();
            setRoles(data || []);
        } catch (error) {
            console.error('Failed to fetch roles', error);
            setFetchError(error.message || 'Could not connect to the server');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (role = null) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingRole(null);
        setIsModalOpen(false);
    };

    const handleSubmit = async (formData) => {
        try {
            if (editingRole) {
                await roleService.updateRole(editingRole._id, formData);
            } else {
                await roleService.createRole(formData);
            }
            fetchRoles();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save role', error);
            alert(error.response?.data?.message || 'Failed to save role');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this role?')) {
            try {
                await roleService.deleteRole(id);
                fetchRoles();
            } catch (error) {
                console.error('Failed to delete role', error);
                alert(error.response?.data?.message || 'Failed to delete role');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="page-title">Role Management</h1>
                    <p className="page-subtitle">Define roles and assign system permissions</p>
                </div>
                <Button onClick={() => handleOpenModal()} icon={Plus}>
                    Create Role
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fetchError && (
                    <div className="col-span-full p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                        <Shield className="w-5 h-5" />
                        <span>Error: {fetchError}. Please ensure the backend is running.</span>
                        <button onClick={fetchRoles} className="ml-auto underline font-medium">Retry</button>
                    </div>
                )}
                {loading ? (
                    <div className="col-span-full text-center py-10 text-neutral-500">Loading roles...</div>
                ) : roles.length > 0 ? (
                    roles.map((role) => (
                        <Card key={role._id} className="flex flex-col h-full card-hover">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <Shield className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(role)}
                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary-50 transition-all"
                                        >
                                            <Edit2 size={15} />
                                        </button>
                                        {!role.isSystem && (
                                            <button
                                                onClick={() => handleDelete(role._id)}
                                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-base font-bold text-neutral-800 mb-1">{role.name}</h3>
                                <p className="text-xs text-neutral-400 mb-4">{role.description || 'No description provided.'}</p>

                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                                        <Lock size={14} />
                                        <span>{role.permissions?.length || 0} Permissions Assigned</span>
                                    </div>
                                    {role.isSystem && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200/50">
                                            <ShieldCheck size={12} /> System
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-neutral-300">
                        <Shield className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900">No Roles Found</h3>
                        <p className="text-neutral-500">The role list is currently empty.</p>
                        <Button
                            variant="secondary"
                            className="mt-6"
                            onClick={() => handleOpenModal()}
                            icon={Plus}
                        >
                            Create First Role
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <RoleFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                    initialData={editingRole}
                    permissions={availablePermissions}
                />
            )}
        </div>
    );
};

export default RoleManagement;
