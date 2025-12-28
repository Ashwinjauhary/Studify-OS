import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });

        if (error) {
            alert(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
                        Studify OS
                    </h1>
                    <p className="text-gray-400">Identify yourself to enter the system.</p>
                </div>

                {sent ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto text-accent">
                            <Mail size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Check your email</h3>
                        <p className="text-gray-400">We've sent a magic link to <span className="text-white">{email}</span></p>
                        <button
                            onClick={() => setSent(false)}
                            className="text-sm text-accent hover:underline mt-4"
                        >
                            Try a different email
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-gray-300">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="student@university.edu"
                                    className="w-full bg-secondary/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Send Magic Link
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-gray-500 mt-4">
                            By entering, you agree to the Mission Protocols and Privacy Policy.
                        </p>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default Login;
