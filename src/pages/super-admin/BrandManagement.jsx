import React, { useState, useEffect } from 'react';
import { brandService } from '../../services/brandService';
import { useSelector, useDispatch } from 'react-redux';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Plus, Edit2, Trash2, Search, Building2, CheckCircle, XCircle } from 'lucide-react';

const BrandManagement = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Store',
        themeColor: '#1E3A8A',
        allowsMMC: false,
        isActive: true,
        logo: ''
    });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const data = await brandService.getBrands();
            setBrands(data);
        } catch (error) {
            console.error('Failed to fetch brands', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (brand = null) => {
        if (brand) {
            setEditingBrand(brand);
            setFormData({
                name: brand.name,
                type: brand.type,
                themeColor: brand.themeColor,
                allowsMMC: brand.allowsMMC,
                isActive: brand.isActive,
                logo: brand.logo
            });
        } else {
            setEditingBrand(null);
            setFormData({
                name: '',
                type: 'Store',
                themeColor: '#1E3A8A',
                allowsMMC: false,
                isActive: true,
                logo: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingBrand) {
                await brandService.updateBrand(editingBrand.id, formData);
            } else {
                await brandService.createBrand(formData);
            }
            fetchBrands();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save brand', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this brand?')) {
            try {
                await brandService.deleteBrand(id);
                fetchBrands();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const filteredBrands = brands.filter(brand =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Brand Management</h1>
                    <p className="page-subtitle">Create and configure brands for the platform</p>
                </div>
                <Button onClick={() => handleOpenModal()} icon={Plus}>
                    Create Brand
                </Button>
            </div>

            <Card className="overflow-hidden">
                <div className="p-4 border-b border-neutral-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search brands..."
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
                                <th className="p-4 font-medium text-neutral-500 text-sm">Brand Info</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Type</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Status</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Features</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-neutral-500">Loading...</td>
                                </tr>
                            ) : filteredBrands.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-neutral-500">No brands found.</td>
                                </tr>
                            ) : (
                                filteredBrands.map((brand) => (
                                    <tr key={brand.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden">
                                                    {brand.logo ? (
                                                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Building2 className="text-neutral-400" size={20} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-900">{brand.name}</p>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <div className="w-3 h-3 rounded-full border border-neutral-200" style={{ backgroundColor: brand.themeColor }}></div>
                                                        <span className="text-xs text-neutral-500 uppercase">{brand.themeColor}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {brand.type}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {brand.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                    <CheckCircle size={12} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                                                    <XCircle size={12} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {brand.allowsMMC && (
                                                    <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded">MMC</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenModal(brand)} className="p-2 text-neutral-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(brand.id)} className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                            <h3 className="text-lg font-bold text-neutral-900">
                                {editingBrand ? 'Edit Brand' : 'Create New Brand'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Brand Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="Store">Store</option>
                                        <option value="Factory">Factory</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Theme Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="h-10 w-12 rounded cursor-pointer"
                                            value={formData.themeColor}
                                            onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                                            value={formData.themeColor}
                                            onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Logo URL (Mock)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    placeholder="https://..."
                                    value={formData.logo}
                                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-8 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium text-neutral-700">Active Status</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary"
                                        checked={formData.allowsMMC}
                                        onChange={(e) => setFormData({ ...formData, allowsMMC: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium text-neutral-700">Allow MMC</span>
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    {editingBrand ? 'Save Changes' : 'Create Brand'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandManagement;
