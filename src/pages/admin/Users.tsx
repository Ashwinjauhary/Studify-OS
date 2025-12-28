import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Search,
    Shield,
    ShieldAlert,
    CheckCircle,
    XCircle,
    GraduationCap
} from 'lucide-react';


const AdminUsers = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        }
    };

    const handleToggleBan = async (userId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_suspended: !currentStatus })
            .eq('id', userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: !currentStatus } : u));
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.career_goal?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">User Management</h1>
                    <p className="text-muted-foreground">Total Users: {users.length}</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary w-64 placeholder:text-muted-foreground"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Student</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-secondary/30 border-b border-border text-muted-foreground font-medium uppercase tracking-wider">
                            <th className="p-4 pl-6">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Level</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading directory...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-secondary/40 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold border border-border overflow-hidden">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    user.full_name?.[0] || 'U'
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground">{user.full_name || 'Unknown User'}</div>
                                                <div className="text-xs text-muted-foreground">{user.email || 'No Email (Auth ID hidden)'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize border
                                            ${user.role === 'admin' || user.role === 'super_admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                user.role === 'moderator' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                            {user.role === 'admin' ? <ShieldAlert size={12} /> :
                                                user.role === 'student' ? <GraduationCap size={12} /> :
                                                    <Shield size={12} />}
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {user.is_suspended ? (
                                            <span className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs font-bold border border-red-500/20">
                                                <XCircle size={12} /> Banned
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold border border-green-500/20">
                                                <CheckCircle size={12} /> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-foreground font-mono font-bold">Lvl {user.current_level}</span>
                                            <span className="text-xs text-muted-foreground">{user.current_xp} XP</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {user.role !== 'super_admin' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateRole(user.id, user.role === 'admin' ? 'student' : 'admin')}
                                                        className="p-2 bg-secondary hover:bg-secondary/80 rounded text-muted-foreground hover:text-foreground transition-colors border border-border"
                                                        title={user.role === 'admin' ? "Demote to Student" : "Promote to Admin"}
                                                    >
                                                        <Shield size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleBan(user.id, user.is_suspended)}
                                                        className={`p-2 rounded transition-colors border ${user.is_suspended ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'}`}
                                                        title={user.is_suspended ? "Unban User" : "Ban User"}
                                                    >
                                                        {user.is_suspended ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination could go here */}
            <div className="text-center text-xs text-muted-foreground mt-4">
                Showing {filteredUsers.length} users
            </div>
        </div>
    );
};

export default AdminUsers;
