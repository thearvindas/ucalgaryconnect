DROP TABLE IF EXISTS profiles; CREATE TABLE profiles (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, full_name TEXT NOT NULL, faculty TEXT NOT NULL, major TEXT NOT NULL, courses TEXT[] DEFAULT '{}', bio TEXT, skills TEXT[] DEFAULT '{}', interests TEXT[] DEFAULT '{}', created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id)); ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; CREATE POLICY "Profiles are viewable by everyone." ON profiles FOR SELECT USING (true); CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id); CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = user_id);
