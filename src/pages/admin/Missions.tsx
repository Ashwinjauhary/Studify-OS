import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminMissions = () => {
    // Mission management component
    const [templates, setTemplates] = useState<any[]>([]);
    const [careers, setCareers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'custom',
        difficulty: 'medium',
        xp_reward: 10,
        coin_reward: 5,
        career_id: '',
        is_anticheat_enabled: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [templatesRes, careersRes] = await Promise.all([
            supabase.from('mission_templates').select('*, careers(title)').order('created_at', { ascending: false }),
            supabase.from('careers').select('id, title')
        ]);

        if (templatesRes.data) setTemplates(templatesRes.data);
        if (careersRes.data) setCareers(careersRes.data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            career_id: formData.career_id || null // Handle empty string
        };

        if (editingId) {
            const { error } = await supabase
                .from('mission_templates')
                .update(payload)
                .eq('id', editingId);
            if (!error) fetchData();
        } else {
            const { error } = await supabase
                .from('mission_templates')
                .insert([payload]);
            if (!error) fetchData();
        }
        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will delete the template.')) return;
        const { error } = await supabase.from('mission_templates').delete().eq('id', id);
        if (!error) setTemplates(templates.filter(t => t.id !== id));
    };

    const openModal = (template?: any) => {
        if (template) {
            setEditingId(template.id);
            setFormData({
                title: template.title,
                description: template.description || '',
                type: template.type,
                difficulty: template.difficulty,
                xp_reward: template.xp_reward,
                coin_reward: template.coin_reward,
                career_id: template.career_id || '',
                is_anticheat_enabled: template.is_anticheat_enabled || false
            });
        } else {
            setEditingId(null);
            setFormData({
                title: '',
                description: '',
                type: 'study',
                difficulty: 'medium',
                xp_reward: 20,
                coin_reward: 5,
                career_id: '',
                is_anticheat_enabled: false
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Mission Control</h1>
                    <p className="text-muted-foreground">Manage daily mission templates.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Create Template
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Title</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Difficulty</th>
                            <th className="p-4">Rewards</th>
                            <th className="p-4">Career</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading templates...</td></tr>
                        ) : templates.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No templates found.</td></tr>
                        ) : (
                            templates.map((t) => (
                                <tr key={t.id} className="hover:bg-muted/50 transition-colors group">
                                    <td className="p-4 font-medium text-foreground">
                                        <div>{t.title}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{t.description}</div>
                                    </td>
                                    <td className="p-4"><span className="text-xs uppercase bg-white/5 px-2 py-1 rounded">{t.type}</span></td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs border uppercase font-bold ${t.difficulty === 'epic' ? 'border-purple-500/50 text-purple-400' :
                                            t.difficulty === 'hard' ? 'border-red-500/50 text-red-400' :
                                                t.difficulty === 'medium' ? 'border-yellow-500/50 text-yellow-400' :
                                                    'border-green-500/50 text-green-400'
                                            }`}>
                                            {t.difficulty}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 font-mono text-xs">
                                        <span className="text-blue-400">{t.xp_reward} XP</span> / <span className="text-yellow-400">{t.coin_reward} Coins</span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-400">
                                        {t.careers?.title || '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openModal(t)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card w-full max-w-lg rounded-xl border border-white/10 shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                                <h2 className="text-xl font-bold text-foreground">{editingId ? 'Edit Mission' : 'New Mission'}</h2>
                                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Title</label>
                                    <input
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                                        placeholder="e.g. Deep Focus Session"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none h-24 resize-none"
                                        placeholder="What needs to be done?"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                                        >
                                            <option value="study">Study</option>
                                            <option value="habit">Habit</option>
                                            <option value="skill">Skill</option>
                                            <option value="reflection">Reflection</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Difficulty</label>
                                        <select
                                            value={formData.difficulty}
                                            onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                            <option value="epic">Epic</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">XP Reward</label>
                                        <input
                                            type="number"
                                            value={formData.xp_reward}
                                            onChange={e => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Coin Reward</label>
                                        <input
                                            type="number"
                                            value={formData.coin_reward}
                                            onChange={e => setFormData({ ...formData, coin_reward: parseInt(e.target.value) })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <select
                                        value={formData.career_id}
                                        onChange={e => setFormData({ ...formData, career_id: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                                    >
                                        <option value="">-- General Mission --</option>
                                        {careers.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-3 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    <input
                                        type="checkbox"
                                        id="anticheat"
                                        checked={formData.is_anticheat_enabled}
                                        onChange={e => setFormData({ ...formData, is_anticheat_enabled: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary bg-background"
                                    />
                                    <div>
                                        <label htmlFor="anticheat" className="block text-sm font-bold text-red-500 cursor-pointer select-none">Enable Anti-Cheat Enforcement</label>
                                        <p className="text-xs text-red-400">Timer will pause if user switches tabs.</p>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <Save size={18} />
                                        Save Template
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminMissions;
