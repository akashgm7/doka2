import React from 'react';
import clsx from 'clsx';

const Badge = ({ children, variant = 'neutral', className, dot }) => {
    const variants = {
        primary: "bg-primary-50 text-primary-700 ring-1 ring-primary-200/50",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
        error: "bg-red-50 text-red-700 ring-1 ring-red-200/50",
        neutral: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/50",
        info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/50",
    };

    const dotColors = {
        primary: "bg-primary",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        error: "bg-red-500",
        neutral: "bg-neutral-400",
        info: "bg-sky-500",
    };

    return (
        <span className={clsx(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide",
            variants[variant],
            className
        )}>
            {dot && <span className={clsx("w-1.5 h-1.5 rounded-full", dotColors[variant])} />}
            {children}
        </span>
    );
};

export default Badge;
