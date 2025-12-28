import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    initialized: boolean;
    setSession: (session: Session | null) => void;
    setProfile: (profile: Profile | null) => void;
    fetchProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    profile: null,
    loading: true,
    initialized: false,

    setSession: (session) => set({ session }),
    setProfile: (profile) => set({ profile }),

    fetchProfile: async () => {
        const { session } = get();
        if (!session?.user) {
            set({ profile: null, loading: false, initialized: true });
            return;
        }

        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            }

            if (data) {
                set({ profile: data as Profile });
            }
        } catch (err) {
            console.error(err);
        } finally {
            set({ loading: false, initialized: true });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, profile: null });
    },
}));
