-- BALANCED CAREER MISSIONS (Easy/Medium/Interesting)
-- Run this script to populate challenges that are doable but useful.

-- Handle dependencies: Clear active missions first
DELETE FROM public.daily_missions;
DELETE FROM public.mission_templates;

-- ==========================================
-- 1. FULL STACK DEVELOPER
-- ==========================================
INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'CSS Flexbox Practice', 'Spend 15 mins playing Flexbox Froggy or practicing layouts.', 50, 'skill', 'easy', id FROM public.careers WHERE title = 'Full Stack Developer';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Learn a New Array Method', 'Read MDN docs on map, filter, or reduce and write 1 example.', 60, 'skill', 'easy', id FROM public.careers WHERE title = 'Full Stack Developer';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Fix a Console Warning', 'Open your project and resolve one yellow warning in the console.', 80, 'skill', 'medium', id FROM public.careers WHERE title = 'Full Stack Developer';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Watch a Tech Video', 'Watch a 10-min YouTube video on a new web framework or tool.', 40, 'study', 'easy', id FROM public.careers WHERE title = 'Full Stack Developer';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Optimize an Image', 'Compress one image in your project to improve load speed.', 70, 'skill', 'easy', id FROM public.careers WHERE title = 'Full Stack Developer';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Create a Custom Hook', 'Refactor a repetitive logic into a simple custom React hook.', 100, 'skill', 'medium', id FROM public.careers WHERE title = 'Full Stack Developer';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Style a Button', 'Create a new button variant (e.g., outline or ghost) in your CSS.', 60, 'skill', 'easy', id FROM public.careers WHERE title = 'Full Stack Developer';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Review Your Old Code', 'Open a project from last month and add comments to one file.', 50, 'reflection', 'easy', id FROM public.careers WHERE title = 'Full Stack Developer';

-- ==========================================
-- 2. DATA SCIENTIST
-- ==========================================
INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Explore a Dataset', 'Open a CSV and print the first 10 rows and summary stats.', 50, 'skill', 'easy', id FROM public.careers WHERE title = 'Data Scientist';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Create a Simple Plot', 'Make a bar chart or scatter plot using Matplotlib/Seaborn.', 60, 'skill', 'easy', id FROM public.careers WHERE title = 'Data Scientist';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Pandas Practice', 'Filter a dataframe to show only rows where value > X.', 50, 'skill', 'easy', id FROM public.careers WHERE title = 'Data Scientist';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Read about AI', 'Read one article about a recent AI development.', 40, 'study', 'easy', id FROM public.careers WHERE title = 'Data Scientist';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Clean One Column', 'Handle missing values in a single column of your dataset.', 70, 'skill', 'medium', id FROM public.careers WHERE title = 'Data Scientist';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Learn a Stat Concept', 'Review the definition of P-Value or Standard Deviation.', 50, 'study', 'easy', id FROM public.careers WHERE title = 'Data Scientist';

-- ==========================================
-- 3. UX/UI DESIGNER
-- ==========================================
INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Browse Inspiration', 'Spend 10 mins explicitly browsing Dribbble/Behance for layout ideas.', 40, 'study', 'easy', id FROM public.careers WHERE title = 'UX/UI Designer';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Font Pairing', 'Find two Google Fonts that look good together and save them.', 50, 'skill', 'easy', id FROM public.careers WHERE title = 'UX/UI Designer';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Redesign a Card', 'Take a screenshot of a UI card and quickly redesign it in Figma.', 80, 'skill', 'medium', id FROM public.careers WHERE title = 'UX/UI Designer';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Check Contrast', 'Test the color contrast of one of your designs.', 50, 'skill', 'easy', id FROM public.careers WHERE title = 'UX/UI Designer';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Sketch an Icon', 'Draw a simple icon (like Home or Settings) on paper.', 40, 'skill', 'easy', id FROM public.careers WHERE title = 'UX/UI Designer';

-- ==========================================
-- 4. CYBER SECURITY ANALYST
-- ==========================================
INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Password Audit', 'Check if you have repeated passwords in your own accounts.', 50, 'habit', 'easy', id FROM public.careers WHERE title = 'Cyber Security Analyst';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Read Security News', 'Read one article on The Hacker News or similar.', 40, 'study', 'easy', id FROM public.careers WHERE title = 'Cyber Security Analyst';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Scan a Network', 'Run `nmap` on your local network to see active devices.', 80, 'skill', 'medium', id FROM public.careers WHERE title = 'Cyber Security Analyst';

INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Learn a Port', 'Memorize what service runs on a specific port (e.g., 22, 53, 80).', 30, 'study', 'easy', id FROM public.careers WHERE title = 'Cyber Security Analyst';

-- ==========================================
-- GENERIC (Doable & Fun)
-- ==========================================
INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id) VALUES 
('Organize Workspace', 'Clear your desk or organize your desktop files.', 40, 'habit', 'easy', NULL),
('Hydrate', 'Drink a glass of water right now.', 20, 'habit', 'easy', NULL),
('Quick Stretch', 'Stand up and stretch for 2 minutes.', 30, 'habit', 'easy', NULL),
('Update a To-Do List', 'Write down your top 3 goals for tomorrow.', 40, 'habit', 'easy', NULL),
('Read 5 Pages', 'Read 5 pages of a book (fiction or non-fiction).', 50, 'habit', 'easy', NULL),
('15 Min Focus', 'Do a single short focus session (15 mins).', 50, 'study', 'easy', NULL),
('Reply to an Email', 'Clear one pending email from your inbox.', 40, 'habit', 'easy', NULL),
('Walk Outside', 'Take a 10-minute walk for fresh air.', 60, 'habit', 'easy', NULL);

-- Mobile App Dev (Balanced)
INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Run on Simulator', 'Build and run your app on a fresh simulator/emulator.', 60, 'skill', 'easy', id FROM public.careers WHERE title = 'Mobile App Dev';
INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Change App Icon', 'Update the app icon for your current project.', 50, 'skill', 'easy', id FROM public.careers WHERE title = 'Mobile App Dev';

-- AI/ML Engineer (Balanced)
INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Review a Model', 'Look at the architecture diagram of a famous model (like ResNet).', 50, 'study', 'easy', id FROM public.careers WHERE title = 'AI/ML Engineer';

-- Game Developer (Balanced)
INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Playtest', 'Play your game for 10 mins and write down 2 bugs.', 60, 'skill', 'easy', id FROM public.careers WHERE title = 'Game Developer';
INSERT INTO public.mission_templates (title, description, xp_reward, type, difficulty, career_id)
SELECT 'Import an Asset', 'Download and import a free asset into your scene.', 40, 'skill', 'easy', id FROM public.careers WHERE title = 'Game Developer';
