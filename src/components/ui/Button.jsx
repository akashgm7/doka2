import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading,
    disabled,
    icon: Icon,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary/50 shadow-btn hover:shadow-btn-hover",
        secondary: "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus:ring-neutral-200 shadow-soft",
        danger: "bg-error text-white hover:bg-red-600 focus:ring-error shadow-btn",
        ghost: "text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-200",
        link: "text-primary hover:text-primary-dark hover:underline p-0 h-auto font-medium",
        success: "bg-success text-white hover:bg-emerald-600 focus:ring-success shadow-btn",
    };

    const sizes = {
        xs: "px-2.5 py-1.5 text-xs rounded-lg gap-1.5",
        sm: "px-3 py-2 text-xs rounded-xl gap-1.5",
        md: "px-4 py-2.5 text-sm rounded-xl gap-2",
        lg: "px-6 py-3 text-sm rounded-xl gap-2",
    };

    return (
        <button
            className={clsx(baseStyles, variants[variant], sizes[size], className)}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
            {!isLoading && Icon && <Icon className="h-4 w-4" />}
            {children}
        </button>
    );
};

export default Button;
