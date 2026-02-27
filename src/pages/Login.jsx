import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, resetError } from '../features/auth/authSlice';
import { Loader2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

    // Role-based redirect mapping
    const getDashboardPath = (role) => {
        switch (role) {
            case 'Super Admin': return '/super-admin/dashboard';
            case 'Brand Admin': return '/brand/dashboard';
            case 'Area Manager': return '/area/dashboard';
            case 'Store Manager': return '/store/dashboard';
            case 'Factory Manager': return '/factory/dashboard';
            case 'Store User': return '/orders';
            default: return '/unauthorized';
        }
    };

    const isValidRedirect = (path, role) => {
        // Prevent redirecting to role-specific namespaces if the user doesn't have that role
        if (path.includes('/super-admin') && role !== 'Super Admin') return false;
        if (path.includes('/brand') && role !== 'Brand Admin') return false;
        if (path.includes('/area') && role !== 'Area Manager') return false;
        if (path.includes('/store') && role !== 'Store Manager') return false;
        if (path.includes('/factory') && role !== 'Factory Manager') return false;
        if (path === '/unauthorized') return false; // Prevent redirect loop to unauthorized page
        return true;
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            const intendedPath = location.state?.from?.pathname;
            const defaultPath = getDashboardPath(user.role);

            // Only use intended path if it's valid for the current user's role
            const targetPath = (intendedPath && isValidRedirect(intendedPath, user.role))
                ? intendedPath
                : defaultPath;

            navigate(targetPath, { replace: true });
        }
        return () => {
            dispatch(resetError());
        };
    }, [isAuthenticated, user, navigate, location, dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email && password) {
            dispatch(login({ email, password }));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-10 transition-all duration-300 hover:shadow-primary/20">
                <div className="p-8 md:p-10">
                    <div className="text-center mb-10">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-4 transform transition-transform hover:scale-110">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-neutral-400">Sign in to access your administrative dashboard</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="group">
                                <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider mb-2 text-neutral-400">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ShieldCheck className="h-5 w-5 text-neutral-500" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        placeholder="Enter your email"
                                        className="block w-full pl-11 pr-4 py-3 bg-neutral-900/50 border border-neutral-700/80 rounded-xl text-neutral-200 placeholder:text-neutral-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 sm:text-sm shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider mb-2 text-neutral-400">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        id="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        placeholder="••••••••"
                                        className="block w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700/80 rounded-xl text-neutral-200 placeholder:text-neutral-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 sm:text-sm shadow-inner tracking-wider"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="w-full relative group overflow-hidden flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-[0_4px_20px_-4px_rgba(99,102,241,0.4)] text-sm font-semibold text-white bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-light hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-[0.98]"
                        >
                            <span className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></span>
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Sign In <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="absolute bottom-6 text-center w-full z-10 text-xs text-neutral-600">
                &copy; {new Date().getFullYear()} DOKA. Secure Admin Portal.
            </div>
        </div>
    );
};

export default Login;
