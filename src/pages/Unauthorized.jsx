import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                    <ShieldAlert size={48} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-neutral-900">Access Denied</h1>
                    <p className="text-neutral-500 text-lg">
                        You do not have permission to view this page. If you believe this is an error, please contact your administrator.
                    </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>
                        Go Back
                    </Button>
                    <Button icon={LayoutDashboard} onClick={() => navigate('/')}>
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
