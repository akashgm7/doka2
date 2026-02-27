import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Trash2, Lock, Unlock } from 'lucide-react';

const SlotModal = ({ isOpen, onClose, onSave, onDelete, initialData, selectedDate }) => {
    const [formData, setFormData] = useState({
        time: '',
        capacity: 10,
        status: 'Open'
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    time: initialData.time,
                    capacity: initialData.capacity,
                    status: initialData.status
                });
            } else {
                setFormData({
                    time: '09:00',
                    capacity: 10,
                    status: 'Open'
                });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            date: selectedDate, // Ensure date is passed contextually
            ...formData,
            capacity: parseInt(formData.capacity)
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Slot' : 'Add Production Slot'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
                    <div className="px-3 py-2 bg-neutral-100 rounded-md text-neutral-600 border border-neutral-200">
                        {selectedDate || 'No date selected'}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                    />
                    <Input
                        label="Capacity"
                        type="number"
                        min="0"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        required
                    />
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <span className="text-sm font-medium text-neutral-700">Slot Status</span>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'Open' ? 'Closed' : 'Open' }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${formData.status === 'Open'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                    >
                        {formData.status === 'Open' ? <Unlock size={14} /> : <Lock size={14} />}
                        {formData.status}
                    </button>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-neutral-100">
                    {initialData && onDelete && (
                        <Button
                            type="button"
                            variant="danger"
                            onClick={() => onDelete(initialData.id)}
                            icon={Trash2}
                        >
                            Delete
                        </Button>
                    )}
                    <div className="flex-1"></div>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {initialData ? 'Save Changes' : 'Create Slot'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default SlotModal;
