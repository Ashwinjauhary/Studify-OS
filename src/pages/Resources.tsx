import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Image as ImageIcon, FileText, Link as LinkIcon, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface Resource {
    id: string;
    title: string;
    description: string;
    type: 'link' | 'pdf' | 'image' | 'note' | 'book';
    url: string;
    subject: string;
    created_at: string;
}

const Resources = () => {
    const { profile } = useAuthStore();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);

    // Form State
    const [newRes, setNewRes] = useState({ title: '', description: '', type: 'link', url: '', subject: 'General' });
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (profile) fetchResources();
    }, [profile]);

    const fetchResources = async () => {
        const { data } = await supabase
            .from('resources')
            .select('*')
            .eq('user_id', profile?.id)
            .order('created_at', { ascending: false });

        if (data) setResources(data as Resource[]);
        setLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setUploading(true);

        let finalUrl = newRes.url;

        // Handle File Upload
        if (newRes.type !== 'link' && file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('resource_files')
                .upload(fileName, file);

            if (uploadError) {
                alert('Upload failed: ' + uploadError.message);
                setUploading(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('resource_files')
                .getPublicUrl(fileName);

            finalUrl = publicUrl;
        }

        // Insert Record
        const { error } = await supabase.from('resources').insert({
            user_id: profile.id,
            title: newRes.title,
            description: newRes.description,
            type: newRes.type,
            url: finalUrl,
            subject: newRes.subject
        });

        if (error) {
            alert('Error adding resource: ' + error.message);
        } else {
            setIsFormatModalOpen(false);
            setNewRes({ title: '', description: '', type: 'link', url: '', subject: 'General' });
            setFile(null);
            fetchResources();
        }
        setUploading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;

        const { error } = await supabase.from('resources').delete().eq('id', id);
        if (!error) {
            setResources(prev => prev.filter(r => r.id !== id));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="text-red-400" />;
            case 'image': return <ImageIcon className="text-purple-400" />;
            case 'link': return <LinkIcon className="text-blue-400" />;
            default: return <Book className="text-yellow-400" />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Resource Library</h1>
                    <p className="text-muted-foreground">Organize your study materials, links, and documents.</p>
                </div>
                <button
                    onClick={() => setIsFormatModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={20} /> Add Resource
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((res) => (
                    <motion.div
                        key={res.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card border border-gray-200 dark:border-white/5 p-6 rounded-xl hover:border-primary/30 transition-all group relative"
                    >
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(res.id)} className="text-muted-foreground hover:text-red-500 p-1">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-secondary/50 rounded-lg w-fit">
                            {getIcon(res.type)}
                        </div>

                        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1">{res.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">{res.description || 'No description provided.'}</p>

                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">{res.subject}</span>
                            <a
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-accent text-sm flex items-center gap-1 hover:underline"
                            >
                                {res.type === 'link' ? 'Visit Link' : 'Download'} <ExternalLink size={14} />
                            </a>
                        </div>
                    </motion.div>
                ))}
            </div>

            {!loading && resources.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <Book size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No resources yet. Add your first link or file!</p>
                </div>
            )}

            {/* Add Modal */}
            <AnimatePresence>
                {isFormatModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-card border border-gray-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6"
                        >
                            <h2 className="text-xl font-bold text-foreground mb-6">Add New Resource</h2>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Title</label>
                                    <input
                                        required
                                        value={newRes.title}
                                        onChange={e => setNewRes({ ...newRes, title: e.target.value })}
                                        className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/5 focus:border-primary focus:outline-none"
                                        placeholder="Calculus Notes, React Docs..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Type</label>
                                        <select
                                            value={newRes.type}
                                            onChange={e => setNewRes({ ...newRes, type: e.target.value as any })}
                                            className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/5 focus:border-primary focus:outline-none"
                                        >
                                            <option value="link">Link</option>
                                            <option value="pdf">PDF Document</option>
                                            <option value="image">Image</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Subject</label>
                                        <input
                                            value={newRes.subject}
                                            onChange={e => setNewRes({ ...newRes, subject: e.target.value })}
                                            className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/5 focus:border-primary focus:outline-none"
                                            placeholder="General"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                                        {newRes.type === 'link' ? 'URL' : 'File'}
                                    </label>
                                    {newRes.type === 'link' ? (
                                        <input
                                            type="url"
                                            required
                                            value={newRes.url}
                                            onChange={e => setNewRes({ ...newRes, url: e.target.value })}
                                            className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/5 focus:border-primary focus:outline-none"
                                            placeholder="https://..."
                                        />
                                    ) : (
                                        <input
                                            type="file"
                                            required
                                            onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                            className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/5 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Description (Optional)</label>
                                    <textarea
                                        value={newRes.description}
                                        onChange={e => setNewRes({ ...newRes, description: e.target.value })}
                                        className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/5 focus:border-primary focus:outline-none h-24 resize-none"
                                        placeholder="Brief description..."
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormatModalOpen(false)}
                                        className="flex-1 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {uploading ? 'Saving...' : 'Add Resource'}
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

export default Resources;
