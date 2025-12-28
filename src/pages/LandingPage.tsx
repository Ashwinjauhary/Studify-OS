import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    Cpu,
    Zap,
    Target,
    Shield,
    Globe,
    ArrowRight,
    LayoutDashboard,
    Brain,
    Trophy
} from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const { scrollY } = useScroll();
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-lg border-b border-white/5 bg-background/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                            <span className="font-bold text-white text-xl">S</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight hidden md:block">Studify OS</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 rounded-full text-sm font-medium hover:bg-secondary transition-colors"
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/25"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center">
                <div className="absolute top-0 inset-x-0 h-[50vh] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-6 border border-accent/20">
                            <SparkleIcon size={12} /> The Future of Learning
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                            Gamify Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-accent animate-pulse-slow">
                                Education
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                            Turn your study sessions into an immersive RPG. Track focus, earn XP, unlock achievements, and climb the leaderboard.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:shadow-2xl hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 group"
                            >
                                Start Your Journey
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-8 py-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-lg transition-colors border border-white/5"
                            >
                                View Demo
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        style={{ y: y2 }}
                        className="relative hidden lg:block"
                    >
                        {/* 3D-ish Dashboard Mockup */}
                        <div className="relative z-10 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl rotate-y-12 rotate-x-6 transform-3d hover:rotate-0 transition-transform duration-700">
                            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <div className="h-6 w-full max-w-[200px] bg-white/5 rounded-md mx-auto" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <MockCard icon={Zap} title="Focus" value="4h 20m" color="text-yellow-400" />
                                <MockCard icon={Trophy} title="Rank" value="#12" color="text-purple-400" />
                                <MockCard icon={Brain} title="XP" value="2,450" color="text-blue-400" />
                            </div>
                            <div className="mt-4 h-32 bg-white/5 rounded-xl w-full" />
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="h-20 bg-white/5 rounded-xl" />
                                <div className="h-20 bg-white/5 rounded-xl" />
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-10 -right-10 bg-card p-4 rounded-2xl shadow-xl border border-white/10 z-20"
                        >
                            <Trophy className="text-yellow-500 w-12 h-12" />
                            <div className="text-xs font-bold mt-2 text-center">Level Up!</div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 20, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-10 -left-10 bg-card p-4 rounded-2xl shadow-xl border border-white/10 z-20"
                        >
                            <Zap className="text-primary w-12 h-12" />
                            <div className="text-xs font-bold mt-2 text-center">Focus Mode</div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-secondary/20 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Complete Productivity OS</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            More than just a todo list. Studify is a complete ecosystem designed to optimize your academic performance.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={LayoutDashboard}
                            title="Command Center"
                            desc="Centralized dashboard for all your academic metrics, deadlines, and daily progress."
                        />
                        <FeatureCard
                            icon={Target}
                            title="Mission System"
                            desc="Turn boring tasks into engaging quests with XP rewards and loot drops."
                        />
                        <FeatureCard
                            icon={Brain}
                            title="AI Mentor"
                            desc="Smart suggestions based on your study habits to keep you on track."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Focus Guard"
                            desc="Block distracting apps and track deep work sessions with detailed analytics."
                        />
                        <FeatureCard
                            icon={Globe}
                            title="Social Campus"
                            desc="Connect with peers, compete on leaderboards, and join study groups."
                        />
                        <FeatureCard
                            icon={Cpu}
                            title="Career Engine"
                            desc="Map your skills to real-world career paths and track your professional growth."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to Level Up?</h2>
                    <p className="text-xl text-muted-foreground mb-10">
                        Join thousands of students who have transformed their grades and productivity.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-12 py-5 rounded-full bg-white text-black font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                    >
                        Create Free Account
                    </button>
                    <p className="mt-6 text-sm text-muted-foreground">No credit card required • Free forever plan available</p>
                </div>

                {/* Background Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 bg-black/20 text-center">
                <div className="text-muted-foreground text-sm">
                    © 2024 Studify OS. Crafted for Students, by Students.
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="p-8 rounded-2xl bg-card border border-white/5 hover:border-primary/50 transition-colors group cursor-default"
    >
        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
            <Icon className="text-foreground group-hover:text-primary transition-colors" size={28} />
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
);

const MockCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: string, color: string }) => (
    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 mb-2">
            <Icon size={16} className={color} />
            <span className="text-xs text-gray-400 uppercase font-bold">{title}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
    </div>
);

const SparkleIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.39 8.26L20.66 10.66L14.39 13.06L12 19.33L9.61 13.06L3.34 10.66L9.61 8.26L12 2Z" fill="currentColor" />
    </svg>
);

export default LandingPage;
