import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    Users,
    Target,
    ShieldCheck,
    LayoutDashboard,
    Trophy,
    Settings,
    LogOut,
    ArrowLeft,
    Menu,
    Bell
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import clsx from 'clsx';
// import { motion } from 'framer-motion';

const AdminLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { profile, signOut } = useAuthStore();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-red-500 gap-4 bg-background">
                <ShieldCheck size={48} className="text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Access Restricted</h1>
                <p className="text-muted-foreground">Admin privileges required.</p>
                <button onClick={() => navigate('/')} className="text-primary hover:underline">Return to App</button>
            </div>
        );
    }

    const navItems = [
        { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
        { label: 'Users', icon: Users, path: '/admin/users' },
        { label: 'Missions', icon: Target, path: '/admin/missions' },
        { label: 'Gamification', icon: Trophy, path: '/admin/gamification' },
        { label: 'Broadcasts', icon: Bell, path: '/admin/communication' },
        { label: 'Settings', icon: Settings, path: '/admin/settings' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className={clsx(
                "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 flex flex-col shadow-xl lg:shadow-none",
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}>
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight">Admin Console</h1>
                            <p className="text-xs text-muted-foreground font-medium">Studify OS 2.0</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="mb-6 px-2">
                        <div className="p-3 bg-secondary/50 rounded-xl border border-border flex items-center gap-3">
                            <img
                                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=random`}
                                alt="Admin"
                                className="w-10 h-10 rounded-full border border-border object-cover"
                            />
                            <div className="overflow-hidden">
                                <p className="font-semibold text-sm truncate">{profile?.full_name}</p>
                                <p className="text-xs text-primary font-medium capitalize flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    {profile?.role?.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/admin'}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <item.icon size={20} className={clsx("transition-transform group-hover:scale-110")} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-border space-y-2">
                    <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                        <ArrowLeft size={18} />
                        Back to App
                    </button>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden bg-background/50 relative">
                {/* Header */}
                <header className="h-16 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-semibold hidden sm:block">Dashboard</h2>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
