import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Code, Terminal, Database, BookOpen, CheckCircle, Lock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

interface CareerType {
    id: string;
    title: string;
    description?: string;
}

interface SkillType {
    id: string;
    title: string;
    career_id: string;
    max_level: number;
    current_level: number;
    current_xp: number;
    xp_to_next: number;
    locked: boolean;
}

const Career = () => {
    const { profile } = useAuthStore();
    const [careers, setCareers] = useState<CareerType[]>([]);
    const [selectedCareer, setSelectedCareer] = useState<string>(profile?.career_goal || 'Web Developer');
    const [skills, setSkills] = useState<SkillType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCareers = async () => {
            const { data } = await supabase.from('careers').select('*');
            if (data) setCareers(data);
            else {
                // Fallback if DB empty
                setCareers([
                    { id: '1', title: 'Web Developer', description: 'Build modern websites' },
                    { id: '2', title: 'Data Scientist', description: 'Analyze data' },
                    { id: '3', title: 'App Developer', description: 'Create mobile apps' },
                ]);
            }
        };
        fetchCareers();
    }, []);

    useEffect(() => {
        const fetchSkills = async () => {
            if (!profile || !selectedCareer) return;
            setLoading(true);

            // 1. Get Career ID (Simple mapping for now, ideally DB lookup)
            const careerObj = careers.find(c => c.title === selectedCareer);
            const careerId = careerObj?.id;

            // 2. Fetch Skills for this career
            // Note: In a real app, we'd filter by career_id. For now, fetching all or mocking the connection if table empty.
            let { data: allSkills } = await supabase
                .from('skills')
                .select('*')
                .eq('career_id', careerId || '1'); // Fallback to '1'

            // If no skills in DB, generate some mocks for the UI to work
            if (!allSkills || allSkills.length === 0) {
                // Mocking locally if DB blank for demo
                allSkills = [
                    { id: 's1', title: 'HTML & CSS', max_level: 10, career_id: careerId },
                    { id: 's2', title: 'JavaScript', max_level: 10, career_id: careerId },
                    { id: 's3', title: 'React.js', max_level: 10, career_id: careerId },
                ] as any;
            }

            // 3. Fetch User Progress
            const { data: userSkills } = await supabase
                .from('user_skills')
                .select('*')
                .eq('user_id', profile.id);

            // 4. Merge
            const merged = allSkills?.map((skill: any, index: number) => {
                const userSkill = userSkills?.find(us => us.skill_id === skill.id);
                return {
                    id: skill.id,
                    title: skill.title,
                    career_id: skill.career_id,
                    max_level: skill.max_level || 10,
                    current_level: userSkill?.current_level || 0,
                    current_xp: userSkill?.current_xp || 0,
                    xp_to_next: 1000, // Fixed 1000 for simplicity
                    locked: index > 0 && (!userSkills?.find(us => us.skill_id === allSkills?.[index - 1].id)) // Lock if prev not started (simple logic)
                };
            });

            if (merged) setSkills(merged);
            setLoading(false);
        };

        if (selectedCareer) fetchSkills();
    }, [selectedCareer, careers, profile]);

    const getIcon = (title: string) => {
        if (title.includes('Web')) return Code;
        if (title.includes('Data')) return Database;
        if (title.includes('App')) return Terminal;
        return BookOpen;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Career Path</h1>
                <p className="text-muted-foreground">Select your destination. We'll map the journey.</p>
            </div>

            {/* Career Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {careers.map((c) => {
                    const Icon = getIcon(c.title);
                    const isSelected = selectedCareer === c.title;
                    return (
                        <motion.div
                            key={c.id}
                            whileHover={{ y: -5 }}
                            onClick={() => setSelectedCareer(c.title)}
                            className={`p-6 rounded-xl border cursor-pointer transition-all ${isSelected
                                ? 'bg-primary/10 border-primary ring-1 ring-primary'
                                : 'bg-card border-gray-200 dark:border-white/5 hover:bg-secondary/50'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                                }`}>
                                <Icon size={24} />
                            </div>
                            <h3 className="font-bold text-foreground">{c.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{c.description || 'Explore Path'}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Skill Tree */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Briefcase className="text-accent" size={24} />
                        Skill Tree: {selectedCareer}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        {loading ? 'Loading...' : `Total Progress: ${Math.round((skills.reduce((a, b) => a + b.current_level, 0) / (skills.length * 10 || 1)) * 100)}%`}
                    </span>
                </div>

                <div className="space-y-4">
                    {skills.map((skill, index) => (
                        <div key={skill.id} className="relative">
                            {/* Connector Line */}
                            {index !== skills.length - 1 && (
                                <div className="absolute left-[26px] top-12 bottom-[-16px] w-[2px] bg-border z-0" />
                            )}

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative z-10 bg-card border ${skill.locked ? 'border-gray-200 dark:border-white/5 opacity-60' : 'border-gray-200 dark:border-white/10'} p-6 rounded-xl flex items-center gap-6`}
                            >
                                <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center shrink-0 ${skill.locked ? 'border-gray-200 dark:border-gray-800 bg-secondary dark:bg-gray-900 text-muted-foreground' : 'border-primary/20 bg-primary/10 text-primary'
                                    }`}>
                                    {skill.locked ? <Lock size={20} /> : <CheckCircle size={20} />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between mb-2">
                                        <h3 className="font-bold text-foreground text-lg">{skill.title}</h3>
                                        <span className="text-sm text-muted-foreground">Lvl {skill.current_level} / {skill.max_level}</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000"
                                            style={{ width: `${(skill.current_xp / skill.xp_to_next) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {skill.locked ? 'Complete previous skills to unlock' : `${skill.current_xp} / ${skill.xp_to_next} XP to next level`}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                    {!loading && skills.length === 0 && (
                        <div className="text-center text-muted-foreground py-10">
                            No skills found for this career path yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Career;
