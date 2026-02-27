import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Search, CheckCircle, XCircle, Store, Layers } from 'lucide-react';
import Button from '../ui/Button';
import { brandService } from '../../services/brandService';
import { menuService } from '../../services/menuService';
import toast from 'react-hot-toast';

const StoreAvailabilityModal = ({ isOpen, onClose, item, onUpdate }) => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [availabilityMap, setAvailabilityMap] = useState({});
    const [variantAvailability, setVariantAvailability] = useState({}); // { variantId: { locId: bool } }
    const [processing, setProcessing] = useState(false);

    const { user: currentUser } = useSelector((state) => state.auth);
    const isStoreManager = currentUser?.role === 'Store Manager';

    useEffect(() => {
        if (isOpen && item) {
            console.log("Opening Availability Modal for:", item.name);
            fetchLocations();
            setAvailabilityMap(item.storeAvailability || {});

            // Initialize variant availability map
            const vMap = {};
            (item.variants || []).forEach(v => {
                const vId = v._id || v.id;
                vMap[vId] = v.storeAvailability || {};
            });
            setVariantAvailability(vMap);
        }
    }, [isOpen, item?._id]); // Use item._id to prevent unnecessary re-runs if item reference changes but same item

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const brandId = item?.brandId || currentUser?.brandId;
            let data = await brandService.getLocations(brandId);
            console.log("Fetched locations count:", data?.length);

            // Filter: Only Outlets
            data = data.filter(l => l.type === 'Outlet');

            // Defensive check for assignedOutlets
            const assigned = currentUser?.assignedOutlets || [];
            const assignedArray = Array.isArray(assigned) ? assigned : [assigned].filter(Boolean);

            // Filter: Area/Store Manager Scope
            if (isStoreManager || currentUser?.role === 'Area Manager') {
                if (assignedArray.length > 0) {
                    data = data.filter(l =>
                        assignedArray.includes(l.name) ||
                        assignedArray.includes(l.id)
                    );
                }
            }

            console.log("Filtered locations count:", data?.length);
            setLocations(data);
        } catch (error) {
            console.error("Failed to fetch locations in modal", error);
            toast.error("Error loading store locations");
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = (locationId) => {
        if (!locationId) return;
        setAvailabilityMap(prev => ({
            ...prev,
            [locationId]: !prev[locationId]
        }));
    };

    const toggleVariantAvailability = (variantId, locationId) => {
        setVariantAvailability(prev => ({
            ...prev,
            [variantId]: {
                ...(prev[variantId] || {}),
                [locationId]: !(prev[variantId]?.[locationId])
            }
        }));
    };

    const setCollectiveAvailability = (enable) => {
        const newAvailability = { ...availabilityMap };
        const newVariantAvailability = { ...variantAvailability };

        filteredLocations.forEach(location => {
            const locId = location._id || location.id;
            newAvailability[locId] = enable;

            // Also update variants for this location if enabling/disabling
            if (item.variants) {
                item.variants.forEach(variant => {
                    const vId = variant._id || variant.id;
                    if (!newVariantAvailability[vId]) {
                        newVariantAvailability[vId] = {};
                    }
                    newVariantAvailability[vId][locId] = enable;
                });
            }
        });

        setAvailabilityMap(newAvailability);
        setVariantAvailability(newVariantAvailability);
        toast.success(`${enable ? 'Enabled' : 'Disabled'} for ${filteredLocations.length} stores`);
    };

    const handleSave = async () => {
        setProcessing(true);
        try {
            // Prepare updated variants array with current availability
            const updatedVariants = (item.variants || []).map(v => {
                const vId = v._id || v.id;
                return {
                    ...v,
                    storeAvailability: {
                        ...(v.storeAvailability || {}),
                        ...(variantAvailability[vId] || {})
                    }
                };
            });

            // Sync main item availability and variants in one go
            await menuService.updateItem(item._id, {
                storeAvailability: {
                    ...(item.storeAvailability || {}),
                    ...availabilityMap
                },
                variants: updatedVariants
            });

            toast.success("Availability updated successfully");
            if (onUpdate) onUpdate();
            onClose();
        } catch (error) {
            console.error("Failed to update availability", error);
            toast.error("Failed to save changes. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen || !item) return null;

    const filteredLocations = locations.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="flex items-center justify-center min-h-screen p-4 text-center">
                <div
                    className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                />

                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transform transition-all animate-in fade-in zoom-in duration-200">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-neutral-100 flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="text-lg font-bold text-neutral-900">
                                {isStoreManager ? 'Product Availability' : 'Batch Availability Management'}
                            </h3>
                            <p className="text-sm text-neutral-500">
                                {item.name}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search & Bulk Actions */}
                    {(!isStoreManager || locations.length > 1) && (
                        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search stores..."
                                    className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                            </div>

                            <div className="flex items-center justify-between text-xs px-1">
                                <span className="text-neutral-500 font-medium">
                                    {filteredLocations.length} stores visible
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCollectiveAvailability(true)}
                                        className="text-primary hover:text-primary-dark font-bold underline underline-offset-4"
                                    >
                                        Enable All Visible
                                    </button>
                                    <span className="text-neutral-300">|</span>
                                    <button
                                        onClick={() => setCollectiveAvailability(false)}
                                        className="text-neutral-500 hover:text-neutral-700 font-bold underline underline-offset-4"
                                    >
                                        Disable All Visible
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {loading ? (
                            <div className="text-center py-8 text-neutral-500">Loading stores...</div>
                        ) : filteredLocations.length > 0 ? (
                            filteredLocations.map(location => {
                                const locId = location._id || location.id;
                                const isAvailable = !!availabilityMap[locId];
                                return (
                                    <div key={locId} className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                                            <div className="flex items-center gap-3">
                                                <Store size={18} className="text-neutral-400" />
                                                <span className="font-semibold text-neutral-900">{location.name}</span>
                                            </div>
                                        </div>

                                        {/* Main Item Toggle */}
                                        <div
                                            className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${isAvailable
                                                ? 'border-green-200 bg-green-50 hover:bg-green-100'
                                                : 'border-neutral-200 hover:bg-neutral-50'
                                                }`}
                                            onClick={() => toggleAvailability(locId)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                                    <Store size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-neutral-900">Entire Product</div>
                                                    <div className="text-xs text-neutral-500">Enable/Disable all variants for this store</div>
                                                </div>
                                            </div>
                                            <div className={isAvailable ? 'text-green-600' : 'text-neutral-400'}>
                                                {isAvailable ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                            </div>
                                        </div>

                                        {/* Variants List */}
                                        {item.variants && item.variants.length > 0 && (
                                            <div className="pl-6 space-y-2">
                                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-2">Variants (Size/Weight)</h4>
                                                {item.variants.map(variant => {
                                                    const vId = variant._id || variant.id;
                                                    const isVAvailable = !!variantAvailability[vId]?.[locId];
                                                    return (
                                                        <div
                                                            key={vId}
                                                            className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${isVAvailable
                                                                ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/50'
                                                                : 'border-neutral-100 hover:bg-neutral-50'
                                                                } ${!isAvailable ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                                                            onClick={() => toggleVariantAvailability(vId, locId)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Layers size={14} className="text-neutral-400" />
                                                                <span className="text-sm font-medium text-neutral-700">{variant.name}</span>
                                                                <span className="text-xs text-neutral-400">${variant.price?.toFixed(2)}</span>
                                                            </div>
                                                            <div className={isVAvailable ? 'text-blue-600' : 'text-neutral-400'}>
                                                                {isVAvailable ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-neutral-500">No stores found.</div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-neutral-100">
                        <Button variant="secondary" onClick={onClose} className="mr-3">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} isLoading={processing}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreAvailabilityModal;
