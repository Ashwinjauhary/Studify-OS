import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, UserPlus, MessageCircle, Trophy, Flame, Star, Crown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface UserProfileModalProps {
    userId: string;
    onClose: () => void;
    onMessage?: (user: any) => void;
}

const UserProfileModal = ({ userId, onClose, onMessage }: UserProfileModalProps) => {
    const { profile } = useAuthStore();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [relationship, setRelationship] = useState<string>('none'); // none, pending, friend

    useEffect(() => {
        const fetchUser = async () => {
            // 1. Fetch Profile
            const { data: userData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (userData) setUser(userData);

            // 2. Check Relationship
            if (profile) {
                const { data: rel } = await supabase
                    .from('relationships')
                    .select('status, follower_id, following_id')
                    .or(`and(follower_id.eq.${profile.id},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${profile.id})`)
                    .single();

                if (rel) {
                    if (rel.status === 'accepted') setRelationship('friend');
                    else if (rel.status === 'pending') setRelationship('pending');
                }
            }
            setLoading(false);
        };

        if (userId) fetchUser();
    }, [userId, profile]);

    const handleSendRequest = async () => {
        if (!profile || !user) return;
        const { error } = await supabase
            .from('relationships')
            .insert({
                follower_id: profile.id,
                following_id: user.id,
                status: 'pending'
            });

        if (!error) {
            setRelationship('pending');
            alert('Friend request sent!');
        }
    };

    if (!user && !loading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Banner / Header */}
                <div className="h-32 bg-gradient-to-r from-primary to-accent relative">
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                        <div className="w-24 h-24 rounded-full border-4 border-card bg-secondary overflow-hidden shadow-lg">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-foreground">
                                    {user?.full_name?.[0]}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-6 text-center">
                    {loading ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-6 bg-secondary rounded w-1/2 mx-auto"></div>
                            <div className="h-4 bg-secondary rounded w-1/3 mx-auto"></div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-foreground">{user.full_name}</h2>
                            <div className="flex items-center justify-center gap-2 mt-1 mb-6">
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/20 flex items-center gap-1">
                                    <Crown size={12} />
                                    Level {user.current_level} Scholar
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="p-3 bg-secondary rounded-xl border border-border">
                                    <div className="text-orange-500 flex justify-center mb-1"><Flame size={20} /></div>
                                    <div className="font-bold text-foreground">{user.current_streak}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase">Streak</div>
                                </div>
                                <div className="p-3 bg-secondary rounded-xl border border-border">
                                    <div className="text-yellow-400 flex justify-center mb-1"><Star size={20} /></div>
                                    <div className="font-bold text-foreground">{user.current_xp}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase">Total XP</div>
                                </div>
                                <div className="p-3 bg-secondary rounded-xl border border-border">
                                    <div className="text-purple-500 flex justify-center mb-1"><Trophy size={20} /></div>
                                    <div className="font-bold text-foreground">#{Math.floor(Math.random() * 50) + 1}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase">Rank</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-center">
                                {relationship === 'friend' ? (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            if (onMessage) onMessage(user);
                                        }}
                                        className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={18} />
                                        Message
                                    </button>
                                ) : relationship === 'pending' ? (
                                    <button disabled className="flex-1 bg-secondary text-muted-foreground py-2.5 rounded-xl font-bold cursor-not-allowed">
                                        Request Pending
                                    </button>
                                ) : user.id !== profile?.id ? (
                                    <button
                                        onClick={handleSendRequest}
                                        className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <UserPlus size={18} />
                                        Add Friend
                                    </button>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
