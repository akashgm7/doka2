import React from 'react';

const Skeleton = ({ className = "", height, width, variant = "rect" }) => {
    const baseClass = "animate-pulse bg-neutral-200";
    const radiusClass = variant === "circle" ? "rounded-full" : "rounded-md";

    const style = {
        height: height,
        width: width,
    };

    return (
        <div
            className={`${baseClass} ${radiusClass} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;
