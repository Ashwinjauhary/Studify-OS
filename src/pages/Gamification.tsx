import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Star, Target, Crown, Lock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

const Gamification = () => {
    const { profile } = useAuthStore();
    const [userAchievements, setUserAchievements] = useState<string[]>([]);
    const [allAchievements, setAllAchievements] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!profile) return;

            // 1. Fetch all available achievements
            const { data: achievements } = await supabase.from('achievements').select('*');
            if (achievements) setAllAchievements(achievements);

            // 2. Fetch user unlocked achievements
            const { data: unlocked } = await supabase
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', profile.id);

            if (unlocked) {
                setUserAchievements(unlocked.map(u => u.achievement_id));
            }
        };
        fetchData();
    }, [profile]);

    // Derived state or defaults
    const currentLevel = profile?.current_level || 1;
    const currentXP = profile?.current_xp || 0;
    const xpToNext = profile?.xp_to_next_level || 100;
    const progress = Math.min((currentXP / xpToNext) * 100, 100);

    const mergedAchievements = allAchievements.map(ach => ({
        ...ach,
        unlocked: userAchievements.includes(ach.id),
        // Map icons if stored as text or use fallback
        iconDisplay: ach.icon || '🏆'
    }));

    return (
        <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-block"
                >
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-[0_0_30px_rgba(234,179,8,0.4)] mb-4 rotate-3">
                        {currentLevel}
                    </div>
                </motion.div>
                <h1 className="text-4xl font-bold text-foreground">Level {currentLevel} Scholar</h1>
                <p className="text-muted-foreground">Keep pushing. You are {xpToNext - currentXP} XP away from Level {currentLevel + 1}.</p>
            </div>

            {/* XP Bar */}
            <div className="bg-card border border-border p-8 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-end mb-4">
                    <div className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Star className="text-yellow-400" fill="currentColor" />
                        {currentXP} <span className="text-muted-foreground text-sm">/ {xpToNext} XP</span>
                    </div>
                    <div className="text-accent font-mono">{Math.round(progress)}%</div>
                </div>
                <div className="h-4 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-primary to-accent"
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500">
                        <Flame size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">{profile?.current_streak || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</div>
                    </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">{userAchievements.length}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Achievements</div>
                    </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                        <Crown size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">Top 5%</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Leaderboard</div>
                    </div>
                </div>
            </div>

            {/* Achievements */}
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Target className="text-accent" />
                    Achievements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mergedAchievements.map((ach) => (
                        <div
                            key={ach.id}
                            className={`p-6 rounded-xl border transition-all ${ach.unlocked
                                ? 'bg-primary/10 border-primary/30'
                                : 'bg-card border-border opacity-70 grayscale'
                                }`}
                        >
                            <div className="text-4xl mb-4">{ach.iconDisplay}</div>
                            <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                                {ach.title}
                                {!ach.unlocked && <Lock size={12} className="text-muted-foreground" />}
                            </h3>
                            <p className="text-sm text-muted-foreground">{ach.description}</p>
                            <div className="mt-2 text-xs font-bold text-accent">+{ach.xp_reward} XP</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Gamification;
