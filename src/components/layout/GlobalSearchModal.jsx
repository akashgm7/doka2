import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, X, ArrowRight, Package, Users, ShoppingBag, LayoutDashboard, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GlobalSearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Define searchable routes/actions
    const searchItems = [
        { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { title: 'Orders', path: '/orders', icon: ShoppingBag },
        { title: 'Menu Management', path: '/menu', icon: Package },
        { title: 'User Management', path: '/users', icon: Users },
        { title: 'Roles & Permissions', path: '/roles', icon: Settings },
        { title: 'Location Management', path: '/locations', icon: Settings },
        { title: 'Settings', path: '/settings', icon: Settings }
    ];

    // Filter items based on query
    const filteredItems = query
        ? searchItems.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
        : searchItems.slice(0, 4); // Show top 4 as default "suggestions" when empty

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Handle Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    handleSelect(filteredItems[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex, onClose]);

    const handleSelect = (item) => {
        navigate(item.path);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32">
            <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Search Input Area */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
                    <Search className="w-5 h-5 text-neutral-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search pages, settings, etc..."
                        className="flex-1 bg-transparent border-none text-neutral-800 text-lg placeholder-neutral-400 focus:outline-none focus:ring-0 py-1"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                    />
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Results Area */}
                <div className="max-h-96 overflow-y-auto p-2">
                    {filteredItems.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            {!query && (
                                <div className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                    Suggested Shortcuts
                                </div>
                            )}
                            {filteredItems.map((item, index) => (
                                <button
                                    key={item.path}
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all ${index === selectedIndex
                                            ? 'bg-primary/5 text-primary'
                                            : 'text-neutral-600 hover:bg-neutral-50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-primary/10 text-primary' : 'bg-neutral-100 text-neutral-500'
                                        }`}>
                                        <item.icon size={18} />
                                    </div>
                                    <div className="flex-1 text-left font-medium">
                                        {item.title}
                                    </div>
                                    {index === selectedIndex && (
                                        <ArrowRight size={16} className="text-primary mr-2" />
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-neutral-500">
                            <p>No results found for "{query}"</p>
                            <p className="text-sm mt-1 text-neutral-400">Try searching for "Orders" or "Settings"</p>
                        </div>
                    )}
                </div>

                {/* Footer / Instructions */}
                <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 bg-white shadow-sm font-sans font-medium text-neutral-400">↑↓</kbd>
                            to navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 bg-white shadow-sm font-sans font-medium text-neutral-400">Enter</kbd>
                            to select
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 bg-white shadow-sm font-sans font-medium text-neutral-400">Esc</kbd>
                        to close
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearchModal;
