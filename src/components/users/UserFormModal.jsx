import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { roleService } from '../../services/roleService';
import { brandService } from '../../services/brandService';

const UserFormModal = ({ isOpen, onClose, currentUser, onSubmit, initialData = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        brandId: '', // Added brandId to state
        assignedOutlets: [],
        assignedFactory: '',
        status: 'Active'
    });
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]);
    const [brands, setBrands] = useState([]); // New state for brands list
    const [locations, setLocations] = useState([]);

    const isEditMode = !!initialData;

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Roles
            try {
                // Safety alias for brandId
                const brandId = currentUser.brandId || currentUser.assignedBrand || formData.brandId;

                const rolesData = await roleService.getRoles();
                let visibleRoles = rolesData;
                if (currentUser.role !== 'Super Admin') {
                    if (currentUser.role === 'Brand Admin') {
                        visibleRoles = rolesData.filter(r => ['Area Manager', 'Store Manager', 'Store User', 'Factory Manager'].includes(r.name));
                    } else if (currentUser.role === 'Area Manager') {
                        visibleRoles = rolesData.filter(r => ['Store Manager', 'Store User'].includes(r.name));
                    } else {
                        visibleRoles = [];
                    }
                }
                setRoles(visibleRoles);

                // For Super Admin, fetch available brands
                if (currentUser.role === 'Super Admin') {
                    const allBrands = await brandService.getBrands();
                    setBrands(allBrands);
                }

                // Fetch Locations (Scoped to Brand if available)
                // If Super Admin has selected a brand in the form, scope to that. 
                // Otherwise if they are Brand Admin, scope to theirs.
                const effectiveBrandId = brandId;
                let locData = await brandService.getLocations(effectiveBrandId);

                if (currentUser.role === 'Area Manager' && currentUser.assignedOutlets) {
                    locData = locData.filter(l => currentUser.assignedOutlets.includes(l.name) || currentUser.assignedOutlets.includes(l.id));
                }

                setLocations(locData);

            } catch (error) {
                console.error("Failed to fetch form data", error);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen, currentUser]);

    useEffect(() => {
        if (initialData) {
            // Preservation logic: Ensure we don't drop brandId or assignedBrand
            const data = { ...initialData };
            // Unify brandId key if missing in form data state but present in model
            data.brandId = data.brandId || data.assignedBrand || '';
            setFormData(data);
        } else {
            setFormData({
                name: '',
                email: '',
                role: '',
                brandId: '',
                assignedOutlets: [],
                assignedFactory: currentUser.assignedFactory || '',
                status: 'Active'
            });
        }
    }, [initialData, isOpen, currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Auto-assign Brand ID for Brand Admin created users
        const brandId = currentUser.brandId || currentUser.assignedBrand;
        const submissionData = {
            ...formData,
            brandId: brandId || formData.brandId // Keep existing or assign current user's brand
        };

        await onSubmit(submissionData);
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    // Filter locations based on type
    const availableOutlets = locations.filter(l => l.type === 'Outlet');
    const availableFactories = locations.filter(l => l.type === 'Factory');

    // Determine the selected role's scope level
    const selectedRoleObj = roles.find(r => r.name === formData.role);
    const roleScopeLevel = selectedRoleObj ? selectedRoleObj.scopeLevel : 'None';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {isEditMode ? 'Edit User' : 'Create New User'}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <select
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value, assignedOutlets: [], assignedFactory: '' })}
                                    disabled={isEditMode && formData.role === 'Super Admin'}
                                >
                                    <option value="">Select Role</option>
                                    {roles.map(role => (
                                        <option key={role._id} value={role.name}>{role.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Brand Selection for Super Admin */}
                            {currentUser.role === 'Super Admin' && (formData.role && formData.role !== 'Super Admin') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Assign Brand</label>
                                    <select
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        value={formData.brandId || ''}
                                        onChange={(e) => setFormData({ ...formData, brandId: e.target.value, assignedOutlets: [], assignedFactory: '' })}
                                    >
                                        <option value="">Select Brand</option>
                                        {brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Location Assignment based on Role Scope */}
                            {/* Outlets: For scopes defined as Outlet */}
                            {roleScopeLevel === 'Outlet' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Assign Outlets</label>
                                    <div className="mt-1 border border-gray-300 rounded-md max-h-32 overflow-y-auto p-2 space-y-1">
                                        {availableOutlets.length > 0 ? availableOutlets.map(outlet => (
                                            <label key={outlet._id} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.assignedOutlets?.includes(outlet._id)}
                                                    onChange={(e) => {
                                                        const current = formData.assignedOutlets || [];
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, assignedOutlets: [...current, outlet._id] });
                                                        } else {
                                                            setFormData({ ...formData, assignedOutlets: current.filter(id => id !== outlet._id) });
                                                        }
                                                    }}
                                                    className="rounded text-primary focus:ring-primary"
                                                />
                                                {outlet.name}
                                            </label>
                                        )) : (
                                            <div className="text-sm text-gray-500 italic">No outlets available.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Factory: For scopes defined as Factory */}
                            {roleScopeLevel === 'Factory' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Assign Factory</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        value={formData.assignedFactory || ''}
                                        onChange={(e) => setFormData({ ...formData, assignedFactory: e.target.value })}
                                    >
                                        <option value="">Select Factory</option>
                                        {availableFactories.map(factory => (
                                            <option key={factory._id} value={factory._id}>{factory.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}



                            {/* Password Section Removed for Create/Edit */}

                            {!isEditMode && (
                                <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                                    <div className="text-blue-600 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                    </div>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium">Password Generation</p>
                                        <p className="mt-1">A temporary password will be automatically generated and sent to the user's email address upon creation.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                                <Button type="submit" isLoading={loading}>{isEditMode ? 'Update User' : 'Create User'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserFormModal;
