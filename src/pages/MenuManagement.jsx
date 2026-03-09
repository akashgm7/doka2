import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Search, Edit2, Trash2, MapPin, UtensilsCrossed, Tag, Package, FilterX, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table, { Pagination } from '../components/ui/Table';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import ItemFormModal from '../components/menu/ItemFormModal';
import StoreAvailabilityModal from '../components/menu/StoreAvailabilityModal';
import { menuService } from '../services/menuService';
import useDebounce from '../hooks/useDebounce';

const MenuManagement = () => {
    const { user: currentUser } = useSelector((state) => state.auth);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [dietaryFilter, setDietaryFilter] = useState('All');
    const dispatch = useDispatch();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(true);

    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Table specific state
    const [selectedItems, setSelectedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, type: 'danger' });

    useEffect(() => { if (currentUser) fetchItems(); }, [currentUser]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await menuService.getItems(currentUser?.brandId);
            setItems(Array.isArray(data) ? data : []);
            // setSelectedItems([]);
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

    const handleDeleteItem = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Item',
            message: 'Are you sure you want to delete this menu item? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete',
            action: async () => {
                try { await menuService.deleteItem(id); fetchItems(); }
                catch (error) { console.error("Delete failed:", error); }
            }
        });
    };

    const handleToggleStatus = async (item) => {
        try { await menuService.updateItem(item._id, { isActive: !item.isActive }); fetchItems(); }
        catch (error) { console.error(error); }
    };

    const handleBulkDelete = () => {
        if (selectedItems.length === 0) return;
        setConfirmModal({
            isOpen: true,
            title: 'Bulk Delete Items',
            message: `Are you sure you want to delete ${selectedItems.length} selected item(s)? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete All',
            action: async () => {
                try {
                    await Promise.all(selectedItems.map(id => menuService.deleteItem(id)));
                    setSelectedItems([]);
                    fetchItems();
                } catch (error) {
                    console.error("Bulk delete failed:", error);
                }
            }
        });
    };

    const handleBulkToggleStatus = (statusToSet) => {
        if (selectedItems.length === 0) return;
        setConfirmModal({
            isOpen: true,
            title: `Bulk ${statusToSet ? 'Activate' : 'Deactivate'} Items`,
            message: `Are you sure you want to ${statusToSet ? 'activate' : 'deactivate'} ${selectedItems.length} selected item(s)?`,
            type: statusToSet ? 'primary' : 'danger',
            confirmText: statusToSet ? 'Activate All' : 'Deactivate All',
            action: async () => {
                try {
                    await Promise.all(selectedItems.map(id => menuService.updateItem(id, { isActive: statusToSet })));
                    setSelectedItems([]);
                    fetchItems();
                } catch (error) {
                    console.error("Bulk status update failed:", error);
                }
            }
        });
    };

    const openCreateModal = () => { setEditingItem(null); setIsItemModalOpen(true); };
    const openEditModal = (item) => { setEditingItem(item); setIsItemModalOpen(true); };
    const openAvailabilityModal = (item) => { setEditingItem(item); setIsAvailabilityModalOpen(true); };

    // Reset page to 1 on filter changes
    useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, categoryFilter, dietaryFilter]);

    const filteredItems = items.filter(item => {
        const matchesSearch = (item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        const matchesDietary = dietaryFilter === 'All' || item.dietary === dietaryFilter;
        return matchesSearch && matchesCategory && matchesDietary;
    });

    // Pagination slice
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const isAreaManager = currentUser?.role === 'Area Manager';
    const isStoreManager = currentUser?.role === 'Store Manager';
    const isRestricted = isAreaManager || isStoreManager;

    const activeCount = items.filter(i => i.isActive !== false).length;

    const columns = [
        {
            header: 'Item',
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/50 shrink-0 shadow-soft relative group">
                        {item.image ? (
                            <img
                                src={item.image && item.image.startsWith('/uploads') ? `http://${window.location.hostname}:5002${item.image}` : item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=' + item.name.charAt(0); }}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100/50">
                                <Package size={18} className="text-primary/40" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-neutral-800">{item.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-neutral-400 font-medium px-1.5 py-0.5 bg-neutral-50 rounded border border-neutral-100">{item.category}</span>
                            {item.dietary && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${item.dietary === 'Eggless' ? 'text-green-600 bg-green-50 border-green-100' :
                                    item.dietary === 'Egg' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                        'text-neutral-400 bg-neutral-50 border-neutral-100'
                                    }`}>
                                    {item.dietary === 'Egg' ? 'With Egg' : item.dietary}
                                </span>
                            )}
                        </div>
                    </div>
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
                        className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:text-primary-700 transition-colors font-semibold bg-primary-50 px-2.5 py-1 rounded-lg ring-1 ring-primary-200/50 hover:ring-primary-300 group"
                    >
                        <MapPin size={13} className="group-hover:animate-bounce-slow" />
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

    const categories = ['All', 'Cakes', 'Pastries', 'MMC', 'General'];
    const dietaryOptions = ['All', 'Eggless', 'Egg', 'N/A'];

    const emptyIconSVG = (
        <div className="mb-4 text-neutral-300 transform scale-125">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <rect x="3" y="8" width="18" height="12" rx="2" ry="2"></rect>
                <path d="M7 8v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path>
                <path d="M12 12v.01"></path>
                <path d="M12 16v.01"></path>
            </svg>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="page-title">Menu Management</h1>
                    <p className="page-subtitle">Manage products, pricing, metadata, and availability</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                    {!isRestricted && <Button onClick={openCreateModal} icon={Plus}>Add Item</Button>}
                </div>
            </div>

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

            <div className="bg-white rounded-2xl shadow-card border border-neutral-100/80 overflow-hidden">
                <div className="p-5 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search menu items..."
                            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary hover:border-neutral-300 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {selectedItems.length > 0 && !isRestricted && (
                        <div className="flex items-center gap-2 bg-primary/5 p-1.5 rounded-xl border border-primary/20 animate-in fade-in zoom-in-95 duration-200">
                            <span className="text-[11px] font-bold text-primary px-3 uppercase tracking-wider">{selectedItems.length} selected</span>
                            <div className="h-6 w-px bg-primary/20 mx-1"></div>
                            <button onClick={() => handleBulkToggleStatus(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100/50 transition-colors" title="Activate Selected">
                                <CheckCircle size={14} /> Active
                            </button>
                            <button onClick={() => handleBulkToggleStatus(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-neutral-600 hover:bg-neutral-200/50 transition-colors" title="Deactivate Selected">
                                <AlertCircle size={14} /> Inactive
                            </button>
                            <div className="h-6 w-px bg-primary/20 mx-1"></div>
                            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-100/50 transition-colors" title="Delete Selected">
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>

                {showFilters && (
                    <div className="px-5 pb-5 border-b border-neutral-100/80 animate-slide-down">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider w-16 shrink-0 md:mt-0 mt-2">Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`px-3 py-1.5 rounded-full text-[11px] tracking-wide font-semibold transition-all ${categoryFilter === cat ? 'bg-primary text-white shadow-soft' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                                        >
                                            {cat === 'All' ? 'All Categories' : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider w-16 shrink-0 md:mt-0 mt-2">Dietary</label>
                                <div className="flex flex-wrap gap-2">
                                    {dietaryOptions.map(diet => (
                                        <button
                                            key={diet}
                                            onClick={() => setDietaryFilter(diet)}
                                            className={`px-3 py-1.5 rounded-full text-[11px] tracking-wide font-semibold transition-all ${dietaryFilter === diet ? 'bg-primary text-white shadow-soft' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                                        >
                                            {diet === 'All' ? 'All Dietary' : (diet === 'Egg' ? 'With Egg' : diet)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <Table
                        columns={columns}
                        data={paginatedItems}
                        isLoading={loading}
                        emptyMessage="We couldn't find any menu items matching your criteria."
                        emptyIcon={emptyIconSVG}
                        emptyAction={<Button variant="secondary" onClick={() => { setSearchTerm(''); setCategoryFilter('All'); setDietaryFilter('All'); }} icon={FilterX}>Clear Filters</Button>}
                        selectable={!isRestricted}
                        selectedIds={selectedItems}
                        onSelectionChange={setSelectedItems}
                        onRowClick={(item) => !isRestricted && openEditModal(item)}
                    />
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden block p-4 space-y-4 bg-neutral-50/50">
                    {loading ? (
                        <div className="flex justify-center p-8 text-neutral-400"><Package className="animate-pulse" /></div>
                    ) : paginatedItems.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            {emptyIconSVG}
                            <p className="text-neutral-500 font-medium text-sm mb-4">No menu items found.</p>
                            <Button variant="secondary" onClick={() => { setSearchTerm(''); setCategoryFilter('All'); setDietaryFilter('All'); }} icon={FilterX}>Clear Filters</Button>
                        </div>
                    ) : (
                        paginatedItems.map(item => (
                            <div key={item._id} className="bg-white p-4 rounded-xl border border-neutral-200/60 shadow-sm relative transition-all active:scale-[0.98]" onClick={() => !isRestricted && openEditModal(item)}>
                                {!isRestricted && (
                                    <div className="absolute top-3 right-3 z-10" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded text-primary focus:ring-primary border-neutral-300 transition-colors"
                                            checked={selectedItems.includes(item._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedItems([...selectedItems, item._id]);
                                                else setSelectedItems(selectedItems.filter(id => id !== item._id));
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="flex gap-4 items-center">
                                    <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-neutral-100 shrink-0 shadow-sm border border-neutral-100">
                                        {item.image ? (
                                            <img src={item.image.startsWith('/uploads') ? `http://${window.location.hostname}:5002${item.image}` : item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col justify-center items-center bg-primary-50">
                                                <Package size={24} className="text-primary/40" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1 pl-1">
                                        <h4 className="font-bold text-neutral-800 text-sm line-clamp-1 pr-6">{item.name}</h4>
                                        <span className="text-[11px] text-neutral-500 mt-1 font-medium">{item.category} {item.dietary && `• ${item.dietary === 'Egg' ? 'With Egg' : item.dietary}`}</span>
                                        <div className="flex items-center justify-between mt-2.5">
                                            <span className="font-bold text-primary text-sm">${(item.price || item.basePrice || 0).toFixed(0)}</span>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${item.isActive !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-neutral-50 text-neutral-500 border-neutral-200'}`}>
                                                {item.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t border-neutral-100 bg-white">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>

            <ItemFormModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} initialData={editingItem} isReadOnly={isRestricted} onSubmit={editingItem ? handleUpdateItem : handleCreateItem} />
            <StoreAvailabilityModal isOpen={isAvailabilityModalOpen} onClose={() => setIsAvailabilityModalOpen(false)} item={editingItem} onUpdate={fetchItems} />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                onConfirm={() => {
                    if (confirmModal.action) confirmModal.action();
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
        </div>
    );
};

export default MenuManagement;
