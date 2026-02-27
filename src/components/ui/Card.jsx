import React from 'react';
import clsx from 'clsx';

const Card = ({ children, className, title, action, noPadding }) => {
    return (
        <div className={clsx(
            "bg-white rounded-2xl shadow-card border border-neutral-100/80 transition-all duration-300 hover:shadow-card-hover",
            noPadding ? "" : "p-6",
            className
        )}>
            {(title || action) && (
                <div className={clsx("flex justify-between items-center", noPadding ? "px-6 pt-5 pb-0" : "mb-5")}>
                    {title && <h3 className="text-[15px] font-semibold text-neutral-800 tracking-tight">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};

export default Card;
