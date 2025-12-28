import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { Bell, Check, X, UserPlus, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
    const { profile } = useAuthStore();
    const [requests, setRequests] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]); // System notifications
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!profile) return;

        // 1. Fetch Friend Requests
        const { data: rels } = await supabase
            .from('relationships')
            .select(`
                id, created_at,
                follower:follower_id(id, full_name, avatar_url, current_level)
            `)
            .eq('following_id', profile.id)
            .eq('status', 'pending');

        if (rels) {
            setRequests(rels.map(r => ({
                id: r.id,
                type: 'friend_request',
                user: r.follower,
                created_at: r.created_at
            })));
        }

        // 2. Fetch System Notifications (Placeholder structure for now)
        // You would typically have a 'notifications' table. 
        // For now, we'll mock one empty or static if table doesn't exist, 
        // but based on previous context, a notifications table was mentioned.
        const { data: notifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (notifs) {
            setAlerts(notifs);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, [profile]);

    const respondToRequest = async (relId: string, accept: boolean) => {
        if (accept) {
            await supabase
                .from('relationships')
                .update({ status: 'accepted' })
                .eq('id', relId);
        } else {
            await supabase
                .from('relationships')
                .delete()
                .eq('id', relId);
        }
        // Remove from local state immediately for UI responsiveness
        setRequests(prev => prev.filter(r => r.id !== relId));
    };

    const markAsRead = async (notifId: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notifId);
        setAlerts(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                    <Bell className="text-primary" />
                    Inbox & Notifications
                </h1>
                <p className="text-muted-foreground">Manage your connection requests and system alerts.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Friend Requests Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <UserPlus size={20} className="text-accent" />
                        Friend Requests
                        <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                            {requests.length}
                        </span>
                    </h2>

                    {loading ? (
                        <div className="text-muted-foreground">Loading specific requests...</div>
                    ) : requests.length === 0 ? (
                        <div className="p-8 bg-card border border-border rounded-xl text-center text-muted-foreground border-dashed">
                            No pending friend requests.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((req) => (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-card border border-border p-4 rounded-xl flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold border border-border overflow-hidden">
                                            {req.user.avatar_url ? (
                                                <img src={req.user.avatar_url} alt={req.user.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                req.user.full_name?.[0]
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground text-sm">{req.user.full_name}</p>
                                            <p className="text-xs text-muted-foreground">Level {req.user.current_level}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => respondToRequest(req.id, true)}
                                            className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors border border-green-500/20"
                                            title="Accept"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => respondToRequest(req.id, false)}
                                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20"
                                            title="Decline"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* System Notifications Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <ShieldAlert size={20} className="text-blue-500" />
                        System Alerts
                    </h2>

                    {loading ? (
                        <div className="text-muted-foreground">Loading alerts...</div>
                    ) : alerts.length === 0 ? (
                        <div className="p-8 bg-card border border-border rounded-xl text-center text-muted-foreground border-dashed">
                            No new notifications.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={clsx(
                                        "bg-card border p-4 rounded-xl transition-opacity",
                                        notif.is_read ? "border-border opacity-60" : "border-primary/30 bg-primary/5"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-sm text-foreground">{notif.title}</h3>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">{notif.message}</p>
                                    {!notif.is_read && (
                                        <button
                                            onClick={() => markAsRead(notif.id)}
                                            className="text-[10px] text-primary hover:underline"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
