import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';

const Onboarding = () => {
    const { session, fetchProfile } = useAuthStore();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [fullName, setFullName] = useState('');
    const [educationLevel, setEducationLevel] = useState('College');
    const [careerGoal, setCareerGoal] = useState('');
    const [theme] = useState('dark');

    const handleComplete = async () => {
        if (!session?.user) return;
        setLoading(true);

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                education_level: educationLevel,
                career_goal: careerGoal,
                theme_preference: theme,
                year_stream: 'Freshman', // Default value since not collected in form
            })
            .eq('id', session.user.id);

        if (error) {
            alert('Failed to save profile: ' + error.message);
        } else {
            await fetchProfile();
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-card border border-gray-200 dark:border-white/5 rounded-2xl p-8 overflow-hidden relative"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-secondary">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Studify OS</h1>
                    <p className="text-muted-foreground">Let's set up your profile for maximum productivity.</p>
                </div>

                {step === 1 && (
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">What should we call you?</label>
                            <input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Current Education Level</label>
                            <div className="grid grid-cols-2 gap-4">
                                {['High School', 'College', 'Professional', 'Self-Learner'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setEducationLevel(opt)}
                                        className={`p-3 rounded-lg border text-left transition-all ${educationLevel === opt
                                            ? 'bg-primary/20 border-primary text-foreground'
                                            : 'bg-secondary border-transparent text-muted-foreground hover:bg-secondary/80'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            disabled={!fullName}
                            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                        >
                            Continue <ChevronRight size={18} />
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">What is your primary goal?</label>
                            <input
                                value={careerGoal}
                                onChange={(e) => setCareerGoal(e.target.value)}
                                className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none"
                                placeholder="e.g. Become a Full Stack Developer"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="flex-1 bg-secondary text-foreground py-3 rounded-lg hover:bg-secondary/80">Back</button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!careerGoal}
                                className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                            >
                                Continue <ChevronRight size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6 text-center">
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4">
                                <Check size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">All Set!</h2>
                            <p className="text-muted-foreground">Your operating system is ready to boot.</p>
                        </div>

                        <button
                            onClick={handleComplete}
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                        >
                            {loading ? 'Booting...' : 'Enter System'}
                        </button>
                    </motion.div>
                )}

            </motion.div>
        </div>
    );
};

export default Onboarding;
