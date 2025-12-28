import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Send, X, MessageSquare, Loader } from 'lucide-react';
import { format } from 'date-fns';

interface ChatWindowProps {
    friend: any;
    onClose: () => void;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
}

const ChatWindow = ({ friend, onClose }: ChatWindowProps) => {
    const { profile } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!profile || !friend) return;

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
                .or(`sender_id.eq.${friend.id},receiver_id.eq.${friend.id}`)
                .order('created_at', { ascending: true });

            if (data) {
                // Filter specifically for conversation between these two users
                const conversation = data.filter(
                    msg => (msg.sender_id === profile.id && msg.receiver_id === friend.id) ||
                        (msg.sender_id === friend.id && msg.receiver_id === profile.id)
                );
                setMessages(conversation);
            }
            setLoading(false);
            setTimeout(scrollToBottom, 100);
        };

        fetchMessages();

        // Realtime Subscription
        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const msg = payload.new as Message;
                    if (
                        (msg.sender_id === profile.id && msg.receiver_id === friend.id) ||
                        (msg.sender_id === friend.id && msg.receiver_id === profile.id)
                    ) {
                        setMessages((prev) => [...prev, msg]);
                        setTimeout(scrollToBottom, 100);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile, friend]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !profile) return;

        // Optimistic Update
        const tempId = Math.random().toString();
        const optimisticMsg: Message = {
            id: tempId,
            sender_id: profile.id,
            receiver_id: friend.id,
            content: newMessage,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        setTimeout(scrollToBottom, 50);

        const { error } = await supabase
            .from('messages')
            .insert([{
                sender_id: profile.id,
                receiver_id: friend.id,
                content: optimisticMsg.content
            }]);

        if (error) {
            console.error('Error sending message:', error);
            // Revert on error (optional implementation)
        }
    };

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-card border border-border shadow-2xl rounded-t-xl flex flex-col z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden border border-white/30">
                        {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt={friend.full_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-white">
                                {friend.full_name?.[0]}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-tight">{friend.full_name}</h3>
                        <div className="flex items-center gap-1.5 opacity-80">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-xs">Online</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30 scrollbar-thin scrollbar-thumb-primary/20">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground gap-2">
                        <Loader size={18} className="animate-spin" />
                        <span className="text-sm">Loading chat history...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-70">
                        <MessageSquare size={48} strokeWidth={1.5} className="mb-2" />
                        <p>No messages yet.</p>
                        <p className="text-xs">Say hello!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === profile?.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isMe
                                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                                        : 'bg-card border border-border text-foreground rounded-bl-sm'
                                        }`}
                                >
                                    <p>{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right opacity-70 ${isMe ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                                        {format(new Date(msg.created_at), 'h:mm a')}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-secondary border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
