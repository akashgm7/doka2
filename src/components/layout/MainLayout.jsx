import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100/50">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Header sidebarOpen={sidebarOpen} />
            <main
                className={`pt-[72px] transition-all duration-300 min-h-screen ${sidebarOpen ? 'pl-[260px]' : 'pl-[72px]'}`}
            >
                <div className="p-8 animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
