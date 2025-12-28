import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { Save, Upload, User, Palette } from 'lucide-react';
import clsx from 'clsx';

const Settings = () => {
    const { profile, fetchProfile } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        career_goal: '',
        education_level: 'High School', // defaulting to a valid option
        theme_preference: 'dark'
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                career_goal: profile.career_goal || '',
                education_level: profile.education_level || 'High School',
                theme_preference: profile.theme_preference || 'dark'
            });
        }
    }, [profile]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('profiles')
            .update(formData)
            .eq('id', profile?.id);

        if (!error) {
            await fetchProfile(); // Refresh global store
            alert('Profile updated successfully!');
        } else {
            alert('Error updating profile.');
            console.error(error);
        }
        setLoading(false);
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !profile) {
            return;
        }

        setUploading(true);
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

        // 1. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            alert('Error uploading image!');
            console.error(uploadError);
            setUploading(false);
            return;
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // 3. Update Profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', profile.id);

        if (!updateError) {
            await fetchProfile();
            alert('Avatar updated!');
        }

        setUploading(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
                <p className="text-muted-foreground">Manage your profile and preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar */}
                {/* Left Column: Avatar */}
                <div className="space-y-6">
                    <div className="bg-card border border-border p-6 rounded-xl flex flex-col items-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-50" />

                        <div className="relative z-10 w-32 h-32 rounded-full p-1 bg-gradient-to-br from-primary to-accent mb-4">
                            <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-foreground bg-secondary">
                                        {profile?.full_name?.[0]}
                                    </div>
                                )}
                            </div>

                            {/* Upload Overlay */}
                            <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                <Upload className="text-white mb-1" size={20} />
                                <span className="sr-only">Upload</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div className="text-center relative z-10">
                            <h3 className="font-bold text-foreground text-lg">{profile?.full_name}</h3>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mt-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <p className="text-xs font-medium text-primary">Level {profile?.current_level || 1} Scholar</p>
                            </div>
                        </div>

                        {/* Avatar Generator */}
                        <div className="mt-8 w-full relative z-10 border-t border-border pt-6">
                            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Palette size={14} />
                                Create Digital Avatar
                            </h4>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {['adventurer', 'avataaars', 'bottts', 'fun-emoji'].map((style) => (
                                    <button
                                        key={style}
                                        type="button"
                                        onClick={async () => {
                                            const seed = Math.random().toString(36).substring(7);
                                            const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
                                            const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile?.id);
                                            if (!error) fetchProfile();
                                        }}
                                        className="aspect-square rounded-lg bg-secondary hover:bg-primary/20 hover:border-primary border border-transparent transition-all p-1 flex items-center justify-center group/btn"
                                        title={`Generate ${style}`}
                                    >
                                        <img
                                            src={`https://api.dicebear.com/7.x/${style}/svg?seed=preview`}
                                            alt={style}
                                            className="w-full h-full opacity-70 group-hover/btn:opacity-100 transition-opacity"
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-center text-muted-foreground">Click a style to generate a new look!</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleUpdate} className="bg-card border border-gray-200 dark:border-white/5 p-6 rounded-xl space-y-6">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <User size={20} className="text-primary" />
                            Profile Details
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full bg-secondary border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Career Goal</label>
                                <input
                                    type="text"
                                    value={formData.career_goal}
                                    onChange={(e) => setFormData({ ...formData, career_goal: e.target.value })}
                                    className="w-full bg-secondary border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Education Level</label>
                                <select
                                    value={formData.education_level}
                                    onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                                    className="w-full bg-secondary border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                                >
                                    <option value="High School">High School</option>
                                    <option value="College (Undergrad)">College (Undergrad)</option>
                                    <option value="College (Grad)">College (Grad)</option>
                                    <option value="Self Learner">Self Learner</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-white/5 pt-6"></div>

                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Palette size={20} className="text-accent" />
                            Apperance
                        </h3>

                        <div className="grid grid-cols-3 gap-4">
                            {['dark', 'light', 'cyber'].map((theme) => (
                                <button
                                    key={theme}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, theme_preference: theme })}
                                    className={clsx(
                                        "p-3 rounded-lg border text-sm font-medium capitalize transition-all",
                                        formData.theme_preference === theme
                                            ? "border-primary bg-primary/10 text-foreground"
                                            : "border-gray-200 dark:border-white/10 text-muted-foreground hover:bg-secondary"
                                    )}
                                >
                                    {theme}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                            >
                                <Save size={18} />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
