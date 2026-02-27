import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { productionService } from '../services/productionService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlotModal from '../components/production/SlotModal';
import { Plus, Calendar as CalendarIcon, Clock, Users, ChevronLeft, ChevronRight, Lock, Unlock, Power } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductionCalendar = () => {
    const { user } = useSelector(state => state.auth);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [blockedDates, setBlockedDates] = useState([]);
    const [globalSettings, setGlobalSettings] = useState({ acceptingMMCOrders: true });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);

    // Helper to get days in month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [slotsData, settingsData, blockedData] = await Promise.all([
                productionService.getProductionSlots(user.assignedFactory, currentDate),
                productionService.getGlobalSettings(),
                productionService.getBlockedDates()
            ]);
            setSlots(slotsData);
            setGlobalSettings(settingsData);
            setBlockedDates(blockedData);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load production data");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSlot = async (slotData) => {
        try {
            if (editingSlot) {
                await productionService.updateSlot(editingSlot.id, slotData);
                toast.success("Slot updated");
            } else {
                await productionService.createSlot(slotData);
                toast.success("Slot created");
            }
            setIsModalOpen(false);
            setEditingSlot(null);
            loadData(); // Reload all to be safe
        } catch (error) {
            toast.error("Failed to save slot");
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm("Are you sure you want to delete this slot?")) return;
        try {
            await productionService.deleteSlot(slotId);
            toast.success("Slot deleted");
            setIsModalOpen(false);
            setEditingSlot(null);
            loadData();
        } catch (error) {
            toast.error("Failed to delete slot");
        }
    };

    const handleToggleGlobalMMC = async () => {
        const newState = !globalSettings.acceptingMMCOrders;
        try {
            await productionService.updateGlobalSettings({ acceptingMMCOrders: newState });
            setGlobalSettings(prev => ({ ...prev, acceptingMMCOrders: newState }));
            toast.success(newState ? "MMC Orders Enabled" : "MMC Orders Disabled");
        } catch (error) {
            toast.error("Failed to update settings");
        }
    };

    const handleToggleDateBlock = async () => {
        try {
            const isBlocked = await productionService.toggleDateBlock(selectedDate);
            if (isBlocked) {
                setBlockedDates([...blockedDates, selectedDate]);
                toast.success("Date Blocked");
            } else {
                setBlockedDates(blockedDates.filter(d => d !== selectedDate));
                toast.success("Date Unblocked");
            }
        } catch (error) {
            toast.error("Failed to update date status");
        }
    };

    const handleDayClick = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
    };

    const changeMonth = (delta) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    // Filter slots for selected date
    const daySlots = slots.filter(s => s.date === selectedDate);
    const { days, firstDay } = getDaysInMonth(currentDate);
    const isSelectedDateBlocked = blockedDates.includes(selectedDate);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Production Calendar</h1>
                    <p className="text-neutral-500">Manage MMC capacity and production slots.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleToggleGlobalMMC}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${globalSettings.acceptingMMCOrders
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                    >
                        <Power size={18} />
                        {globalSettings.acceptingMMCOrders ? 'Taking Orders' : 'Orders Stopped'}
                    </button>

                    <Button
                        icon={Plus}
                        onClick={() => {
                            setEditingSlot(null);
                            setIsModalOpen(true);
                        }}
                        disabled={isSelectedDateBlocked}
                    >
                        Add Slot
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-neutral-900">
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-neutral-100 rounded-full"><ChevronLeft size={20} /></button>
                                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-neutral-100 rounded-full"><ChevronRight size={20} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-xs font-semibold text-neutral-400 py-2">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}

                            {Array.from({ length: days }).map((_, i) => {
                                const day = i + 1;
                                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const daySlots = slots.filter(s => s.date === dateStr);
                                const hasSlots = daySlots.length > 0;
                                const isBlocked = blockedDates.includes(dateStr);
                                const isSelected = selectedDate === dateStr;

                                // Logic for "Taking Orders" (Green) vs "Not Taking Orders" (Red)
                                const allSlotsFullOrClosed = hasSlots && daySlots.every(s => s.used >= s.capacity || s.status === 'Closed' || s.status === 'full');
                                const isTakingOrders = !isBlocked && hasSlots && !allSlotsFullOrClosed;
                                const isNotTakingOrders = isBlocked || (hasSlots && allSlotsFullOrClosed);

                                let bgClass = 'bg-white';
                                let borderClass = 'border-neutral-100 hover:border-neutral-300';
                                let textClass = 'text-neutral-700';

                                if (isTakingOrders) {
                                    bgClass = 'bg-green-50 hover:bg-green-100';
                                    borderClass = 'border-green-200 hover:border-green-300';
                                    textClass = 'text-green-800';
                                } else if (isNotTakingOrders) {
                                    bgClass = 'bg-red-50 hover:bg-red-100';
                                    borderClass = 'border-red-200 hover:border-red-300';
                                    textClass = 'text-red-800';
                                }

                                if (isSelected) {
                                    borderClass = 'border-primary ring-1 ring-primary';
                                    textClass = 'text-primary';
                                }

                                return (
                                    <button
                                        key={day}
                                        onClick={() => handleDayClick(day)}
                                        className={`
                                            h-24 p-2 border rounded-lg text-left transition-all relative group
                                            ${borderClass}
                                            ${bgClass}
                                        `}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`text-sm font-medium ${textClass}`}>{day}</span>
                                            {isBlocked && <Lock size={14} className="text-red-400" />}
                                            {isTakingOrders && <Unlock size={14} className="text-green-400 opacity-50" />}
                                        </div>
                                        {hasSlots && (
                                            <div className="mt-2 flex gap-1 flex-wrap">
                                                {/* Dots for slots */}
                                                {daySlots.map(s => {
                                                    const isSlotFull = s.used >= s.capacity || s.status === 'Closed' || s.status === 'full';
                                                    return (
                                                        <div
                                                            key={s.id}
                                                            className={`w-2 h-2 rounded-full ${isSlotFull ? 'bg-red-400' : 'bg-green-400'}`}
                                                            title={`${s.time} - ${isSlotFull ? 'Full/Closed' : 'Open'}`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Day Details */}
                <Card title={`Slots for ${selectedDate}`}>
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={handleToggleDateBlock}
                            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${isSelectedDateBlocked
                                ? 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                        >
                            {isSelectedDateBlocked ? 'Unblock Date' : 'Block Date'}
                        </button>
                    </div>

                    <div className="space-y-3 mt-2">
                        {isSelectedDateBlocked ? (
                            <div className="text-center py-12 text-neutral-400 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                                <Lock size={32} className="mx-auto mb-2 opacity-20" />
                                <p>Date is blocked for production.</p>
                            </div>
                        ) : daySlots.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500">
                                <CalendarIcon size={32} className="mx-auto mb-2 opacity-20" />
                                <p>No slots for this date.</p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="mt-2 text-primary"
                                    onClick={() => {
                                        setEditingSlot(null);
                                        setIsModalOpen(true);
                                    }}
                                >
                                    Create one?
                                </Button>
                            </div>
                        ) : (
                            daySlots.map(slot => (
                                <div
                                    key={slot.id}
                                    className={`
                                        p-3 border rounded-lg hover:shadow-sm transition-all flex items-center justify-between
                                        ${slot.status === 'Closed' ? 'bg-neutral-50 border-neutral-200 opacity-60' : 'bg-white border-neutral-200'}
                                    `}
                                >
                                    <div
                                        className="flex items-center gap-3 cursor-pointer flex-1"
                                        onClick={() => {
                                            setEditingSlot(slot);
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        <div className={`p-2 rounded-lg ${slot.status === 'Closed' ? 'bg-neutral-200 text-neutral-500' : 'bg-primary/10 text-primary'}`}>
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-neutral-900">{slot.time}</h4>
                                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                <Users size={12} />
                                                <span>{slot.used} / {slot.capacity} Booked</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const newStatus = slot.status === 'Open' ? 'Closed' : 'Open';
                                                try {
                                                    await productionService.updateSlot(slot.id, { status: newStatus });
                                                    toast.success(`Slot ${newStatus}`);
                                                    loadData();
                                                } catch (err) {
                                                    toast.error("Failed to update slot");
                                                }
                                            }}
                                            className={`p-1.5 rounded-md transition-colors ${slot.status === 'Open'
                                                ? 'text-green-600 hover:bg-green-50'
                                                : 'text-red-600 hover:bg-red-50'
                                                }`}
                                            title={slot.status === 'Open' ? 'Close Slot' : 'Open Slot'}
                                        >
                                            {slot.status === 'Open' ? <Unlock size={16} /> : <Lock size={16} />}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            <SlotModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveSlot}
                onDelete={handleDeleteSlot}
                initialData={editingSlot}
                selectedDate={selectedDate}
            />
        </div>
    );
};

export default ProductionCalendar;
