import React from 'react';
import { Calendar } from 'lucide-react';

const DateRangeFilter = ({ value, onChange }) => {
    return (
        <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg p-1.5 shadow-sm">
            <Calendar size={16} className="text-neutral-500 ml-2" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="text-sm font-medium text-neutral-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
            >
                <option value="All Time">All Time</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
                <option value="This Year">This Year</option>
            </select>
        </div>
    );
};

export default DateRangeFilter;
