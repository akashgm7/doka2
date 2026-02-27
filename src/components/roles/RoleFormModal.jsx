import React, { useState, useEffect } from 'react';
import { X, Shield, Lock } from 'lucide-react';
import Button from '../ui/Button';

const RoleFormModal = ({ isOpen, onClose, onSubmit, initialData = null, permissions = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: []
    });
    const [loading, setLoading] = useState(false);

    const isEditMode = !!initialData;

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                permissions: initialData.permissions || []
            });
        } else {
            setFormData({
                name: '',
                description: '',
                permissions: []
            });
        }
    }, [initialData, isOpen]);

    const handleTogglePermission = (permissionId) => {
        setFormData(prev => {
            const current = prev.permissions;
            if (current.includes(permissionId)) {
                return { ...prev, permissions: current.filter(id => id !== permissionId) };
            } else {
                return { ...prev, permissions: [...current, permissionId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error("Form submission error", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const cat = perm.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(perm);
        return acc;
    }, {});

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-neutral-900 opacity-50"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-6 py-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Shield size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900">
                                    {isEditMode ? 'Edit Role' : 'Create New Role'}
                                </h3>
                            </div>
                            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Role Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Marketing Lead"
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={isEditMode && initialData?.isSystem}
                                    />
                                    {isEditMode && initialData?.isSystem && (
                                        <p className="mt-1 text-xs text-neutral-500 italic">System role names cannot be modified.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Description</label>
                                    <textarea
                                        rows="2"
                                        placeholder="What can this role do?"
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                                        <Lock size={16} />
                                        System Permissions
                                    </label>

                                    <div className="space-y-6 border border-neutral-200 rounded-2xl p-4 bg-neutral-50/50 max-h-[400px] overflow-y-auto">
                                        {Object.entries(groupedPermissions).map(([category, perms]) => (
                                            <div key={category} className="space-y-3">
                                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{category}</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {perms.map(perm => (
                                                        <label
                                                            key={perm.id}
                                                            className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${formData.permissions.includes(perm.id)
                                                                    ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20'
                                                                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded text-primary focus:ring-primary border-neutral-300"
                                                                checked={formData.permissions.includes(perm.id)}
                                                                onChange={() => handleTogglePermission(perm.id)}
                                                            />
                                                            <div className="ml-3 text-left">
                                                                <p className="text-sm font-semibold text-neutral-900 leading-none">{perm.label}</p>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <Button type="button" variant="secondary" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={loading}
                                >
                                    {isEditMode ? 'Save Changes' : 'Create Role'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleFormModal;
