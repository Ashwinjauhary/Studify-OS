export type UserRole = 'student' | 'admin' | 'moderator' | 'super_admin';



export interface Profile {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: UserRole;
    education_level: string | null;
    year_stream: string | null;
    career_goal: string | null;
    daily_study_target_mins: number;
    theme_preference: string;
    coins: number;
    current_level: number;
    current_xp: number;
    xp_to_next_level: number;
    current_streak: number;
    total_study_mins: number;
}

export interface Mission {
    id: string;
    title: string;
    description: string | null;
    type: 'study' | 'habit' | 'skill' | 'reflection' | 'custom';
    difficulty: 'easy' | 'medium' | 'hard' | 'epic';
    xp_reward: number;
    coin_reward: number;
    is_completed: boolean;
    user_id: string;
}

export interface StudySession {
    id: string;
    mode: 'pomodoro' | 'deep_focus' | 'custom';
    start_time: string;
    end_time: string | null;
    duration_seconds: number;
    is_completed: boolean;
}
