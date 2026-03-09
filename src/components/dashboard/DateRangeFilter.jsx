import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const DateRangeFilter = ({ value, onChange, customDates = {}, onCustomChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const ranges = [
        'All Time', 'Today', 'Yesterday', 'This Week',
        'This Month', 'Last Month', 'This Year',
        'Custom Date', 'Date Range'
    ];

    const handleRangeSelect = (range) => {
        onChange(range);
        if (range !== 'Custom Date' && range !== 'Date Range') {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl p-1.5 shadow-sm hover:border-primary/50 transition-all min-w-[160px]">
                    <Calendar size={16} className="text-primary ml-2" />
                    <select
                        value={value}
                        onChange={(e) => handleRangeSelect(e.target.value)}
                        className="text-sm font-semibold text-neutral-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none flex-1 appearance-none pr-8"
                    >
                        {ranges.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="text-neutral-400 absolute right-3 pointer-events-none" />
                </div>

                {(value === 'Custom Date' || value === 'Date Range') && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <input
                            type="date"
                            value={customDates.startDate || ''}
                            onChange={(e) => onCustomChange({ ...customDates, startDate: e.target.value })}
                            className="text-xs font-medium border border-neutral-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none"
                        />
                        {value === 'Date Range' && (
                            <>
                                <span className="text-neutral-400 text-xs font-bold uppercase">To</span>
                                <input
                                    type="date"
                                    value={customDates.endDate || ''}
                                    onChange={(e) => onCustomChange({ ...customDates, endDate: e.target.value })}
                                    className="text-xs font-medium border border-neutral-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none"
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DateRangeFilter;
