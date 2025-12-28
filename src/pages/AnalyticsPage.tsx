import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { subDays, getHours } from 'date-fns';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { Activity, Clock, Zap, CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const Analytics = () => {
    const { profile } = useAuthStore();
    const [heatmapData, setHeatmapData] = useState<number[]>(new Array(365).fill(0));
    const [bestHour, setBestHour] = useState<string>('--:--');
    const [efficiency, setEfficiency] = useState(0);
    const [focusDistribution, setFocusDistribution] = useState<any[]>([]);

    useEffect(() => {
        if (profile) fetchData();
    }, [profile]);

    const fetchData = async () => {
        const today = new Date();
        const last30Days = subDays(today, 30).toISOString();
        const last365Days = subDays(today, 365).toISOString();

        // 1. Fetch Sessions (Last 365 Days for Heatmap)
        const { data: allSessions } = await supabase
            .from('study_sessions')
            .select('start_time, duration_seconds, mode')
            .gte('start_time', last365Days)
            .eq('user_id', profile?.id);

        if (allSessions) {
            // A. Best Focus Hour (Last 30 Days Subset)
            const recentSessions = allSessions.filter(s => s.start_time >= last30Days);

            const hourCounts = new Array(24).fill(0);
            recentSessions.forEach(s => {
                const h = getHours(new Date(s.start_time));
                hourCounts[h]++;
            });
            const maxIdx = hourCounts.indexOf(Math.max(...hourCounts));
            setBestHour(`${maxIdx}:00 - ${maxIdx + 1}:00`);

            // B. Heatmap (Last 365 Days)
            const activityMap = new Map<string, number>();
            allSessions.forEach(s => {
                const dayStr = new Date(s.start_time).toISOString().split('T')[0];
                const currentDuration = activityMap.get(dayStr) || 0;
                activityMap.set(dayStr, currentDuration + s.duration_seconds);
            });

            const days = [];
            for (let i = 364; i >= 0; i--) {
                const date = subDays(new Date(), i);
                const dayStr = date.toISOString().split('T')[0];
                const seconds = activityMap.get(dayStr) || 0;

                // Level 0-4 based on minutes studied
                // 0: 0 mins
                // 1: 1-15 mins
                // 2: 15-45 mins
                // 3: 45-120 mins
                // 4: > 120 mins
                let level = 0;
                if (seconds > 0) level = 1;
                if (seconds > 15 * 60) level = 2;
                if (seconds > 45 * 60) level = 3;
                if (seconds > 120 * 60) level = 4;

                days.push(level);
            }
            setHeatmapData(days);

            // C. Focus Mode Distribution (Recent)
            const modes = recentSessions.reduce((acc: any, curr) => {
                acc[curr.mode] = (acc[curr.mode] || 0) + 1;
                return acc;
            }, {});

            setFocusDistribution([
                { name: 'Pomodoro', value: modes['pomodoro'] || 0, color: '#a855f7' },
                { name: 'Deep Focus', value: modes['deep_focus'] || 0, color: '#3b82f6' },
            ]);
        }

        // 2. Efficiency (Missions Completed / Total)
        // ... (unchanged)
        const { data: missions } = await supabase
            .from('daily_missions')
            .select('is_completed')
            .gte('due_date', last30Days)
            .eq('user_id', profile?.id);

        if (missions && missions.length > 0) {
            const completed = missions.filter(m => m.is_completed).length;
            setEfficiency(Math.round((completed / missions.length) * 100));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Engine</h1>
                    <p className="text-muted-foreground">Deep dive into your productivity metrics.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-gray-200 dark:border-white/5 p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={64} className="text-foreground" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-muted-foreground text-sm uppercase font-bold tracking-wider mb-2">Best Focus Hour</div>
                        <div className="text-3xl font-bold text-foreground">{bestHour}</div>
                        <div className="text-green-500 text-xs mt-2 flex items-center gap-1">
                            <Zap size={12} /> Most sessions started
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-gray-200 dark:border-white/5 p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={64} className="text-foreground" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-muted-foreground text-sm uppercase font-bold tracking-wider mb-2">Efficiency Score</div>
                        <div className="text-3xl font-bold text-foreground">{efficiency}%</div>
                        <div className="text-blue-500 text-xs mt-2">Mission Completion Rate</div>
                    </div>
                </div>

                <div className="bg-card border border-gray-200 dark:border-white/5 p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CalendarDays size={64} className="text-foreground" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-muted-foreground text-sm uppercase font-bold tracking-wider mb-2">Active Days</div>
                        <div className="text-3xl font-bold text-foreground">{profile?.current_streak || 0}</div>
                        <div className="text-orange-500 text-xs mt-2">Current Streak</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Focus Distribution Chart */}
                <div className="bg-card border border-gray-200 dark:border-white/5 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-foreground mb-6">Focus Modes Used</h3>
                    <div className="h-64 w-full min-h-[250px]">
                        {focusDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={focusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {focusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No data available yet.
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                        {focusDistribution.map((entry) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs text-muted-foreground">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GitHub Style Heatmap (Real Data) */}
                <div className="lg:col-span-2 bg-card border border-gray-200 dark:border-white/5 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-foreground mb-6">Yearly Activity Map</h3>
                    <div className="flex flex-wrap gap-1">
                        {heatmapData.map((level, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.001 }}
                                className={clsx(
                                    "w-3 h-3 rounded-sm",
                                    level === 0 ? "bg-secondary" :
                                        level === 1 ? "bg-primary/30" :
                                            level === 2 ? "bg-primary/50" :
                                                "bg-primary"
                                )}
                                title={`Activity Level: ${level}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
