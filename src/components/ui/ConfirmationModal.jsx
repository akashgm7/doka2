import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import Button from './Button';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger', confirmText = 'Confirm' }) => {
    if (!isOpen) return null;

    const isDanger = type === 'danger';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={`p-6 flex justify-center ${isDanger ? 'bg-red-50' : 'bg-primary/5'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm ${isDanger ? 'bg-white text-red-500' : 'bg-white text-primary'}`}>
                        {isDanger ? <AlertTriangle size={32} /> : <Check size={32} />}
                    </div>
                </div>

                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">{title}</h3>
                    <p className="text-neutral-600 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 text-neutral-600 font-medium hover:bg-neutral-50 rounded-lg transition-colors border border-neutral-200"
                        >
                            Cancel
                        </button>
                        <Button
                            onClick={onConfirm}
                            className={`flex-1 justify-center py-3 ${isDanger ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
