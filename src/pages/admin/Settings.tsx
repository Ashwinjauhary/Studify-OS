import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Activity,
    Terminal,
    Server,
    Database,
    ToggleLeft,
    ToggleRight,
    AlertCircle
} from 'lucide-react';

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('health');
    const [logs, setLogs] = useState<any[]>([]);
    const [flags, setFlags] = useState<any[]>([]);

    // Mock System Health
    const healthMetrics = [
        { name: 'API Latency', value: '45ms', status: 'good', icon: Activity },
        { name: 'Database Connections', value: '12/100', status: 'good', icon: Database },
        { name: 'Storage Usage', value: '2.4GB / 10GB', status: 'warning', icon: Server },
        { name: 'Error Rate', value: '0.01%', status: 'good', icon: AlertCircle },
    ];

    useEffect(() => {
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'flags') fetchFlags();
    }, [activeTab]);

    const fetchLogs = async () => {
        const { data } = await supabase.from('admin_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(50);
        if (data) setLogs(data);
    };

    const fetchFlags = async () => {
        const { data } = await supabase.from('feature_flags').select('*');
        if (data) setFlags(data);
        else {
            // Seed flags if empty
            const seeds = [
                { key: 'maintenance_mode', is_enabled: false, description: 'Lock access for non-admins' },
                { key: 'beta_features', is_enabled: true, description: 'Enable experimental UI' },
                { key: 'public_signup', is_enabled: true, description: 'Allow new users to register' }
            ];
            // In a real app we'd insert these, but for UI demo we just show them
            setFlags(seeds);
        }
    };

    const toggleFlag = async (key: string, current: boolean) => {
        // Optimistic update
        setFlags(flags.map(f => f.key === key ? { ...f, is_enabled: !current } : f));

        // Try to update DB
        const { error } = await supabase.from('feature_flags').update({ is_enabled: !current }).eq('key', key);

        // If DB row doesn't exist, insert it (upsert)
        if (error || true) { // Force upsert logic for demo since we might be using seed data not in DB
            await supabase.from('feature_flags').upsert([{ key, is_enabled: !current }]);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">System Settings</h1>

            <div className="flex gap-4 border-b border-border mb-6">
                {[
                    { id: 'health', label: 'System Health', icon: Activity },
                    { id: 'flags', label: 'Feature Flags', icon: ToggleLeft },
                    { id: 'logs', label: 'Audit Logs', icon: Terminal },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'health' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {healthMetrics.map((metric) => (
                        <div key={metric.name} className="bg-card border border-border p-6 rounded-xl shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <metric.icon className="text-muted-foreground" size={24} />
                                <div className={`w-3 h-3 rounded-full ${metric.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'
                                    }`} />
                            </div>
                            <div className="text-2xl font-bold text-foreground mb-1">{metric.value}</div>
                            <div className="text-sm text-muted-foreground">{metric.name}</div>
                        </div>
                    ))}

                    <div className="col-span-full mt-8 bg-secondary/20 border border-border p-8 rounded-xl flex items-center justify-center text-center">
                        <div className="space-y-4">
                            <Server size={48} className="mx-auto text-muted-foreground" />
                            <h3 className="text-lg font-bold text-foreground">Server Status: Operational</h3>
                            <p className="text-muted-foreground max-w-md">
                                All systems running within normal parameters. Database backup scheduled for 03:00 AM UTC.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'flags' && (
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-secondary/30 text-muted-foreground text-xs uppercase">
                            <tr>
                                <th className="p-4">Feature Key</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {flags.map(flag => (
                                <tr key={flag.key} className="hover:bg-secondary/20 transition-colors">
                                    <td className="p-4 font-mono text-blue-400">{flag.key}</td>
                                    <td className="p-4 text-foreground/80">{flag.description}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => toggleFlag(flag.key, flag.is_enabled)}
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${flag.is_enabled
                                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                }`}
                                        >
                                            {flag.is_enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                            {flag.is_enabled ? 'Enabled' : 'Disabled'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-zinc-950 border border-border rounded-xl p-4 font-mono text-sm h-[600px] overflow-y-auto">
                    {logs.length === 0 ? (
                        <div className="text-muted-foreground">No logs found.</div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="mb-2 flex gap-4 text-gray-300 border-b border-white/5 pb-2 last:border-0 hover:bg-white/5 p-1 rounded">
                                <span className="text-gray-500 shrink-0 w-32">{new Date(log.created_at).toLocaleString()}</span>
                                <span className="text-blue-400 shrink-0 w-24">{log.profiles?.full_name || 'System'}</span>
                                <span className="text-green-500 shrink-0 w-32 uppercase">{log.action}</span>
                                <span className="text-white/80">{log.details ? JSON.stringify(log.details) : 'No details'}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
