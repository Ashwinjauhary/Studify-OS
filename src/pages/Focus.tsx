import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, Volume2, VolumeX, StickyNote, Save, Settings, X } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const Focus = () => {
    const { session, fetchProfile } = useAuthStore();

    // Config State
    const [durations, setDurations] = useState({
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15,
        deepFocus: 90
    });

    const [timeLeft, setTimeLeft] = useState(durations.pomodoro * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak' | 'deepFocus'>('pomodoro');
    const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
    const [stats, setStats] = useState({ sessions: 0, minutes: 0, xp: 0 });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Soundscapes & Notes State
    const [isPlayingSound, setIsPlayingSound] = useState(false);
    const [soundType, setSoundType] = useState<string>('rain');
    const [volume, setVolume] = useState(0.5);

    // Audio Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<any>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [notes, setNotes] = useState(localStorage.getItem('focus_scratchpad') || '');

    useEffect(() => {
        const timeout = setTimeout(() => localStorage.setItem('focus_scratchpad', notes), 1000);
        return () => clearTimeout(timeout);
    }, [notes]);

    const SOUNDS = [
        { id: 'rain', label: 'Rain', type: 'audio', src: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/sounds/rain.mp3', icon: 'CloudRain' },
        { id: 'forest', label: 'Forest', type: 'audio', src: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/sounds/forest.mp3', icon: 'Trees' },
        // Fallback for waves and night if not in that repo, but searching suggests he has others. Let's try basic ones.
        // Actually the search said 'ocean.mp3'.
        { id: 'waves', label: 'Waves', type: 'audio', src: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/sounds/ocean.mp3', icon: 'Waves' },
        // For night, let's try a standard one or fallback to generated. 
        // Let's use a known reliable one if possible, or remove Night if we can't find it.
        // I'll try 'night.mp3' as a guess, and if it fails, the error handler will catch it.
        // Better: I will use 'summer-night' or similar if I can guess, but let's stick to the 3 known ones + generated.
        // I'll swap 'Night' for 'Pink Noise' as default if I can't find a file.
        // I will trust the 'night.mp3' existence or just use Mixkit for that one as a specific try, but safer to use what I know exists.
        // The search didn't explicitly mention 'night.mp3'.
        // I will keep Night but point to a commonly found filename in such repos, or just not include it if unsure.
        // Let's use 'rain', 'forest', 'waves' (ocean.mp3).
        // I'll map 'night' to 'rain' for now or just remove it? No, I'll try to find a source.
        // Let's use a diff source for Night? 
        // Actually, let's just use the 3 reliable ones and the generated ones.
        // I'll keep 'Night' but use a different URL or just duplicate forest for now? No that's bad.
        // I'll try `https://raw.githubusercontent.com/CleverRaven/Cataclysm-DDA/master/data/sound/basic/environment/weather/thunder_steady.ogg` ? No.
        // Let's Stick to Rain, Forest, Waves. I will remove the 'Night' option if I can't confirm it, to avoid 404s.
        // Or I can use the 'pink' noise as a 'Night' proxy? No.
        // I'll just use the 3 + generated.
        { id: 'pink', label: 'Pink Noise', type: 'gen', icon: 'Zap' },
        { id: 'brown', label: 'Brown Noise', type: 'gen', icon: 'Wind' },
    ];

    useEffect(() => {
        if (session?.user) fetchTodayStats();

        // Initialize Audio Element
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        audioRef.current.crossOrigin = "anonymous";

        return () => {
            stopAudio();
        };
    }, [session?.user]);

    useEffect(() => {
        // If sound selection changes, toggle play
        if (isPlayingSound) {
            playAudio(soundType);
        } else {
            stopAudio();
        }
    }, [isPlayingSound, soundType]);

    // Volume Effect
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
        if (gainNodeRef.current) gainNodeRef.current.gain.setTargetAtTime(volume * 0.1, audioContextRef.current?.currentTime || 0, 0.1);
    }, [volume]);

    const playAudio = async (typeId: string) => {
        // Stop any currently playing audio/generator first
        stopAudio(false);

        const sound = SOUNDS.find(s => s.id === typeId);
        if (!sound) return;

        if (sound.type === 'audio' && sound.src) {
            try {
                if (audioRef.current) {
                    audioRef.current.src = sound.src;
                    audioRef.current.volume = volume;
                    audioRef.current.load(); // Force load
                    await audioRef.current.play();
                }
            } catch (e: any) {
                // Ignore AbortError which happens if user quickly switches sounds
                if (e.name !== 'AbortError') {
                    console.error("Audio playback failed:", e);
                }
            }
        } else if (sound.type === 'gen') {
            startGeneratedNoise(typeId as 'white' | 'pink' | 'brown');
        }
    };

    const stopAudio = (fullStop = true) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        stopGeneratedNoise();
        if (fullStop) setIsPlayingSound(false);
    };

    const startGeneratedNoise = (type: 'white' | 'pink' | 'brown') => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
        }
        const ctx = audioContextRef.current;

        // Cleanup old nodes if any
        if (oscillatorRef.current) oscillatorRef.current.stop();

        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;
            if (type === 'pink') {
                const b = [0, 0, 0, 0, 0, 0, 0];
                b[0] = 0.99886 * b[0] + white * 0.0555179;
                b[1] = 0.99332 * b[1] + white * 0.0750759;
                b[2] = 0.96900 * b[2] + white * 0.1538520;
                b[3] = 0.86650 * b[3] + white * 0.3104856;
                b[4] = 0.55000 * b[4] + white * 0.5329522;
                b[5] = -0.7616 * b[5] - white * 0.0168980;
                output[i] = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + white * 0.5362;
                output[i] *= 0.11;
            } else if (type === 'brown') {
                let lastOut = 0;
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5;
            } else {
                output[i] = white;
            }
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume * 0.1;
        noise.connect(gainNode);
        gainNode.connect(ctx.destination);
        noise.start();

        oscillatorRef.current = noise;
        gainNodeRef.current = gainNode;
    };

    const stopGeneratedNoise = () => {
        if (oscillatorRef.current) {
            try {
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
            } catch (e) { } // ignore if already stopped
        }
    };

    // ... (fetchTodayStats, useEffect for timer, etc. - ensure these are preserved by using context matching or careful placement. 
    // Wait, the ReplacementContent replaces the whole block including helper functions if I'm not careful.
    // I will use START and END lines CAREFULLY.
    // I am replacing lines 26 to 104 (Audio Engine) + UI later?

    // Actually, I can replace the whole Audio Engine block (26-104) and then the UI block (254-263).
    // Let's replace the top state/logic first.


    const fetchTodayStats = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data: sessions } = await supabase.from('study_sessions').select('duration_seconds').eq('user_id', session?.user.id).gte('start_time', `${today}T00:00:00`);
        const totalSeconds = sessions?.reduce((acc, s) => acc + s.duration_seconds, 0) || 0;
        const { data: xpLogs } = await supabase.from('xp_logs').select('amount').eq('user_id', session?.user.id).ilike('source', 'Focus%').gte('created_at', `${today}T00:00:00`);
        const totalXP = xpLogs?.reduce((acc, log) => acc + log.amount, 0) || 0;
        setStats({ sessions: sessions?.length || 0, minutes: Math.floor(totalSeconds / 60), xp: totalXP });
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((seconds) => seconds - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (interval) clearInterval(interval);
            handleSessionComplete();
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isActive, timeLeft]);

    const handleSessionComplete = async () => {
        if (!session?.user) return;
        const duration = durations[mode] * 60;
        const xpEarned = Math.floor(duration / 60) * 2;

        await supabase.from('study_sessions').insert({
            user_id: session.user.id,
            mode: mode === 'deepFocus' ? 'deep_focus' : 'pomodoro',
            start_time: sessionStartTime,
            end_time: new Date().toISOString(),
            duration_seconds: duration,
            is_completed: true
        });

        if (xpEarned > 0) {
            await supabase.rpc('add_xp', { user_id: session.user.id, xp_amount: xpEarned, source_label: `Focus Session (${mode})` });
        }
        alert(`Session Complete! +${xpEarned} XP`);
        fetchTodayStats();
        fetchProfile();
        resetTimer(mode); // Pass mode to reset correctly
    };

    const toggleTimer = () => {
        if (!isActive) setSessionStartTime(new Date().toISOString());
        setIsActive(!isActive);
    };

    const resetTimer = (currentMode: typeof mode = mode) => {
        setIsActive(false);
        setTimeLeft(durations[currentMode] * 60);
    };

    const switchMode = (newMode: typeof mode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(durations[newMode] * 60);
    };

    const updateDuration = (key: keyof typeof durations, value: number) => {
        setDurations({ ...durations, [key]: value });
        if (mode === key) setTimeLeft(value * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">
            {/* Settings Button */}
            <div className="absolute -top-12 right-0 lg:top-0">
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-secondary/30 hover:bg-secondary rounded-lg text-gray-400 hover:text-white transition-colors">
                    <Settings size={20} />
                </button>
            </div>

            {/* Main Timer Column */}
            <div className="lg:col-span-2 space-y-12 text-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Focus Zone</h1>
                    <p className="text-muted-foreground">Lock in. Limit distractions. Level up.</p>
                </div>

                {/* Mode Switcher */}
                <div className="flex items-center justify-center gap-4 bg-secondary/30 p-2 rounded-xl inline-flex flex-wrap">
                    <button onClick={() => switchMode('pomodoro')} className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", mode === 'pomodoro' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                        <Brain size={16} /> Pomodoro
                    </button>
                    <button onClick={() => switchMode('deepFocus')} className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", mode === 'deepFocus' ? "bg-purple-600 text-white" : "text-muted-foreground hover:text-foreground")}>
                        <TargetIcon /> Deep Focus
                    </button>
                    <button onClick={() => switchMode('shortBreak')} className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", mode === 'shortBreak' ? "bg-teal-600 text-white" : "text-muted-foreground hover:text-foreground")}>
                        <Coffee size={16} /> Break
                    </button>
                </div>

                {/* Timer Dial */}
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto flex items-center justify-center">
                    <div className={clsx("absolute inset-0 rounded-full border-4 transition-colors duration-500", isActive ? "border-primary shadow-[0_0_50px_rgba(168,85,247,0.4)]" : "border-gray-200 dark:border-white/10")} />
                    <div className="z-10 text-center">
                        <motion.div key={timeLeft} initial={{ scale: 0.95, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl font-bold font-mono tracking-tighter text-foreground drop-shadow-2xl">
                            {formatTime(timeLeft)}
                        </motion.div>
                        <p className="text-muted-foreground mt-2 uppercase tracking-widest text-xs font-semibold">
                            {isActive ? 'Focusing...' : 'Ready to Start'}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                    <button onClick={toggleTimer} className={clsx("w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95", isActive ? "bg-secondary hover:bg-secondary/80 text-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground")}>
                        {isActive ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                    </button>
                    <button onClick={() => resetTimer()} className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <RotateCcw size={20} />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 bg-card p-6 rounded-2xl border border-gray-200 dark:border-white/5">
                    <div className="p-2 border-r border-gray-200 dark:border-white/5">
                        <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Sessions</div>
                        <div className="text-xl font-bold text-foreground">{stats.sessions}</div>
                    </div>
                    <div className="p-2 border-r border-gray-200 dark:border-white/5">
                        <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Minutes</div>
                        <div className="text-xl font-bold text-primary">{stats.minutes}m</div>
                    </div>
                    <div className="p-2">
                        <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">XP</div>
                        <div className="text-xl font-bold text-accent">+{stats.xp}</div>
                    </div>
                </div>
            </div>

            {/* Side Tools Column */}
            <div className="space-y-6">
                <div className="bg-card border border-white/5 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        {isPlayingSound ? <Volume2 size={20} className="text-primary animate-pulse" /> : <VolumeX size={20} className="text-muted-foreground" />}
                        <h3 className="font-bold text-foreground">Soundscapes</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-secondary/30 p-3 rounded-lg">
                                <button
                                    onClick={() => setIsPlayingSound(!isPlayingSound)}
                                    className={clsx(
                                        "p-3 rounded-full transition-all shadow-sm",
                                        isPlayingSound ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                    )}
                                >
                                    {isPlayingSound ? <Volume2 size={24} /> : <VolumeX size={24} />}
                                </button>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Volume</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {SOUNDS.map((sound) => (
                                    <button
                                        key={sound.id}
                                        onClick={() => {
                                            setSoundType(sound.id);
                                            if (!isPlayingSound) setIsPlayingSound(true);
                                        }}
                                        className={clsx(
                                            "p-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 border",
                                            soundType === sound.id
                                                ? "bg-primary/10 text-primary border-primary/50"
                                                : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary/50 hover:text-foreground"
                                        )}
                                    >
                                        <span className="text-lg">
                                            {sound.id === 'rain' && '🌧️'}
                                            {sound.id === 'forest' && '🌲'}
                                            {sound.id === 'waves' && '🌊'}
                                            {sound.id === 'night' && '🌙'}
                                            {sound.id === 'pink' && '⚡'}
                                            {sound.id === 'brown' && '💨'}
                                        </span>
                                        {sound.label}
                                        {soundType === sound.id && isPlayingSound && (
                                            <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[300px]">
                    <div className="bg-secondary/30 p-4 flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <StickyNote size={18} className="text-yellow-500" />
                            <h3 className="font-bold text-foreground text-sm">Scratchpad</h3>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Save size={10} /> Auto-saving</span>
                    </div>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Type distraction-free notes here..." className="flex-1 w-full bg-card p-4 resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground font-mono leading-relaxed" />
                </div>
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card w-full max-w-sm rounded-xl border border-white/10 shadow-2xl relative z-10 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Timer Settings</h2>
                                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(durations).map(([key, val]) => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()} (mins)</label>
                                        <input type="number" value={val} onChange={(e) => updateDuration(key as any, parseInt(e.target.value))} className="w-full bg-secondary/50 border border-white/10 rounded px-3 py-2 text-white focus:border-primary outline-none" min="1" max="180" />
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg mt-6">Done</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TargetIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

export default Focus;
