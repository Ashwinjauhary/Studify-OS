import { useState, useEffect } from 'react';
import { Sparkles, Brain, AlertCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

interface MentorMessage {
    id: string;
    type: 'motivation' | 'warning' | 'suggestion' | 'celebration';
    text: string;
    icon: any;
    color: string;
}

const AIMentor = () => {
    const { profile } = useAuthStore();
    const [message, setMessage] = useState<MentorMessage | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (profile) {
            generateMentorMessage();
        }
    }, [profile]);

    const generateMentorMessage = async () => {
        const hour = new Date().getHours();

        // 1. Check Consistency (Streak)
        if (profile?.current_streak === 0) {
            setMessage({
                id: 'streak-start',
                type: 'suggestion',
                text: "Let's start a new streak today! Even 5 minutes counts.",
                icon: TrendingUp,
                color: 'text-blue-500'
            });
            return;
        }

        if (profile?.current_streak && profile.current_streak > 3) {
            setMessage({
                id: 'streak-keep',
                type: 'motivation',
                text: `You're on fire! ${profile.current_streak} day streak. Don't break the chain!`,
                icon: Flame,
                color: 'text-orange-500'
            });
            return;
        }

        // 2. Check Study Time Today (Real Data needed here ideally, using simple logic for now)
        // Check if user has active missions
        const { data: missions } = await supabase
            .from('daily_missions')
            .select('is_completed')
            .eq('user_id', profile?.id)
            .eq('due_date', new Date().toISOString().split('T')[0]);

        const completed = missions?.filter(m => m.is_completed).length || 0;
        const total = missions?.length || 0;

        if (total > 0 && completed === total) {
            setMessage({
                id: 'all-clear',
                type: 'celebration',
                text: "All missions cleared! You're crushing it today.",
                icon: Sparkles,
                color: 'text-yellow-500'
            });
            return;
        }

        if (hour > 20 && completed < total) {
            setMessage({
                id: 'late-night',
                type: 'warning',
                text: "It's getting late. Try to finish one more mission before bed.",
                icon: AlertCircle,
                color: 'text-red-500'
            });
            return;
        }

        // Default
        setMessage({
            id: 'default',
            type: 'motivation',
            text: "Focus is the key to mastery. What shall we learn today?",
            icon: Brain,
            color: 'text-purple-500'
        });
    };

    if (!message || !isVisible) return null;

    const Icon = message.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card border border-gray-200 dark:border-white/10 p-4 rounded-xl flex items-start gap-4 relative overflow-hidden group shadow-sm hover:shadow-md transition-all"
            >
                <div className={`p-2 rounded-lg bg-secondary ${message.color}`}>
                    <Icon size={20} />
                </div>
                <div className="flex-1 z-10">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">AI Mentor</h3>
                    <p className="text-foreground text-sm leading-relaxed">{message.text}</p>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                >
                    &times;
                </button>

                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2`} />
            </motion.div>
        </AnimatePresence>
    );
};

// Start Icon helper needed since lucide-react doesn't export 'Flame' directly in the imports above
import { Flame } from 'lucide-react';

export default AIMentor;
