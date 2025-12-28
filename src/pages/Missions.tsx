import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Trophy, Play, Timer, Ban } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

interface Mission {
    id: string;
    title: string;
    xp_reward: number;
    is_completed: boolean;
    type: string;
    difficulty: string;
    is_anticheat_enabled: boolean;
}

const Missions = () => {
    const { profile, fetchProfile } = useAuthStore();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);

    // Timer State
    const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const timerRef = useRef<any>(null); // Fixed NodeJS type issue by using any (or ReturnType<typeof setTimeout>)

    useEffect(() => {
        if (profile?.id) {
            checkAndGenerateMissions();
        }
    }, [profile?.id]);

    // Timer Logic
    useEffect(() => {
        const handleVisibilityChange = () => {
            // Only enforce if the ACTIVE mission requires it
            const currentMission = missions.find(m => m.id === activeMissionId);

            if (document.hidden && activeMissionId && currentMission?.is_anticheat_enabled) {
                // User switched tabs - PAUSE TIMER
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        if (activeMissionId && timeLeft > 0 && !document.hidden) {
            // Check if we should be paused (safety check)
            const currentMission = missions.find(m => m.id === activeMissionId);
            const shouldPause = document.hidden && currentMission?.is_anticheat_enabled;

            if (!shouldPause) {
                timerRef.current = setTimeout(() => {
                    setTimeLeft(prev => prev - 1);
                }, 1000);
            }
        } else if (activeMissionId && timeLeft === 0) {
            completeActiveMission();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [activeMissionId, timeLeft, missions]);

    const checkAndGenerateMissions = async () => {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Check existing
        const { data: existing } = await supabase
            .from('daily_missions')
            .select('*')
            .eq('user_id', profile?.id)
            .eq('due_date', todayStr);

        if (existing && existing.length > 0) {
            setMissions(existing);
            setLoading(false);
            return;
        }

        // 2. Generation Logic (Same as before, simplified for this snippet to rely on fetch if mostly existing)
        // Note: For full implementation, we'd keep the generation logic. 
        // Since we are replacing the whole file, I will restore the full generation logic below.

        // ... Re-implmenting Generation Logic ...
        let careerId = null;
        if (profile?.career_goal) {
            const { data: careerData } = await supabase.from('careers').select('id').eq('title', profile.career_goal).single();
            if (careerData) careerId = careerData.id;
        }

        let careerTemplates: any[] = [];
        let genericTemplates: any[] = [];

        if (careerId) {
            const { data: cData } = await supabase.from('mission_templates').select('*').eq('is_active', true).eq('career_id', careerId);
            if (cData) careerTemplates = cData;
        }
        const { data: gData } = await supabase.from('mission_templates').select('*').eq('is_active', true).is('career_id', null);
        if (gData) genericTemplates = gData;

        careerTemplates.sort(() => 0.5 - Math.random());
        genericTemplates.sort(() => 0.5 - Math.random());

        let selected = [];
        selected.push(...careerTemplates.slice(0, 8));
        const needed = 12 - selected.length;
        selected.push(...genericTemplates.slice(0, needed));

        if (selected.length > 0) {
            const newMissions = selected.map(t => ({
                user_id: profile?.id,
                template_id: t.id,
                title: t.title,
                description: t.description,
                type: t.type,
                difficulty: t.difficulty,
                xp_reward: t.xp_reward,
                coin_reward: t.coin_reward,
                is_anticheat_enabled: t.is_anticheat_enabled || false,
                due_date: todayStr
            }));

            const { data: inserted } = await supabase.from('daily_missions').insert(newMissions).select();
            if (inserted) setMissions(inserted);
        }
        setLoading(false);
    };

    const getDuration = (difficulty: string) => {
        // Anti-Cheat Enforced Durations
        switch (difficulty) {
            case 'easy': return 10 * 60; // 10 Minutes
            case 'medium': return 25 * 60; // 25 Minutes
            case 'hard': return 45 * 60; // 45 Minutes
            case 'epic': return 60 * 60; // 60 Minutes
            default: return 15 * 60;
        }
    };

    const startMission = (mission: Mission) => {
        if (activeMissionId) return; // Only one at a time
        setActiveMissionId(mission.id);
        setTimeLeft(getDuration(mission.difficulty));
    };

    const completeActiveMission = async () => {
        if (!activeMissionId) return;
        const mission = missions.find(m => m.id === activeMissionId);
        if (!mission) return;

        // DB Update
        const { error } = await supabase
            .from('daily_missions')
            .update({ is_completed: true })
            .eq('id', mission.id);

        if (!error) {
            // Update Local State
            setMissions(prev => prev.map(m =>
                m.id === mission.id ? { ...m, is_completed: true } : m
            ));

            // Award XP
            await supabase.rpc('add_xp', {
                user_id: profile?.id,
                xp_amount: mission.xp_reward,
                source_label: 'Mission: ' + mission.title
            });
            fetchProfile();

            // Reset Timer
            setActiveMissionId(null);
            setTimeLeft(0);
        }
    };

    const cancelMission = () => {
        setActiveMissionId(null);
        setTimeLeft(0);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const completedCount = missions.filter(m => m.is_completed).length;
    const progress = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Daily Missions</h1>
                    <p className="text-muted-foreground">Complete tasks to earn XP and maintain your streak.</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-accent">{progress}%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Completed</div>
                </div>
            </div>

            {/* Anti-Cheat Warning */}
            {/* Anti-Cheat Warning */}
            {activeMissionId && missions.find(m => m.id === activeMissionId)?.is_anticheat_enabled && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 text-red-400 text-sm mb-6">
                    <Ban size={16} />
                    <span>
                        <strong>Anti-Cheat Active:</strong> Timer will <u>PAUSE</u> if you switch tabs or minimize the window. Stay focused!
                    </span>
                </div>
            )}

            {/* Progress Bar */}
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                />
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {loading ? (
                        <div className="text-muted-foreground text-center py-10">Loading missions...</div>
                    ) : missions.length === 0 ? (
                        <div className="text-muted-foreground text-center py-10">No missions generated yet. Check templates!</div>
                    ) : (
                        missions.map((mission) => {
                            const isActive = activeMissionId === mission.id;
                            const isLocked = activeMissionId !== null && !isActive; // Lock others if one is active

                            return (
                                <motion.div
                                    key={mission.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    layout
                                    className={clsx(
                                        "group p-4 rounded-xl border transition-all flex items-center justify-between relative overflow-hidden",
                                        mission.is_completed
                                            ? "bg-primary/5 border-primary/20 opacity-60"
                                            : isActive
                                                ? "bg-accent/10 border-accent shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                                : "bg-card border-gray-200 dark:border-white/5 hover:border-primary/50"
                                    )}
                                >
                                    {/* Active Progress Bar Background */}
                                    {isActive && (
                                        <motion.div
                                            className="absolute bottom-0 left-0 h-1 bg-accent z-10"
                                            initial={{ width: "100%" }}
                                            animate={{ width: "0%" }}
                                            transition={{ duration: getDuration(mission.difficulty), ease: "linear" }}
                                        />
                                    )}

                                    <div className="flex items-center gap-4 z-10">
                                        <div className={clsx(
                                            "transition-colors duration-300",
                                            mission.is_completed ? "text-primary" : isActive ? "text-accent" : "text-muted-foreground"
                                        )}>
                                            {mission.is_completed ? <CheckCircle2 size={24} /> : isActive ? <Timer size={24} className="animate-spin-slow" /> : <Circle size={24} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={clsx(
                                                "font-medium transition-all",
                                                mission.is_completed ? "text-muted-foreground line-through" : "text-foreground"
                                            )}>
                                                {mission.title}
                                            </span>
                                            {isActive && (
                                                <span className="text-xs text-accent font-bold animate-pulse">
                                                    Working... {Math.floor(timeLeft / 60)}m {timeLeft % 60}s remaining
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 z-10">
                                        {!mission.is_completed && !isActive && (
                                            <button
                                                onClick={() => !isLocked && startMission(mission)}
                                                disabled={isLocked}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors",
                                                    isLocked
                                                        ? "opacity-50 cursor-not-allowed bg-secondary text-muted-foreground"
                                                        : "bg-primary hover:bg-primary/90 text-white"
                                                )}
                                            >
                                                <Play size={12} fill="currentColor" />
                                                START
                                            </button>
                                        )}

                                        {isActive && (
                                            <button
                                                onClick={cancelMission}
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                            >
                                                CANCEL
                                            </button>
                                        )}

                                        {mission.is_completed && (
                                            <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                                                DONE
                                            </span>
                                        )}

                                        <div className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                                            <Trophy size={12} />
                                            {mission.xp_reward}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Missions;
