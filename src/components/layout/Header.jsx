import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import NotificationBell from './NotificationBell';

const Header = ({ sidebarOpen }) => {
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);

    const pathnames = location.pathname.split('/').filter((x) => x);


    return (
        <header className={`h-[72px] bg-white/80 backdrop-blur-xl border-b border-neutral-100 fixed top-0 right-0 z-40 transition-all duration-300 ${sidebarOpen ? 'left-[260px]' : 'left-[72px]'}`}>
            <div className="h-full px-8 flex items-center justify-between">
                {/* Breadcrumbs */}
                <div className="flex items-center text-sm">
                    <span className="font-medium text-neutral-400">Admin</span>
                    {pathnames.map((name, index) => {
                        const isLast = index === pathnames.length - 1;
                        return (
                            <div key={name} className="flex items-center">
                                <svg className="mx-2 w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                                <span className={`capitalize ${isLast ? 'font-semibold text-neutral-900' : 'text-neutral-500'}`}>
                                    {name.replace(/-/g, ' ')}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    <NotificationBell />

                    <div className="h-6 w-px bg-neutral-200 mx-1"></div>

                    {/* User */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-semibold text-neutral-800 leading-none">{user?.name}</div>
                            <div className="text-[11px] text-primary font-medium mt-0.5">{user?.role}</div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
