import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Target,
    Zap,
    Trophy,
    Briefcase,
    Users,
    LogOut,
    Menu,
    X,
    Activity,
    Settings,
    LineChart,
    Book,
    Calendar,
    Search,
    ShieldCheck,
    MessageCircle
} from 'lucide-react';
import CommandPalette from './CommandPalette';
import clsx from 'clsx';

import { useAuthStore } from '../../stores/authStore';

const AppLayout = () => {
    // Main application layout
    const { profile, signOut } = useAuthStore();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/landing');
    };

    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/missions', label: 'Missions', icon: Target },
        { path: '/focus', label: 'Focus Zone', icon: Zap },
        { path: '/gamification', label: 'Gamification', icon: Trophy },
        { path: '/career', label: 'Career', icon: Briefcase },
        { path: '/social', label: 'Social', icon: Users },
        { path: '/resources', label: 'Resources', icon: Book },
        { path: '/calendar', label: 'Calendar', icon: Calendar },
        { path: '/analytics', label: 'Analytics', icon: LineChart },
        { path: '/notifications', label: 'Inbox', icon: Activity },
        { path: '/chat', label: 'Chat', icon: MessageCircle },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            <CommandPalette />

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-gray-200 dark:border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-6 flex flex-col gap-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Studify OS
                        </h1>
                        <button
                            className="lg:hidden text-muted-foreground"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Command Trigger */}
                    <button
                        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'k', 'metaKey': true }))}
                        className="hidden lg:flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-gray-200 dark:border-white/5"
                    >
                        <Search size={14} />
                        <span>Quick Actions...</span>
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 dark:border-white/10 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </button>
                </div>

                {/* User Mini Profile */}
                <div className="px-6 mb-6 shrink-0">
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-gray-200 dark:border-white/5">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {profile?.full_name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate text-foreground">{profile?.full_name || 'User'}</p>
                            <p className="text-xs text-muted-foreground">Lvl {profile?.current_level || 1} Student</p>
                        </div>
                    </div>
                </div>

                <nav className="px-4 space-y-2 flex-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative group",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}

                    {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                        <>
                            <div className="my-2 border-t border-border/50 mx-2" />
                            <NavLink
                                to="/admin"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative group",
                                    isActive
                                        ? "bg-violet-500/10 text-violet-500 border border-violet-500/20"
                                        : "text-muted-foreground hover:bg-violet-500/5 hover:text-violet-500"
                                )}
                            >
                                <ShieldCheck size={20} />
                                <span className="font-medium">Admin Panel</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="p-6 border-t border-gray-200 dark:border-white/5 shrink-0">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-muted-foreground hover:text-red-500 text-sm w-full px-4 py-2 transition-colors rounded-lg hover:bg-red-500/10"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <div className="lg:hidden p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-card/50 backdrop-blur-md sticky top-0 z-30">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="text-foreground"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg text-foreground">Studify OS</span>
                    <button
                        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'k', 'metaKey': true }))}
                        className="text-muted-foreground"
                    >
                        <Search size={20} />
                    </button>
                </div>

                <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
