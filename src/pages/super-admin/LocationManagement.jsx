import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { brandService } from '../../services/brandService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Plus, Edit2, Trash2, Search, MapPin, CheckCircle, XCircle, Navigation, AlertTriangle, Clock, Power } from 'lucide-react';
import PermissionModal from '../../components/ui/PermissionModal';
import { usePermission } from '../../hooks/usePermission';
import Badge from '../../components/ui/Badge';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks for polygon drawing
const MapEvents = ({ isAreaManager, onMapClick }) => {
    useMapEvents({
        click(e) {
            if (!isAreaManager) {
                onMapClick(e.latlng);
            }
        },
    });
    return null;
};

// Component to re-center map
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const LocationManagement = () => {
    const { user } = useSelector((state) => state.auth);
    const [locations, setLocations] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLoc, setEditingLoc] = useState(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Map State
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default: India
    const [mapZoom, setMapZoom] = useState(5);

    // Permission Hook
    const locPermission = usePermission('geolocation');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        brandId: '',
        type: 'Outlet',
        address: '',
        pincode: '',
        coordinates: { lat: 0, lng: 0 },
        status: 'Open',
        timings: { open: '09:00', close: '21:00' },
        capabilities: {
            delivery: true,
            pickup: true,
            dineIn: false
        },
        geoFence: []
    });

    const isAreaManager = user?.role === 'Area Manager';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [locData, brandData] = await Promise.all([
                    brandService.getLocations(),
                    brandService.getBrands()
                ]);

                let filteredLocs = locData;
                if (isAreaManager && user.assignedOutlets) {
                    filteredLocs = locData.filter(l => user.assignedOutlets.includes(l.name) || user.assignedOutlets.includes(l.id));
                    if (filteredLocs.length === 0 && user.assignedOutlets.length > 0) {
                        filteredLocs = locData;
                    }
                }

                setLocations(filteredLocs);
                setBrands(brandData);
                if (brandData.length > 0) {
                    setFormData(prev => ({ ...prev, brandId: brandData[0].id }));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, isAreaManager]);

    const fetchLocations = async () => {
        const data = await brandService.getLocations();
        if (isAreaManager && user.assignedOutlets) {
            setLocations(data);
        } else {
            setLocations(data);
        }
    };

    const handleOpenModal = (loc = null) => {
        setError(null);
        if (loc) {
            setEditingLoc(loc);
            setFormData({
                name: loc.name,
                brandId: loc.brandId,
                type: loc.type,
                address: loc.address,
                pincode: loc.pincode || '',
                coordinates: loc.coordinates,
                status: loc.status || 'Open',
                timings: loc.timings || { open: '09:00', close: '21:00' },
                capabilities: loc.capabilities,
                geoFence: loc.geoFence || []
            });
            // Center map on existing location if available
            if (loc.coordinates && loc.coordinates.lat && loc.coordinates.lng) {
                setMapCenter([loc.coordinates.lat, loc.coordinates.lng]);
                setMapZoom(15);
            }
        } else {
            setEditingLoc(null);
            setFormData({
                name: '',
                brandId: brands[0]?.id || '',
                type: 'Outlet',
                address: '',
                pincode: '',
                coordinates: { lat: 0, lng: 0 },
                status: 'Open',
                timings: { open: '09:00', close: '21:00' },
                capabilities: { delivery: true, pickup: true, dineIn: false },
                geoFence: []
            });
            setMapZoom(5); // Reset zoom
        }
        setIsModalOpen(true);
    };

    const [geoLoading, setGeoLoading] = useState(false);

    // Geocoding Logic
    const handleGeocode = async () => {
        // Allow searching by either Address OR Pincode (or both)
        if (!formData.address && !formData.pincode) {
            alert("Please enter Address or Pincode to locate.");
            return;
        }

        setGeoLoading(true);
        setError(null);

        // Helper function to call backend proxy
        const tryGeocode = async (addressStr, pincodeStr, zoomLevel = 16) => {
            try {
                // Call our Backend Proxy which avoids CORS/Network issues
                // Note: addressStr can be empty if we are just searching pincode
                const data = await brandService.geocodeAddress(addressStr, pincodeStr);

                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    const newLat = parseFloat(lat);
                    const newLng = parseFloat(lon);

                    setMapCenter([newLat, newLng]);
                    setMapZoom(zoomLevel);
                    setFormData(prev => ({
                        ...prev,
                        coordinates: { lat: newLat, lng: newLng }
                    }));
                    return true;
                }
                return false;
            } catch (err) {
                console.error("Geocoding service error:", err);
                throw err;
            }
        };

        try {
            // 1. Try Full Address + Pincode
            let success = false;
            try {
                success = await tryGeocode(formData.address || "", formData.pincode || "", 16);
            } catch (e) { console.warn("Primary search failed", e); }

            if (!success) {
                // 2. Fallback: Try Pincode Only (if we have one and haven't tried just it yet)
                // If the modification was to ignore address, we do:
                if (formData.pincode) {
                    try {
                        success = await tryGeocode("", formData.pincode, 13); // Wider zoom for pincode area
                        if (success) {
                            alert("Exact address not found. Loading Pincode area instead. Please adjust pin manually.");
                            return; // Exit here if successful
                        }
                    } catch (e) {
                        console.warn("Fallback pincode search failed", e);
                    }
                }

                // If we reach here, both failed
                alert("Location not found. Please move the map manually to set the location.");
            }
        } catch (err) {
            console.error("Geocoding critical failure", err);
            const msg = err.response?.data?.message || err.message;
            alert(`Failed to locate: ${msg}`);
        } finally {
            setGeoLoading(false);
        }
    };

    const handleMapClick = (latlng) => {
        setFormData(prev => ({
            ...prev,
            geoFence: [...prev.geoFence, { lat: latlng.lat, lng: latlng.lng }]
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            if (editingLoc) {
                await brandService.updateLocation(editingLoc._id, formData);
            } else {
                await brandService.createLocation(formData);
            }
            await fetchLocations();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save failed", error);
            setError(error.message || "Failed to save location");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this location?')) {
            try {
                await brandService.deleteLocation(id);
                fetchLocations();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleStatusToggle = async (loc) => {
        let nextStatus = 'Open';
        if (loc.status === 'Open') nextStatus = 'Closed';
        else if (loc.status === 'Closed') nextStatus = 'Disabled';
        else nextStatus = 'Open';

        try {
            await brandService.updateLocation(loc._id, { ...loc, status: nextStatus });
            fetchLocations();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">
                        {isAreaManager ? 'My Stores' : 'Location Management'}
                    </h1>
                    <p className="page-subtitle">
                        {isAreaManager ? 'Monitor and manage your assigned outlets' : 'Manage physical outlets, factories, and delivery zones'}
                    </p>
                </div>
                {!isAreaManager && (
                    <Button
                        onClick={() => handleOpenModal()}
                        icon={Plus}
                    >
                        Add Location
                    </Button>
                )}
            </div>

            <Card className="overflow-hidden">
                <div className="p-4 border-b border-neutral-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search locations..."
                            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-100">
                                <th className="p-4 font-medium text-neutral-500 text-sm">Location Name</th>
                                {!isAreaManager && <th className="p-4 font-medium text-neutral-500 text-sm">Brand</th>}
                                <th className="p-4 font-medium text-neutral-500 text-sm">Status</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Type</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Timings</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Capabilities</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-neutral-500">Loading...</td></tr>
                            ) : locations.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-neutral-500">No locations found.</td></tr>
                            ) : (
                                locations.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map(loc => {
                                    const brand = brands.find(b => b.id === loc.brandId);
                                    return (
                                        <tr key={loc._id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                                            <td className="p-4">
                                                <div className="font-medium text-neutral-900">{loc.name}</div>
                                                <div className="text-xs text-neutral-500 flex items-center gap-1">
                                                    <MapPin size={12} /> {loc.address}, {loc.pincode}
                                                </div>
                                            </td>
                                            {!isAreaManager && <td className="p-4 text-sm text-neutral-600">{brand?.name || 'Unknown'}</td>}
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleStatusToggle(loc)}
                                                    className="focus:outline-none"
                                                    title="Click to toggle status"
                                                >
                                                    <Badge variant={loc.status === 'Open' ? 'success' : loc.status === 'Closed' ? 'warning' : 'error'}>
                                                        {loc.status || 'Open'}
                                                    </Badge>
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loc.type === 'Factory' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {loc.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-neutral-600">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} className="text-neutral-400" />
                                                    {loc.timings ? `${loc.timings.open} - ${loc.timings.close}` : '09:00 - 21:00'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-1">
                                                    {loc.capabilities.delivery && <span title="Delivery" className="p-1 bg-green-50 text-green-700 rounded"><Navigation size={14} /></span>}
                                                    {loc.capabilities.pickup && <span title="Pickup" className="p-1 bg-blue-50 text-blue-700 rounded"><CheckCircle size={14} /></span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleOpenModal(loc)} className="p-2 text-neutral-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Edit Details/Timings">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {!isAreaManager && (
                                                        <button onClick={() => handleDelete(loc._id)} className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50 sticky top-0">
                            <h3 className="text-lg font-bold text-neutral-900">
                                {editingLoc ? 'Edit Location' : 'Register Location'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex flex-1 min-h-0">
                                {/* Left Side: Form */}
                                <div className="w-1/2 p-6 overflow-y-auto border-r border-neutral-100 space-y-6">
                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Location Name</label>
                                            <input
                                                type="text"
                                                required
                                                disabled={isAreaManager}
                                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-neutral-100"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Brand</label>
                                            <select
                                                disabled={isAreaManager}
                                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-neutral-100"
                                                value={formData.brandId}
                                                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                                            >
                                                {brands.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Status & Timings */}
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                            <Clock size={16} /> Operational Settings
                                        </h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-blue-800 mb-1">Status</label>
                                                <select
                                                    className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                >
                                                    <option value="Open">Open</option>
                                                    <option value="Closed">Closed</option>
                                                    <option value="Disabled">Disabled</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-blue-800 mb-1">Open</label>
                                                <input
                                                    type="time"
                                                    className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm"
                                                    value={formData.timings?.open}
                                                    onChange={(e) => setFormData({ ...formData, timings: { ...formData.timings, open: e.target.value } })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-blue-800 mb-1">Close</label>
                                                <input
                                                    type="time"
                                                    className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm"
                                                    value={formData.timings?.close || '21:00'}
                                                    onChange={(e) => setFormData({ ...formData, timings: { ...formData.timings, close: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                                        <select
                                            disabled={isAreaManager}
                                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-neutral-100"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="Outlet">Outlet</option>
                                            <option value="Factory">Factory</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                                        <textarea
                                            required
                                            disabled={isAreaManager}
                                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-neutral-100"
                                            rows="2"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Street, City, etc."
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Pincode</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                disabled={isAreaManager}
                                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-neutral-100"
                                                value={formData.pincode}
                                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                                placeholder="e.g. 110001"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleGeocode();
                                                    }
                                                }}
                                            />
                                            {!isAreaManager && (
                                                <button
                                                    type="button"
                                                    onClick={handleGeocode}
                                                    disabled={geoLoading}
                                                    className="px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 disabled:opacity-50 flex items-center gap-2 text-sm whitespace-nowrap"
                                                >
                                                    {geoLoading ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Search size={16} />
                                                    )}
                                                    Locate
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1">Enter address & pincode and click Locate (or press Enter).</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Capabilities</label>
                                        <div className="flex gap-4 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input disabled={isAreaManager} type="checkbox" checked={formData.capabilities.delivery} onChange={(e) => setFormData({ ...formData, capabilities: { ...formData.capabilities, delivery: e.target.checked } })} /> Delivery
                                            </label>
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input disabled={isAreaManager} type="checkbox" checked={formData.capabilities.pickup} onChange={(e) => setFormData({ ...formData, capabilities: { ...formData.capabilities, pickup: e.target.checked } })} /> Pickup
                                            </label>
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input disabled={isAreaManager} type="checkbox" checked={formData.capabilities.dineIn} onChange={(e) => setFormData({ ...formData, capabilities: { ...formData.capabilities, dineIn: e.target.checked } })} /> Dine-In
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Map */}
                                <div className="w-1/2 bg-neutral-100 relative">
                                    <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <ChangeView center={mapCenter} zoom={mapZoom} />
                                        <MapEvents isAreaManager={isAreaManager} onMapClick={handleMapClick} />

                                        {/* Main Location Marker */}
                                        {formData.coordinates.lat !== 0 && (
                                            <Marker position={[formData.coordinates.lat, formData.coordinates.lng]}>
                                                <Popup>{formData.name || 'Store Location'}</Popup>
                                            </Marker>
                                        )}

                                        {/* Geo-fence Polygon */}
                                        {formData.geoFence.length > 0 && (
                                            <Polygon positions={formData.geoFence} color="blue" />
                                        )}

                                        {/* Temporary markers for polygon points */}
                                        {formData.geoFence.map((pos, idx) => (
                                            <Marker key={idx} position={[pos.lat, pos.lng]} opacity={0.5}>
                                            </Marker>
                                        ))}
                                    </MapContainer>

                                    {!isAreaManager && (
                                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg z-[1000] text-sm">
                                            <p className="font-semibold mb-1">Geo-fencing Tools</p>
                                            <p className="text-neutral-600 mb-2">Click on the map to add boundary points for delivery area.</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-neutral-500">{formData.geoFence.length} points defined</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, geoFence: [] }))}
                                                    className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 bg-red-50 rounded"
                                                >
                                                    Clear Fence
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-neutral-100 flex justify-end gap-3 bg-neutral-50">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Saving...' : (editingLoc ? 'Save Changes' : 'Register Location')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationManagement;
