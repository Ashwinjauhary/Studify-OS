import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Search, MessageCircle, Check, X } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import ChatWindow from '../components/social/ChatWindow';
import UserProfileModal from '../components/social/UserProfileModal';

const Social = () => {
    const { profile } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'friends'>('leaderboard');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    // Social State
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (profile) {
            fetchLeaderboard();
            fetchSocialData();
        }
    }, [profile]);

    const fetchLeaderboard = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, current_level, current_xp, avatar_url')
            .order('current_xp', { ascending: false })
            .limit(10);

        if (data) {
            const formatted = data.map(user => ({
                id: user.id,
                name: user.full_name,
                level: user.current_level,
                xp: user.current_xp,
                avatar: user.full_name ? user.full_name[0] : '?',
                isMe: user.id === profile?.id,
                avatar_url: user.avatar_url
            }));
            setLeaderboard(formatted);
        }
    };

    const fetchSocialData = async () => {
        if (!profile) return;

        // 1. Fetch Relationships (Confirmed Friends)
        // We look for accepted relationships where I am either follower or following
        const { data: rels } = await supabase
            .from('relationships')
            .select(`
id, status, follower_id, following_id,
    follower: follower_id(id, full_name, avatar_url, current_level),
        following: following_id(id, full_name, avatar_url, current_level)
            `)
            .or(`follower_id.eq.${profile.id}, following_id.eq.${profile.id} `);

        const myFriends: any[] = [];
        const myRequests: any[] = [];

        rels?.forEach((rel: any) => {
            if (rel.status === 'accepted') {
                // Determine who the friend is (the one who isn't me)
                const isFollower = rel.follower_id === profile.id;
                const friendData = isFollower ? rel.following : rel.follower;

                myFriends.push({
                    id: friendData.id,
                    name: friendData.full_name,
                    level: friendData.current_level,
                    avatar: friendData.full_name?.[0] || '?',
                    avatar_url: friendData.avatar_url,
                    relId: rel.id
                });
            } else if (rel.status === 'pending') {
                // If I am following (follower), it's a sent request (ignoring for main list for now, maybe separate view?)
                // If I am following_id, it's an incoming request
                if (rel.following_id === profile.id) {
                    myRequests.push({
                        id: rel.follower.id,
                        name: rel.follower.full_name,
                        level: rel.follower.current_level,
                        avatar: rel.follower.full_name?.[0] || '?',
                        relId: rel.id
                    });
                }
            }
        });

        setFriends(myFriends);
        setRequests(myRequests);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', `% ${searchQuery}% `)
            .neq('id', profile?.id) // Don't show myself
            .limit(5);

        if (data) setSearchResults(data);
    };

    const sendRequest = async (targetId: string) => {
        if (!profile) return;

        // Check if already friends or requested
        // Ideally handled by DB constraint, but UI feedback is good
        const { error } = await supabase
            .from('relationships')
            .insert({
                follower_id: profile.id,
                following_id: targetId,
                status: 'pending'
            });

        if (!error) {
            alert('Friend request sent!');
            setSearchResults([]); // Clear search logic or update UI state
            setSearchQuery('');
        } else {
            alert('Could not send request. You might already be connected.');
        }
    };

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
        fetchSocialData(); // Refresh lists
    };

    // Chat State
    const [activeChatFriend, setActiveChatFriend] = useState<any>(null);

    // Profile View State
    const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Community Hub</h1>
                    <p className="text-muted-foreground">Connect, compete, and grow together.</p>
                </div>

                <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg">
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                            activeTab === 'leaderboard' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Leaderboard
                    </button>
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all relative",
                            activeTab === 'friends' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Friends
                        {requests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                                {requests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'leaderboard' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-200 dark:border-white/5 flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder="Search students..."
                                className="w-full bg-secondary py-2 pl-10 pr-4 rounded-lg text-foreground border border-transparent focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-white/5">
                        {leaderboard.map((user, index) => (
                            <div
                                key={user.id}
                                onClick={() => setViewingProfileId(user.id)}
                                className={clsx(
                                    "p-4 flex items-center gap-4 transition-colors cursor-pointer",
                                    user.isMe ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-secondary"
                                )}
                            >
                                <div className="w-8 text-center font-bold text-muted-foreground">
                                    {index + 1}
                                </div>
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground border border-gray-200 dark:border-white/10 overflow-hidden relative">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{user.avatar}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-foreground flex items-center gap-2">
                                        {user.name}
                                        {index < 3 && <Trophy size={14} className={clsx(
                                            index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-400" : "text-amber-600"
                                        )} />}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Level {user.level} Scholar</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-accent font-bold">{user.xp?.toLocaleString()} XP</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {activeTab === 'friends' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Pending Requests */}
                    {requests.length > 0 && (
                        <div className="bg-card border border-gray-200 dark:border-white/5 p-4 rounded-xl">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Pending Requests</h3>
                            <div className="space-y-3">
                                {requests.map(req => (
                                    <div key={req.id} className="flex items-center justify-between bg-secondary p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground font-bold">
                                                {req.avatar}
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground">{req.name}</div>
                                                <div className="text-xs text-muted-foreground">Wants to be your friend</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => respondToRequest(req.relId, true)}
                                                className="p-2 bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-all"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => respondToRequest(req.relId, false)}
                                                className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add Friend Section */}
                    <div className="bg-card border border-gray-200 dark:border-white/5 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-foreground mb-4">Add Friends</h3>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name..."
                                className="flex-1 bg-secondary text-foreground px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none"
                            />
                            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                                Search
                            </button>
                        </form>

                        {searchResults.length > 0 && (
                            <div className="space-y-2">
                                {searchResults.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-gray-200 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs font-bold text-foreground">
                                                {user.full_name?.[0] || '?'}
                                            </div>
                                            <span className="text-foreground font-medium">{user.full_name}</span>
                                        </div>
                                        <button
                                            onClick={() => sendRequest(user.id)}
                                            className="text-xs bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded-md transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Friends Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friends.length === 0 && (
                            <div className="col-span-2 text-center py-10 text-muted-foreground bg-secondary/30 rounded-xl border border-gray-200 dark:border-white/5 border-dashed">
                                No friends yet. Search above to connect with peers!
                            </div>
                        )}
                        {friends.map((friend) => (
                            <div
                                key={friend.id}
                                onClick={() => setViewingProfileId(friend.id)}
                                className="bg-card border border-gray-200 dark:border-white/5 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-lg overflow-hidden">
                                        {friend.avatar_url ? (
                                            <img src={friend.avatar_url} alt={friend.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{friend.avatar}</span>
                                        )}
                                    </div>
                                    <div className={clsx(
                                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                                        "bg-green-500" // Assume online for now
                                    )} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-foreground">{friend.name}</div>
                                    <div className="text-xs text-muted-foreground">Level {friend.level}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveChatFriend(friend);
                                        }}
                                        className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <MessageCircle size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Chat Overlay */}
            {activeChatFriend && (
                <ChatWindow
                    friend={activeChatFriend}
                    onClose={() => setActiveChatFriend(null)}
                />
            )}

            {/* Profile Modal */}
            {viewingProfileId && (
                <UserProfileModal
                    userId={viewingProfileId}
                    onClose={() => setViewingProfileId(null)}
                    onMessage={(user) => setActiveChatFriend(user)}
                />
            )}
        </div>
    );
};

export default Social;
