import React from 'react';
import { Shield, Check, X, MapPin, Bell, Camera, Mic } from 'lucide-react';
import Button from './Button';

const ICONS = {
    geolocation: MapPin,
    notifications: Bell,
    camera: Camera,
    microphone: Mic,
    default: Shield
};

const PermissionModal = ({ isOpen, type, title, description, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    const Icon = ICONS[type] || ICONS.default;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-primary/5 p-6 flex justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg text-primary">
                        <Icon size={32} />
                    </div>
                </div>

                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">{title}</h3>
                    <p className="text-neutral-600 mb-8 leading-relaxed">
                        {description}
                    </p>

                    <div className="space-y-3">
                        <Button
                            onClick={onConfirm}
                            className="w-full justify-center py-3 text-lg"
                        >
                            <Check size={20} className="mr-2" />
                            Allow Access
                        </Button>
                        <button
                            onClick={onCancel}
                            className="w-full py-3 text-neutral-500 font-medium hover:text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>

                <div className="bg-neutral-50 px-6 py-4 text-xs text-center text-neutral-400 border-t border-neutral-100">
                    Your privacy is important to us. You can change this in your browser settings at any time.
                </div>
            </div>
        </div>
    );
};

export default PermissionModal;
