import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Send,
    Bell,
    Users,
    AlertTriangle
} from 'lucide-react';

const AdminCommunication = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [target, setTarget] = useState('all');
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        if (data) setHistory(data);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            let userIds: string[] = [];

            if (target === 'all') {
                const { data } = await supabase.from('profiles').select('id');
                if (data) userIds = data.map(u => u.id);
            } else if (target === 'admin') {
                const { data } = await supabase.from('profiles').select('id').eq('role', 'admin');
                if (data) userIds = data.map(u => u.id);
            }

            if (userIds.length > 0) {
                const notifications = userIds.map(uid => ({
                    user_id: uid,
                    title,
                    message,
                    type,
                    is_read: false
                }));

                const { error } = await supabase.from('notifications').insert(notifications);

                if (!error) {
                    alert(`Sent to ${userIds.length} users!`);
                    setTitle('');
                    setMessage('');
                    fetchHistory();
                } else {
                    console.error(error);
                    alert('Failed to send.');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Comms Center</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Send Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Send className="text-primary" />
                            <h2 className="text-xl font-bold text-foreground">Broadcast Message</h2>
                        </div>

                        <form onSubmit={handleSend} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Target Audience</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                                        <select
                                            value={target}
                                            onChange={(e) => setTarget(e.target.value)}
                                            className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-3 py-2 text-foreground outline-none focus:border-primary"
                                        >
                                            <option value="all">Check All Users ({target === 'all' ? 'Everyone' : '...'})</option>
                                            <option value="admin">Admins Only</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Type</label>
                                    <div className="relative">
                                        <AlertTriangle className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-3 py-2 text-foreground outline-none focus:border-primary"
                                        >
                                            <option value="info">Information ℹ️</option>
                                            <option value="success">Success ✅</option>
                                            <option value="warning">Warning ⚠️</option>
                                            <option value="motivation">Motivation 🔥</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Title</label>
                                <input
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="System Update 2.0"
                                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Message Body</label>
                                <textarea
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="We have deployed new features..."
                                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:border-primary h-32 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {sending ? 'Transmitting...' : <><Send size={18} /> Send Broadcast</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History Panel */}
                <div className="bg-card border border-border p-6 rounded-xl h-fit shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="text-yellow-500" />
                        <h2 className="text-xl font-bold text-foreground">Recent Alerts</h2>
                    </div>

                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <div className="text-muted-foreground text-sm">No recent broadcasts.</div>
                        ) : (
                            history.map((notif) => (
                                <div key={notif.id} className="p-3 bg-secondary/30 rounded-lg text-sm border border-border">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`font-bold capitalize ${notif.type === 'warning' ? 'text-red-400' :
                                            notif.type === 'success' ? 'text-green-400' :
                                                'text-blue-400'
                                            }`}>{notif.type}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(notif.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-foreground font-medium mb-1">{notif.title}</h3>
                                    <p className="text-muted-foreground text-xs line-clamp-2">{notif.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCommunication;
