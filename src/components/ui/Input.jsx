import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(({
    label,
    error,
    className,
    type = 'text',
    icon: Icon,
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Icon className="w-4 h-4 text-neutral-400" />
                    </div>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={clsx(
                        "w-full py-2.5 border rounded-xl shadow-soft text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 placeholder:text-neutral-400",
                        Icon ? "pl-10 pr-4" : "px-4",
                        error
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30"
                            : "border-neutral-200 focus:border-primary focus:ring-primary/10 bg-white hover:border-neutral-300",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
