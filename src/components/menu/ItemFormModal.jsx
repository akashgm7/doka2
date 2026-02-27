import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import Button from '../ui/Button';
import { uploadService } from '../../services/uploadService';

const ItemFormModal = ({ isOpen, onClose, initialData, onSubmit, isReadOnly = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'General',
        price: '',
        description: '',
        isActive: true,
        metadata: {
            ingredients: [],
            allergens: [],
            calories: ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const isEditMode = !!initialData;

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                price: initialData.basePrice || initialData.price || '',
                metadata: {
                    ingredients: initialData.ingredients || [],
                    allergens: initialData.allergens || [],
                    calories: initialData.calories || ''
                }
            });
            const img = initialData.image;
            setPreviewUrl(img && img.startsWith('/uploads') ? `http://${window.location.hostname}:5002${img}` : img);
        } else {
            setFormData({
                name: '',
                category: 'General',
                price: '',
                description: '',
                isActive: true,
                image: '',
                metadata: {
                    ingredients: [],
                    allergens: [],
                    calories: ''
                }
            });
            setPreviewUrl(null);
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Map price back to basePrice for backend
        const submissionData = {
            ...formData,
            price: parseFloat(formData.price),
            basePrice: parseFloat(formData.price), // Keep for legacy if needed
            ingredients: formData.metadata.ingredients,
            allergens: formData.metadata.allergens,
            calories: formData.metadata.calories ? parseFloat(formData.metadata.calories) : undefined
        };
        // Clean up metadata object before sending
        delete submissionData.metadata;

        try {
            await onSubmit(submissionData);
            onClose();
        } catch (error) {
            console.error("Submit failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show immediate local preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const result = await uploadService.uploadImage(file);
            setFormData(prev => ({ ...prev, image: result.url }));
            setPreviewUrl(`http://${window.location.hostname}:5002${result.url}`);
        } catch (error) {
            console.error("Image upload failed", error);
            alert("Failed to upload image");
            setPreviewUrl(formData.image || null);
        } finally {
            setUploading(false);
        }
    };

    const handleMetadataChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                [field]: value
            }
        }));
    };

    const addTag = (field, tag) => {
        if (!tag) return;
        const currentTags = formData.metadata[field] || [];
        if (!currentTags.includes(tag)) {
            handleMetadataChange(field, [...currentTags, tag]);
        }
    };

    const removeTag = (field, tag) => {
        const currentTags = formData.metadata[field] || [];
        handleMetadataChange(field, currentTags.filter(t => t !== tag));
    };

    // Helper for tag inputs
    const TagInput = ({ label, field, placeholder }) => {
        const [input, setInput] = useState('');

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag(field, input);
                setInput('');
            }
        };

        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                {!isReadOnly && (
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                            placeholder={placeholder}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            type="button"
                            onClick={() => { addTag(field, input); setInput(''); }}
                            className="px-3 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                )}
                <div className="flex flex-wrap gap-2">
                    {(formData.metadata?.[field] || []).map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-dark">
                            {tag}
                            {!isReadOnly && (
                                <button
                                    type="button"
                                    onClick={() => removeTag(field, tag)}
                                    className="text-primary-dark/70 hover:text-primary-dark"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {isReadOnly ? 'Item Details' : (isEditMode ? 'Edit Item' : 'Create New Item')}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={isReadOnly}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        disabled={isReadOnly}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Product Image</label>
                                    <div className="mt-1 flex items-center gap-4">
                                        <div className="flex-1 relative">
                                            <input
                                                type="file"
                                                id="image-upload"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                                disabled={isReadOnly || uploading}
                                            />
                                            <label
                                                htmlFor="image-upload"
                                                className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-neutral-50 transition-all ${isReadOnly || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Upload size={18} className="text-neutral-500" />
                                                <span className="text-sm text-neutral-600">
                                                    {uploading ? 'Uploading...' : 'Click to upload image'}
                                                </span>
                                            </label>
                                        </div>
                                        <div className="w-16 h-16 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50 flex-shrink-0">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                    <Trash2 size={24} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-1 text-xs text-neutral-500">Supported: JPG, PNG, WebP</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
                                    rows="2"
                                    disabled={isReadOnly}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <hr className="my-4 border-neutral-200" />
                            <h4 className="text-sm font-semibold text-neutral-900">Product Metadata</h4>

                            <div className="space-y-4">
                                <TagInput
                                    label="Ingredients"
                                    field="ingredients"
                                    placeholder="Add ingredient (e.g. Flour) and press Enter"
                                />
                                <TagInput
                                    label="Allergens"
                                    field="allergens"
                                    placeholder="Add allergen (e.g. Nuts) and press Enter"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Calories (kcal)</label>
                                    <input
                                        type="number"
                                        disabled={isReadOnly}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
                                        value={formData.metadata?.calories || ''}
                                        onChange={(e) => handleMetadataChange('calories', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
                                <Button type="button" variant="secondary" onClick={onClose}>
                                    {isReadOnly ? 'Close' : 'Cancel'}
                                </Button>
                                {!isReadOnly && (
                                    <Button type="submit" isLoading={loading}>
                                        {isEditMode ? 'Update Item' : 'Create Item'}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemFormModal;
