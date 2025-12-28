import { motion } from 'framer-motion';
import { Users, Target, ShieldAlert, Activity, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-card border border-border p-6 rounded-xl relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow"
    >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-foreground">
            <Icon size={64} />
        </div>
        <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon size={24} />
            </div>
            <div>
                <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
                <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
        </div>
        {trend && (
            <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded w-fit">
                <TrendingUp size={14} />
                <span>{trend} vs last week</span>
            </div>
        )}
    </motion.div>
);

const AdminDashboard = () => {
    // Mock Data
    const stats = [
        { title: 'Total Students', value: '1,240', icon: Users, trend: '+12%' },
        { title: 'Active Missions', value: '85', icon: Target, trend: '+5%' },
        { title: 'System Health', value: '99.9%', icon: Activity },
        { title: 'Admin Logs', value: '24', icon: ShieldAlert, trend: '+2' },
    ];

    const modules = [
        { title: 'User Management', desc: 'Manage students, reset streaks, ban users.', icon: Users, path: '/admin/users', color: 'bg-blue-500/10 text-blue-500' },
        { title: 'Mission Control', desc: 'Create & edit daily missions and templates.', icon: Target, path: '/admin/missions', color: 'bg-primary/10 text-primary' },
        { title: 'Gamification Rules', desc: 'Adjust XP logic, leveling, and rewards.', icon: TrendingUp, path: '/admin/gamification', color: 'bg-green-500/10 text-green-500' },
        { title: 'System Settings', desc: 'Feature flags and global configs.', icon: ShieldAlert, path: '/admin/settings', color: 'bg-orange-500/10 text-orange-500' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Overview</h1>
                    <p className="text-muted-foreground">System metrics and management tools.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 px-3 py-1 rounded-full w-fit">
                    <Activity size={16} />
                    <span>System Operational</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>

            <h2 className="text-xl font-semibold text-foreground mt-8">Management Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modules.map((mod) => (
                    <Link key={mod.title} to={mod.path}>
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="bg-card border border-border p-6 rounded-xl flex items-start gap-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer h-full group"
                        >
                            <div className={`p-3 rounded-lg ${mod.color}`}>
                                <mod.icon size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{mod.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{mod.desc}</p>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
