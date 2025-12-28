import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Send, Globe, MessageCircle, Search, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface Message {
    id: string;
    sender_id: string;
    receiver_id?: string;
    channel_id?: string;
    content: string;
    created_at: string;
    sender?: {
        full_name: string;
        avatar_url: string;
    };
}

const Chat = () => {
    const { profile } = useAuthStore();
    const [activeChannel, setActiveChannel] = useState<'global' | string>('global'); // 'global' or friend_id
    const [friends, setFriends] = useState<any[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [friendSearch, setFriendSearch] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch Friends
    useEffect(() => {
        const fetchFriends = async () => {
            if (!profile) return;
            const { data: rels } = await supabase
                .from('relationships')
                .select(`
                    id, follower_id, following_id,
                    follower:follower_id(id, full_name, avatar_url),
                    following:following_id(id, full_name, avatar_url)
                `)
                .or(`follower_id.eq.${profile.id},following_id.eq.${profile.id}`)
                .eq('status', 'accepted');

            if (rels) {
                const formatted = rels.map((r: any) => {
                    const isFollower = r.follower_id === profile.id;
                    const friend = isFollower ? r.following : r.follower;
                    return {
                        id: friend.id,
                        name: friend.full_name,
                        avatar_url: friend.avatar_url,
                        relId: r.id
                    };
                });
                setFriends(formatted);
            }
        };
        fetchFriends();
    }, [profile]);

    // Fetch Messages & Subscribe
    useEffect(() => {
        if (!profile) return;
        setLoading(true);

        const fetchMessages = async () => {
            let query = supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id(full_name, avatar_url)
                `)
                .order('created_at', { ascending: true })
                .limit(100);

            if (activeChannel === 'global') {
                query = query.eq('channel_id', 'global');
            } else {
                // Friend Chat
                query = query.or(`and(sender_id.eq.${profile.id},receiver_id.eq.${activeChannel}),and(sender_id.eq.${activeChannel},receiver_id.eq.${profile.id})`);
            }

            const { data } = await query;
            if (data) setMessages(data as Message[]);
            setLoading(false);
            setTimeout(scrollToBottom, 100);
        };

        fetchMessages();

        // Subscription
        const channel = supabase
            .channel('chat_room')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                async (payload) => {
                    const msg = payload.new as Message;

                    // Fetch sender details for the new message
                    const { data: senderData } = await supabase
                        .from('profiles')
                        .select('full_name, avatar_url')
                        .eq('id', msg.sender_id)
                        .single();

                    if (senderData) msg.sender = senderData;

                    // Filter incoming logic
                    let shouldAdd = false;
                    if (activeChannel === 'global' && msg.channel_id === 'global') shouldAdd = true;
                    else if (activeChannel !== 'global' && !msg.channel_id) {
                        if (
                            (msg.sender_id === profile.id && msg.receiver_id === activeChannel) ||
                            (msg.sender_id === activeChannel && msg.receiver_id === profile.id)
                        ) {
                            shouldAdd = true;
                        }
                    }

                    if (shouldAdd) {
                        setMessages((prev) => [...prev, msg]);
                        setTimeout(scrollToBottom, 100);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeChannel, profile]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !profile) return;

        const msgContent = newMessage;
        setNewMessage(''); // optimistic clear

        const payload: any = {
            sender_id: profile.id,
            content: msgContent
        };

        if (activeChannel === 'global') {
            payload.channel_id = 'global';
        } else {
            payload.receiver_id = activeChannel;
        }

        const { error } = await supabase.from('messages').insert([payload]);
        if (error) console.error("Failed to send", error);
    };

    const getActiveFriendName = () => {
        if (activeChannel === 'global') return 'Global Chat';
        return friends.find(f => f.id === activeChannel)?.name || 'Unknown';
    };

    const filteredFriends = friends.filter(f =>
        f.name.toLowerCase().includes(friendSearch.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-2rem)] flex gap-6 max-w-7xl mx-auto">
            {/* Sidebar / List */}
            <div className="w-80 flex flex-col gap-4 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-secondary/30">
                    <h2 className="font-bold text-lg mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={friendSearch}
                            onChange={(e) => setFriendSearch(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {/* Global Chat Item */}
                    <button
                        onClick={() => setActiveChannel('global')}
                        className={clsx(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                            activeChannel === 'global' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <div className={clsx("p-2 rounded-full", activeChannel === 'global' ? "bg-white/20" : "bg-primary/10 text-primary")}>
                            <Globe size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">Global Chat</p>
                            <p className="text-xs opacity-70 truncate">Talk to everyone!</p>
                        </div>
                    </button>

                    <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mt-4">
                        Direct Messages
                    </div>

                    {filteredFriends.map((friend) => (
                        <button
                            key={friend.id}
                            onClick={() => setActiveChannel(friend.id)}
                            className={clsx(
                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                                activeChannel === friend.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-white/10 overflow-hidden">
                                {friend.avatar_url ? (
                                    <img src={friend.avatar_url} alt={friend.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-sm">{friend.name[0]}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{friend.name}</p>
                                <p className="text-xs opacity-70 truncate">Click to chat</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-4 border-b border-border bg-card flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        {activeChannel === 'global' ? (
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <Globe size={20} />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                                {friends.find(f => f.id === activeChannel)?.avatar_url && (
                                    <img src={friends.find(f => f.id === activeChannel).avatar_url} className="w-full h-full object-cover" />
                                )}
                            </div>
                        )}
                        <div>
                            <h2 className="font-bold text-foreground flex items-center gap-2">
                                {getActiveFriendName()}
                                {activeChannel === 'global' && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] rounded-full">Public</span>}
                            </h2>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                            </p>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground">
                        <MoreVertical size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary/20">
                    {loading ? (
                        <div className="flex justify-center pt-10 text-muted-foreground">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                            <MessageCircle size={64} strokeWidth={1} />
                            <p className="mt-4">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.sender_id === profile?.id;
                            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id);

                            return (
                                <div key={msg.id} className={clsx("flex gap-3", isMe ? "justify-end" : "justify-start")}>
                                    {!isMe && (
                                        <div className="w-8 h-8 rounded-full bg-background border border-border flex-shrink-0 flex items-center justify-center overflow-hidden mt-1 text-xs font-bold text-muted-foreground">
                                            {showAvatar ? (
                                                msg.sender?.avatar_url ? (
                                                    <img src={msg.sender.avatar_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    msg.sender?.full_name?.[0]
                                                )
                                            ) : (
                                                <div className="w-full h-full bg-transparent" />
                                            )}
                                        </div>
                                    )}
                                    <div className={clsx("max-w-[70%]", isMe ? "items-end" : "items-start")}>
                                        {!isMe && showAvatar && (
                                            <p className="text-[10px] text-muted-foreground ml-1 mb-1">{msg.sender?.full_name}</p>
                                        )}
                                        <div className={clsx(
                                            "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                                            isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card border border-border text-foreground rounded-bl-none"
                                        )}>
                                            {msg.content}
                                        </div>
                                        <p className={clsx("text-[10px] text-muted-foreground mt-1", isMe ? "text-right mr-1" : "ml-1")}>
                                            {format(new Date(msg.created_at), 'h:mm a')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 bg-card border-t border-border">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Message ${activeChannel === 'global' ? '#global' : 'friend'}...`}
                            className="flex-1 bg-secondary text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Chat;
