import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO
} from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import clsx from 'clsx';

interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    type: 'exam' | 'assignment' | 'study_session' | 'other';
    color: string;
    is_all_day: boolean;
}

const CalendarPage = () => {
    const { profile } = useAuthStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [newEvent, setNewEvent] = useState({
        title: '',
        type: 'study_session',
        start_time: '',
        end_time: '',
        description: '',
        color: '#a855f7'
    });

    useEffect(() => {
        if (profile) fetchEvents();
    }, [profile, currentDate]);

    const fetchEvents = async () => {
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();

        const { data } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', profile?.id)
            .gte('start_time', start)
            .lte('start_time', end);

        if (data) setEvents(data as CalendarEvent[]);
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setLoading(true);

        const { error } = await supabase.from('calendar_events').insert({
            user_id: profile.id,
            title: newEvent.title,
            type: newEvent.type,
            start_time: newEvent.start_time,
            end_time: newEvent.end_time,
            description: newEvent.description,
            color: newEvent.color
        });

        if (error) {
            alert('Error adding event');
        } else {
            setIsModalOpen(false);
            fetchEvents();
            // Reset form
            setNewEvent({
                title: '',
                type: 'study_session',
                start_time: '',
                end_time: '',
                description: '',
                color: '#a855f7'
            });
        }
        setLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this event?')) return;

        await supabase.from('calendar_events').delete().eq('id', id);
        setEvents(prev => prev.filter(ev => ev.id !== id));
    };

    const onDateClick = (day: Date) => {
        setSelectedDate(day);
        // Pre-fill form start date
        const dateStr = format(day, "yyyy-MM-dd'T'HH:mm");
        setNewEvent(prev => ({ ...prev, start_time: dateStr, end_time: dateStr }));
        setIsModalOpen(true);
    };

    // Calendar Grid Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const getDayEvents = (day: Date) => {
        return events.filter(ev => isSameDay(parseISO(ev.start_time), day));
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Academic Calendar</h1>
                    <p className="text-muted-foreground">Track your exams, deadlines, and study plans.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-secondary/80 rounded-lg text-foreground">
                        <ChevronLeft />
                    </button>
                    <h2 className="text-xl font-bold text-foreground min-w-[150px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-secondary/80 rounded-lg text-foreground">
                        <ChevronRight />
                    </button>
                    <button
                        onClick={() => {
                            const now = new Date();
                            onDateClick(now);
                        }}
                        className="ml-4 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                    >
                        <Plus size={20} /> Add Event
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-card border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-xl">
                {/* Days Header */}
                <div className="grid grid-cols-7 bg-secondary/50 border-b border-gray-200 dark:border-white/5 p-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days Cells */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {days.map((day) => {
                        const dayEvents = getDayEvents(day);
                        return (
                            <div
                                key={day.toString()}
                                onClick={() => onDateClick(day)}
                                className={clsx(
                                    "min-h-[120px] p-2 border-b border-r border-gray-200 dark:border-white/5 cursor-pointer transition-colors relative group",
                                    !isSameMonth(day, monthStart) && "bg-secondary/30 text-muted-foreground",
                                    isSameMonth(day, monthStart) && "hover:bg-secondary/30",
                                    isSameDay(day, new Date()) && "bg-primary/5"
                                )}
                            >
                                <div className={clsx(
                                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-2",
                                    isSameDay(day, new Date()) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                )}>
                                    {format(day, 'd')}
                                </div>

                                <div className="space-y-1">
                                    {dayEvents.map(ev => (
                                        <div
                                            key={ev.id}
                                            className="text-xs px-2 py-1 rounded truncate text-white flex items-center justify-between group/event"
                                            style={{ backgroundColor: ev.color + 'CC', borderLeft: `3px solid ${ev.color}` }}
                                        >
                                            <span>{ev.title}</span>
                                            <button
                                                onClick={(e) => handleDelete(ev.id, e)}
                                                className="opacity-0 group-hover/event:opacity-100 hover:text-red-200"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Button on Hover */}
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={16} className="text-muted-foreground hover:text-foreground" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Event Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-gray-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6"
                        >
                            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                                <CalendarIcon className="text-primary" />
                                {selectedDate ? format(selectedDate, 'MMM do') : 'New Event'}
                            </h2>

                            <form onSubmit={handleAddEvent} className="space-y-4">
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Title</label>
                                    <input
                                        required
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                        className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/5 focus:border-primary focus:outline-none"
                                        placeholder="Final Exam, Project Submission..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Type</label>
                                        <select
                                            value={newEvent.type}
                                            onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                                            className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/5 focus:border-primary focus:outline-none"
                                        >
                                            <option value="study_session">Study Session</option>
                                            <option value="exam">Exam</option>
                                            <option value="assignment">Assignment</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Color</label>
                                        <div className="flex gap-2 mt-2">
                                            {['#a855f7', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'].map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setNewEvent({ ...newEvent, color: c })}
                                                    className={`w-6 h-6 rounded-full transition-transform ${newEvent.color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Start Time</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={newEvent.start_time}
                                            onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })}
                                            className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/5 focus:border-primary focus:outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">End Time</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={newEvent.end_time}
                                            onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })}
                                            className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/5 focus:border-primary focus:outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Description</label>
                                    <textarea
                                        value={newEvent.description}
                                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                        className="w-full bg-secondary p-3 rounded-lg text-foreground border border-gray-200 dark:border-white/5 focus:border-primary focus:outline-none h-20 resize-none"
                                        placeholder="Details..."
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : 'Add Event'}
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

export default CalendarPage;
