import React, { useEffect, useState } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';

const BrandSwitcher = ({ selectedBrand, onBrandChange }) => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const data = await dashboardService.getBrands();
                setBrands(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchBrands();
    }, []);

    if (loading) return <div className="h-10 w-32 bg-neutral-100 rounded animate-pulse" />;

    return (
        <div className="relative group">
            <div className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-neutral-800 transition-colors">
                <Building2 size={16} />
                <span className="text-sm font-medium">
                    {selectedBrand ? brands.find(b => b.id === selectedBrand)?.name : 'All Brands'}
                </span>
                <ChevronDown size={14} className="text-neutral-400 group-hover:text-white transition-colors" />
            </div>

            {/* Dropdown would go here - implemented as simple select for now for reliability */}
            <select
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                value={selectedBrand || ''}
                onChange={(e) => onBrandChange(e.target.value || null)}
            >
                <option value="">All Brands</option>
                {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
            </select>
        </div>
    );
};

export default BrandSwitcher;
