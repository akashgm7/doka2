import React from 'react';
import Button from './Button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                            <AlertTriangle size={48} />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-neutral-900">Something went wrong</h1>
                            <p className="text-neutral-500">
                                The application encountered an unexpected error.
                            </p>
                            {this.state.error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm font-mono rounded-md text-left overflow-auto max-h-32">
                                    {this.state.error.toString()}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex justify-center gap-3">
                            <Button icon={RefreshCw} onClick={() => window.location.reload()}>
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
