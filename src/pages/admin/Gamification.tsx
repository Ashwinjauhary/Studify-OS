import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Trophy,
    Briefcase,
    Zap,
    Plus,
    Edit2,
    Trash2,
    Save,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminGamification = () => {
    const [activeTab, setActiveTab] = useState<'careers' | 'skills' | 'achievements'>('careers');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // Dynamic Form State
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        const table = activeTab === 'careers' ? 'careers' : activeTab === 'skills' ? 'skills' : 'achievements';
        const { data: res } = await supabase.from(table).select('*').order('created_at', { ascending: false });
        // For skills, we might want to join careers to show career name, but simple view for now
        if (res) setData(res);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this item? This cannot be undone.')) return;
        const table = activeTab === 'careers' ? 'careers' : activeTab === 'skills' ? 'skills' : 'achievements';

        const { error } = await supabase.from(table).delete().eq('id', id);
        if (!error) setData(data.filter(d => d.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const table = activeTab === 'careers' ? 'careers' : activeTab === 'skills' ? 'skills' : 'achievements';

        let payload = { ...formData };
        // Clean up empty strings for integers
        if (payload.xp_reward) payload.xp_reward = parseInt(payload.xp_reward);
        if (payload.condition_value) payload.condition_value = parseInt(payload.condition_value);

        if (editingItem) {
            const { error } = await supabase.from(table).update(payload).eq('id', editingItem.id);
            if (!error) fetchData();
        } else {
            const { error } = await supabase.from(table).insert([payload]);
            if (!error) fetchData();
        }
        closeModal();
    };

    const openModal = (item?: any) => {
        setEditingItem(item || null);
        if (item) {
            setFormData({ ...item });
        } else {
            // Defaults
            if (activeTab === 'careers') setFormData({ title: '', description: '', icon: '' });
            if (activeTab === 'skills') setFormData({ title: '', description: '', xp_reward: 500, max_level: 10 });
            if (activeTab === 'achievements') setFormData({ title: '', description: '', xp_reward: 100, condition_type: 'streak', condition_value: 10, icon: '🏆' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };

    const tabs = [
        { id: 'careers', label: 'Careers', icon: Briefcase },
        { id: 'skills', label: 'Skills', icon: Zap },
        { id: 'achievements', label: 'Achievements', icon: Trophy },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gamification Engine</h1>
                    <p className="text-muted-foreground">Configure game logic, careers, and rewards.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus size={18} />
                    Add {activeTab.slice(0, -1)}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <tab.icon size={18} />
                        <span className="capitalize">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-muted-foreground">Loading Configuration...</div>
                ) : data.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-muted-foreground">No active {activeTab} found.</div>
                ) : (
                    data.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border p-6 rounded-xl relative group hover:border-primary/50 transition-colors shadow-sm"
                        >
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openModal(item)} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-500/20 rounded text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>

                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-2xl border border-border">
                                    {item.icon || (activeTab === 'careers' ? '💼' : activeTab === 'skills' ? '⚡' : '🏆')}
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground leading-tight">{item.title}</h3>
                                    {activeTab === 'achievements' && <span className="text-xs text-yellow-500 font-mono">{item.xp_reward} XP</span>}
                                    {activeTab === 'skills' && <span className="text-xs text-blue-400 font-mono">Max Lvl {item.max_level}</span>}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>

                            {activeTab === 'achievements' && (
                                <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground font-mono">
                                    <span>Condition</span>
                                    <span>{item.condition_type} &gt; {item.condition_value}</span>
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Dynamic Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl relative z-10"
                        >
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-foreground capitalize">{editingItem ? `Edit ${activeTab.slice(0, -1)}` : `New ${activeTab.slice(0, -1)}`}</h2>
                                    <button type="button" onClick={closeModal}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Title</label>
                                    <input required value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-secondary/50 border border-border rounded px-3 py-2 text-foreground focus:border-primary outline-none" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Description</label>
                                    <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-secondary/50 border border-border rounded px-3 py-2 text-foreground focus:border-primary outline-none h-20 resize-none" />
                                </div>

                                {activeTab === 'achievements' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Type</label>
                                            <select value={formData.condition_type} onChange={e => setFormData({ ...formData, condition_type: e.target.value })} className="w-full bg-secondary/50 border border-border rounded px-3 py-2 text-foreground outline-none">
                                                <option value="streak">Streak</option>
                                                <option value="mission_count">Mission Count</option>
                                                <option value="study_hours">Study Hours</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Value</label>
                                            <input type="number" value={formData.condition_value} onChange={e => setFormData({ ...formData, condition_value: e.target.value })} className="w-full bg-secondary/50 border border-border rounded px-3 py-2 text-foreground outline-none" />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    {activeTab !== 'careers' && (
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">XP Reward</label>
                                            <input type="number" value={formData.xp_reward} onChange={e => setFormData({ ...formData, xp_reward: e.target.value })} className="w-full bg-secondary/50 border border-border rounded px-3 py-2 text-foreground outline-none" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Icon (Emoji/URL)</label>
                                        <input value={formData.icon || ''} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="w-full bg-secondary/50 border border-border rounded px-3 py-2 text-foreground outline-none" />
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg mt-4 flex justify-center items-center gap-2">
                                    <Save size={18} /> Save Item
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminGamification;
