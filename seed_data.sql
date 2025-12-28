-- ROBUST SEED DATA (Careers & Skills)
-- Run this to populate the Career Page with varied options

-- 1. Clear existing generic seeds (Optional, handled by ON CONFLICT usually)
-- But here we use ON CONFLICT DO NOTHING

-- 2. Insert Careers
INSERT INTO public.careers (title, description) VALUES 
('Full Stack Developer', 'Master frontend, backend, and databases to build complete apps.'),
('Data Scientist', 'Turn raw data into meaningful insights using ML and statistics.'),
('UX/UI Designer', 'Design intuitive and beautiful user interfaces.'),
('Cyber Security Analyst', 'Protect systems and networks from digital attacks.'),
('Mobile App Dev', 'Build native applications for iOS and Android.'),
('Cloud Architect', 'Design and manage scalable cloud infrastructure.'),
('AI/ML Engineer', 'Build intelligent systems and neural networks.'),
('Game Developer', 'Create immersive gaming experiences.')
ON CONFLICT (title) DO NOTHING;

-- 3. Insert Skills (linked to Careers via sub-select to get IDs dynamicall)
-- We use a DO block or multiple inserts matching titles.
-- Since we can't easily get IDs in pure SQL script without variables easily in all environments,
-- we will use a common trick: INSERT SELECT.

-- Full Stack Developer Skills
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'HTML5 & CSS3', 10, 500 FROM public.careers WHERE title = 'Full Stack Developer'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'JavaScript (ES6+)', 10, 1000 FROM public.careers WHERE title = 'Full Stack Developer'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'React.js / Vue', 10, 1500 FROM public.careers WHERE title = 'Full Stack Developer'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Node.js & API Design', 10, 2000 FROM public.careers WHERE title = 'Full Stack Developer'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'PostgreSQL / SQL', 10, 1500 FROM public.careers WHERE title = 'Full Stack Developer'
ON CONFLICT DO NOTHING;

-- Data Scientist Skills
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Python Programming', 10, 500 FROM public.careers WHERE title = 'Data Scientist'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Data Analysis (Pandas)', 10, 1000 FROM public.careers WHERE title = 'Data Scientist'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Machine Learning', 10, 2500 FROM public.careers WHERE title = 'Data Scientist'
ON CONFLICT DO NOTHING;

-- UX/UI Designer Skills
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Wireframing', 5, 500 FROM public.careers WHERE title = 'UX/UI Designer'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Figma Mastery', 10, 1000 FROM public.careers WHERE title = 'UX/UI Designer'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Color Theory & Typography', 8, 800 FROM public.careers WHERE title = 'UX/UI Designer'
ON CONFLICT DO NOTHING;

-- Cyber Security Skills
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Network Fundamentals', 10, 1000 FROM public.careers WHERE title = 'Cyber Security Analyst'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Ethical Hacking', 10, 2500 FROM public.careers WHERE title = 'Cyber Security Analyst'
ON CONFLICT DO NOTHING;

-- Mobile App Dev Skills
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'React Native / Flutter', 10, 1500 FROM public.careers WHERE title = 'Mobile App Dev'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'iOS (Swift)', 8, 2000 FROM public.careers WHERE title = 'Mobile App Dev'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Android (Kotlin)', 8, 2000 FROM public.careers WHERE title = 'Mobile App Dev'
ON CONFLICT DO NOTHING;

-- Cloud Architect Skills
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'AWS Fundamentals', 10, 1000 FROM public.careers WHERE title = 'Cloud Architect'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Docker & Kubernetes', 10, 2500 FROM public.careers WHERE title = 'Cloud Architect'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Terraform / IaC', 8, 1500 FROM public.careers WHERE title = 'Cloud Architect'
ON CONFLICT DO NOTHING;

-- AI/ML Engineer Skills
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Deep Learning (PyTorch)', 10, 3000 FROM public.careers WHERE title = 'AI/ML Engineer'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'NLP & LLMs', 10, 5000 FROM public.careers WHERE title = 'AI/ML Engineer'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Computer Vision', 8, 2000 FROM public.careers WHERE title = 'AI/ML Engineer'
ON CONFLICT DO NOTHING;

-- Game Developer Skills
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Unity (C#)', 10, 1500 FROM public.careers WHERE title = 'Game Developer'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, 'Unreal Engine (C++)', 10, 2500 FROM public.careers WHERE title = 'Game Developer'
ON CONFLICT DO NOTHING;
INSERT INTO public.skills (career_id, title, max_level, xp_reward)
SELECT id, '3D Math & Physics', 8, 1000 FROM public.careers WHERE title = 'Game Developer'
ON CONFLICT DO NOTHING;

-- Update previously inserted generic careers if needed to match new titles or leave them.
