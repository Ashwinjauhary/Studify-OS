import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Clock, Target, Flame, ArrowUpRight, BookOpen, Crown } from 'lucide-react';
import AIMentor from '../components/dashboard/AIMentor';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { profile } = useAuthStore();
    const [stats, setStats] = useState({
        todayStudyMins: 0,
        completedMissions: 0,
        totalMissions: 0,
        streak: 0
    });
    const [studyData, setStudyData] = useState<any[]>([]);

    useEffect(() => {
        const loadDashboard = async () => {
            if (!profile) return;

            const today = new Date();
            const startDay = startOfWeek(today, { weekStartsOn: 1 });
            const endDay = endOfWeek(today, { weekStartsOn: 1 });

            // 1. Fetch Weekly Study Sessions
            const { data: sessions } = await supabase
                .from('study_sessions')
                .select('duration_seconds, start_time')
                .gte('start_time', startDay.toISOString())
                .lte('start_time', endDay.toISOString());

            // Process for Chart
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const weeklyMap = new Array(7).fill(0);

            sessions?.forEach(session => {
                const dayIndex = new Date(session.start_time).getDay();
                const adjustIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                weeklyMap[adjustIndex] += Math.round(session.duration_seconds / 60);
            });

            const chartData = days.map((day, i) => ({
                name: day,
                minutes: weeklyMap[i]
            }));
            setStudyData(chartData);

            // 2. Today's Stats
            const todayStr = format(today, 'yyyy-MM-dd');
            const { data: missions } = await supabase
                .from('daily_missions')
                .select('is_completed')
                .eq('user_id', profile.id)
                .eq('due_date', todayStr);

            const completed = missions?.filter(m => m.is_completed).length || 0;
            const total = missions?.length || 0;

            const todaySessions = sessions?.filter(s =>
                format(new Date(s.start_time), 'yyyy-MM-dd') === todayStr
            );
            const todayMins = todaySessions?.reduce((acc, s) => acc + Math.round(s.duration_seconds / 60), 0) || 0;

            setStats({
                todayStudyMins: todayMins,
                completedMissions: completed,
                totalMissions: total,
                streak: profile.current_streak
            });
        };

        if (profile?.id) {
            loadDashboard();
        }
    }, [profile]);

    const focusTrend = [
        { name: 'Week 1', score: 65 },
        { name: 'Week 2', score: 70 },
        { name: 'Week 3', score: 85 },
        { name: 'Week 4', score: 82 },
    ];

    const StatCard = ({ icon: Icon, label, value, subtext, color, delay }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="relative overflow-hidden bg-card border border-border p-6 rounded-2xl group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
        >
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
                <Icon size={80} />
            </div>
            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${color} bg-opacity-10`}>
                <Icon size={24} className={color.replace('bg-', 'text-').replace('/10', '')} />
            </div>
            <div>
                <p className="text-muted-foreground font-medium text-sm tracking-wide uppercase">{label}</p>
                <h3 className="text-3xl font-bold text-foreground mt-1 tracking-tight">{value}</h3>
                <p className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1">
                    {subtext}
                </p>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Hero Welcome Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 p-8 md:p-12 text-white shadow-2xl shadow-indigo-500/20"
            >
                {/* Abstract Shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur shadow-xl overflow-hidden shrink-0">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="You" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold">
                                    {profile?.full_name?.[0]}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur border border-white/10 flex items-center gap-1">
                                    <Crown size={12} />
                                    Level {profile?.current_level || 1} Scholar
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour < 12) return 'Good Morning';
                                    if (hour < 17) return 'Good Afternoon';
                                    return 'Good Evening';
                                })()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{profile?.full_name?.split(' ')[0]}</span>
                            </h1>
                            <p className="text-indigo-100 text-lg max-w-lg">
                                You're on a <span className="font-bold text-white">{stats.streak} day streak!</span> Let's keep the momentum going.
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:flex gap-4">
                        <div className="text-right">
                            <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">Weekly Goal</p>
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-4xl font-bold">{Math.floor(stats.todayStudyMins / 60)}h</span>
                                <span className="text-indigo-300">/ {localStorage.getItem('weekly_goal') || '10'}h</span>
                            </div>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center relative">
                            <span className="font-bold text-sm">{Math.round(((stats.todayStudyMins / 60) / parseInt(localStorage.getItem('weekly_goal') || '10')) * 100)}%</span>
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeDasharray={`${Math.min(((stats.todayStudyMins / 60) / parseInt(localStorage.getItem('weekly_goal') || '10')) * 100, 100)}, 100`}
                                    className="text-white drop-shadow-lg"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Clock}
                    label="Today's Focus"
                    value={`${Math.floor(stats.todayStudyMins / 60)}h ${stats.todayStudyMins % 60}m`}
                    subtext={<><ArrowUpRight size={14} className="text-green-500" /> +12% vs yesterday</>}
                    color="text-blue-500 bg-blue-500"
                    delay={0.1}
                />
                <StatCard
                    icon={Target}
                    label="Missions"
                    value={`${stats.completedMissions}/${stats.totalMissions}`}
                    subtext={`${stats.totalMissions - stats.completedMissions} remaining today`}
                    color="text-violet-500 bg-violet-500"
                    delay={0.2}
                />
                <StatCard
                    icon={Flame}
                    label="Current Streak"
                    value={`${stats.streak} Days`}
                    subtext="You're on fire! 🔥"
                    color="text-orange-500 bg-orange-500"
                    delay={0.3}
                />
                <StatCard
                    icon={BookOpen}
                    label="Knowledge Base"
                    value="12"
                    subtext="Resources accessed"
                    color="text-emerald-500 bg-emerald-500"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 bg-card border border-border p-6 rounded-3xl shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Activity Analytics</h3>
                            <p className="text-sm text-muted-foreground">Your study patterns this week</p>
                        </div>
                        <select className="bg-secondary text-sm rounded-lg px-3 py-1 border border-border outline-none">
                            <option>This Week</option>
                            <option>Last Week</option>
                        </select>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={studyData}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.1} vertical={false} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}m`} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="minutes" fill="url(#barGradient)" radius={[6, 6, 6, 6]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Right Column Stack */}
                <div className="space-y-6">
                    <AIMentor />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-card border border-border p-6 rounded-3xl"
                    >
                        <h3 className="text-lg font-bold text-foreground mb-4">Focus Quality</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={focusTrend}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
