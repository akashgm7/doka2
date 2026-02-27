import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Map, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="mx-auto w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
                    <Map size={48} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-neutral-900">Page Not Found</h1>
                    <p className="text-neutral-500 text-lg">
                        We looked everywhere for this page. Are you sure the website URL is correct?
                    </p>
                </div>

                <div className="pt-4 flex justify-center">
                    <Button icon={ArrowLeft} onClick={() => navigate(-1)}>
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
