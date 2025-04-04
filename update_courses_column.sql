ALTER TABLE profiles ALTER COLUMN courses TYPE TEXT[] USING string_to_array(courses, ',');
