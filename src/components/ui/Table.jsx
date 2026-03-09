import React from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';

const Table = ({ columns, data, isLoading, emptyMessage = "No data found.", emptyIcon, emptyAction, onRowClick, selectable, selectedIds = [], onSelectionChange }) => {
    if (isLoading) {
        return (
            <div className="w-full flex flex-col justify-center items-center py-16 text-neutral-400">
                <Loader2 className="animate-spin mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Loading data...</span>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-16 text-neutral-400 animate-in fade-in duration-300">
                {emptyIcon ? emptyIcon : <Inbox className="w-12 h-12 mb-4 text-neutral-300 animate-bounce-slow" />}
                <span className="text-base font-medium text-neutral-600 mb-1">{emptyMessage}</span>
                {emptyAction && <div className="mt-4">{emptyAction}</div>}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-neutral-100 shadow-soft bg-white">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-neutral-100">
                        {selectable && (
                            <th scope="col" className="px-5 py-3.5 w-12 text-left bg-neutral-50/50">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded text-primary focus:ring-primary border-neutral-300 cursor-pointer"
                                    checked={data.length > 0 && selectedIds.length === data.length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            onSelectionChange(data.map(row => row.id || row._id));
                                        } else {
                                            onSelectionChange([]);
                                        }
                                    }}
                                />
                            </th>
                        )}
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                scope="col"
                                className={clsx(
                                    "px-5 py-3.5 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider whitespace-nowrap bg-neutral-50/50",
                                    col.className
                                )}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                    {data.map((row, rowIndex) => (
                        <tr
                            key={row.id || row._id || rowIndex}
                            onClick={() => onRowClick && onRowClick(row)}
                            className={clsx(
                                "transition-colors duration-150 hover:bg-primary-50/30",
                                onRowClick && "cursor-pointer"
                            )}
                        >
                            {selectable && (
                                <td className="px-5 py-3.5 w-12" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded text-primary focus:ring-primary border-neutral-300 cursor-pointer"
                                        checked={selectedIds.includes(row.id || row._id)}
                                        onChange={(e) => {
                                            const id = row.id || row._id;
                                            if (e.target.checked) {
                                                onSelectionChange([...selectedIds, id]);
                                            } else {
                                                onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
                                            }
                                        }}
                                    />
                                </td>
                            )}
                            {columns.map((col, colIndex) => (
                                <td key={colIndex} className="px-5 py-3.5 whitespace-nowrap text-sm text-neutral-600">
                                    {col.render ? col.render(row) : (col.accessor && typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <div className="flex items-center justify-between px-1 py-4">
            <p className="text-sm text-neutral-500">
                Page <span className="font-semibold text-neutral-700">{currentPage}</span> of <span className="font-semibold text-neutral-700">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors disabled:opacity-40"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={clsx(
                            "min-w-[36px] h-9 rounded-xl text-sm font-semibold transition-all duration-200",
                            currentPage === page
                                ? "bg-primary text-white shadow-btn-hover"
                                : "text-neutral-600 hover:bg-neutral-100"
                        )}
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors disabled:opacity-40"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
