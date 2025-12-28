import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    LayoutDashboard,
    Target,
    Zap,
    Trophy,
    Briefcase,
    Users,
    Book,
    Calendar,
    LineChart,
    Settings,
    LogOut,
    Moon,
    Sun
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { signOut } = useAuthStore();
    const [activeIndex, setActiveIndex] = useState(0);

    // Toggle with Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const commands = [
        {
            category: 'Navigation',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', action: () => navigate('/') },
                { icon: Target, label: 'Missions', action: () => navigate('/missions') },
                { icon: Zap, label: 'Focus Zone', action: () => navigate('/focus') },
                { icon: Trophy, label: 'Gamification', action: () => navigate('/gamification') },
                { icon: Briefcase, label: 'Career', action: () => navigate('/career') },
                { icon: Users, label: 'Social', action: () => navigate('/social') },
                { icon: Book, label: 'Resources', action: () => navigate('/resources') },
                { icon: Calendar, label: 'Calendar', action: () => navigate('/calendar') },
                { icon: LineChart, label: 'Analytics', action: () => navigate('/analytics') },
                { icon: Settings, label: 'Settings', action: () => navigate('/settings') },
            ]
        },
        {
            category: 'System',
            items: [
                { icon: LogOut, label: 'Sign Out', action: () => { signOut(); navigate('/login'); } },
                { icon: Moon, label: 'Theme: Dark', action: () => document.documentElement.className = 'dark' },
                { icon: Sun, label: 'Theme: Light', action: () => document.documentElement.className = 'light' },
            ]
        }
    ];

    const filteredCommands = commands.map(group => ({
        ...group,
        items: group.items.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase())
        )
    })).filter(group => group.items.length > 0);

    const flatItems = filteredCommands.flatMap(g => g.items);

    // Keyboard navigation
    useEffect(() => {
        const handleNav = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % flatItems.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (flatItems[activeIndex]) {
                    flatItems[activeIndex].action();
                    setIsOpen(false);
                }
            }
        };
        window.addEventListener('keydown', handleNav);
        return () => window.removeEventListener('keydown', handleNav);
    }, [isOpen, flatItems, activeIndex]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-lg bg-card border border-white/10 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[60vh]"
                    >
                        <div className="flex items-center px-4 py-3 border-b border-white/5">
                            <Search className="w-5 h-5 text-muted-foreground mr-3" />
                            <input
                                autoFocus
                                value={query}
                                onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                            />
                            <div className="text-xs text-muted-foreground border border-white/10 px-2 py-1 rounded">ESC</div>
                        </div>

                        <div className="overflow-y-auto p-2">
                            {filteredCommands.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No results found.</div>
                            ) : (
                                filteredCommands.map((group, gIdx) => (
                                    <div key={gIdx} className="mb-2">
                                        <div className="text-xs font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider mb-1">
                                            {group.category}
                                        </div>
                                        {group.items.map((item, iIdx) => {
                                            const globalIndex = flatItems.indexOf(item);
                                            const isActive = globalIndex === activeIndex;
                                            return (
                                                <button
                                                    key={iIdx}
                                                    onClick={() => { item.action(); setIsOpen(false); }}
                                                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'text-foreground hover:bg-secondary'
                                                        }`}
                                                >
                                                    <item.icon size={18} className={isActive ? 'text-primary-foreground' : 'text-muted-foreground'} />
                                                    <span className="font-medium text-sm">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
