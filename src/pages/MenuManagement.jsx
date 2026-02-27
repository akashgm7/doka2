import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setGlobalSearch } from '../features/ui/uiSlice';
import { Plus, Search, Edit2, Trash2, MapPin, UtensilsCrossed, Tag, Package } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import ItemFormModal from '../components/menu/ItemFormModal';
import StoreAvailabilityModal from '../components/menu/StoreAvailabilityModal';
import { menuService } from '../services/menuService';

const MenuManagement = () => {
    const { user: currentUser } = useSelector((state) => state.auth);
    const searchTerm = useSelector(state => state.ui?.globalSearch || '');
    const dispatch = useDispatch();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => { if (currentUser) fetchItems(); }, [currentUser]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await menuService.getItems(currentUser?.brandId);
            setItems(Array.isArray(data) ? data : []);
        } catch (error) { console.error("Failed to fetch menu items", error); setItems([]); }
        finally { setLoading(false); }
    };

    const handleCreateItem = async (formData) => {
        try { await menuService.createItem({ ...formData, brandId: currentUser?.brandId }); fetchItems(); }
        catch (error) { console.error(error); alert("Failed to create item"); }
    };

    const handleUpdateItem = async (formData) => {
        try { await menuService.updateItem(editingItem._id, formData); fetchItems(); }
        catch (error) { console.error(error); alert("Failed to update item"); }
    };

    const handleDeleteItem = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try { await menuService.deleteItem(id); fetchItems(); }
            catch (error) { console.error("Delete failed:", error); }
        }
    };

    const handleToggleStatus = async (item) => {
        try { await menuService.updateItem(item._id, { isActive: !item.isActive }); fetchItems(); }
        catch (error) { console.error(error); }
    };

    const openCreateModal = () => { setEditingItem(null); setIsItemModalOpen(true); };
    const openEditModal = (item) => { setEditingItem(item); setIsItemModalOpen(true); };
    const openAvailabilityModal = (item) => { setEditingItem(item); setIsAvailabilityModalOpen(true); };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAreaManager = currentUser?.role === 'Area Manager';
    const isStoreManager = currentUser?.role === 'Store Manager';
    const isRestricted = isAreaManager || isStoreManager;

    const activeCount = items.filter(i => i.isActive !== false).length;

    const columns = [
        {
            header: 'Item',
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/50 shrink-0 shadow-soft">
                        {item.image ? (
                            <img
                                src={item.image && item.image.startsWith('/uploads') ? `http://${window.location.hostname}:5002${item.image}` : item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=' + item.name.charAt(0); }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                                <UtensilsCrossed size={16} className="text-primary/50" />
                            </div>
                        )}
                    </div>
                    <span className="text-sm font-semibold text-neutral-800">{item.name}</span>
                </div>
            )
        },
        {
            header: 'Price',
            render: (item) => <span className="text-sm font-bold text-neutral-800">${(item.price || item.basePrice || 0).toFixed(0)}</span>
        },
        {
            header: 'Status',
            render: (item) => (
                <button
                    disabled={isRestricted}
                    onClick={(e) => { e.stopPropagation(); if (!isRestricted) handleToggleStatus(item); }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ring-1 transition-all ${item.isActive !== false
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/50 hover:ring-emerald-300'
                        : 'bg-neutral-100 text-neutral-500 ring-neutral-200/50 hover:ring-neutral-300'
                        } ${isRestricted ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${item.isActive !== false ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                    {item.isActive !== false ? 'Active' : 'Inactive'}
                </button>
            )
        },
        {
            header: 'Availability',
            render: (item) => {
                const availableCount = Object.values(item.storeAvailability || {}).filter(v => v).length;
                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); openAvailabilityModal(item); }}
                        className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:text-primary-700 transition-colors font-semibold bg-primary-50 px-2.5 py-1 rounded-lg ring-1 ring-primary-200/50 hover:ring-primary-300"
                    >
                        <MapPin size={13} />
                        {isStoreManager ? 'Manage' : (availableCount > 0 ? `${availableCount} Stores` : 'Configure')}
                    </button>
                );
            }
        }
    ];

    if (!isRestricted) {
        columns.push({
            header: 'Actions',
            render: (item) => (
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(item); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary-50 transition-all">
                        <Edit2 size={15} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item._id); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={15} />
                    </button>
                </div>
            )
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="page-title">Menu Management</h1>
                    <p className="page-subtitle">Manage products, pricing, metadata, and availability</p>
                </div>
                {!isRestricted && <Button onClick={openCreateModal} icon={Plus}>Add Item</Button>}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 animate-stagger">
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary-50 text-primary rounded-xl"><Package size={18} /></div>
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Items</p>
                            <p className="text-xl font-bold text-neutral-900">{items.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><UtensilsCrossed size={18} /></div>
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Active</p>
                            <p className="text-xl font-bold text-neutral-900">{activeCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100/80 overflow-hidden">
                <div className="p-5 border-b border-neutral-100">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search menu items..."
                            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary hover:border-neutral-300 transition-all"
                            value={searchTerm}
                            onChange={(e) => dispatch(setGlobalSearch(e.target.value))}
                        />
                    </div>
                </div>
                <Table columns={columns} data={filteredItems} isLoading={loading} emptyMessage="No items found." onRowClick={(item) => openEditModal(item)} />
            </div>

            <ItemFormModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} initialData={editingItem} isReadOnly={isRestricted} onSubmit={editingItem ? handleUpdateItem : handleCreateItem} />
            <StoreAvailabilityModal isOpen={isAvailabilityModalOpen} onClose={() => setIsAvailabilityModalOpen(false)} item={editingItem} onUpdate={fetchItems} />
        </div>
    );
};

export default MenuManagement;
