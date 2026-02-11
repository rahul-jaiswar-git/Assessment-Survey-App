-- Enums
CREATE TYPE survey_category AS ENUM ('INDUSTRIAL', 'PROFESSIONAL', 'SKILL_ASSESSMENT');
CREATE TYPE admin_role AS ENUM ('SUPER_ADMIN', 'ADMIN');
CREATE TYPE question_type AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RATING');
CREATE TYPE survey_status AS ENUM ('DRAFT', 'PUBLISHED');

-- Admins table (linked to Supabase Auth)
CREATE TABLE admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role admin_role NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Surveys table
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category survey_category NOT NULL,
    status survey_status NOT NULL DEFAULT 'DRAFT',
    created_by UUID REFERENCES admins(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    options JSONB, -- For choices (radio/checkbox)
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responses table (one entry per survey submission)
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answers table (link responses to specific questions)
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Admins: Only Super Admins can manage admins. All admins can read admins.
CREATE POLICY "Admins can read all admins" ON admins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only super admins can manage admins" ON admins FOR ALL TO authenticated USING (
    (SELECT role FROM admins WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- Surveys: Admins can manage all surveys. Public can read published surveys.
CREATE POLICY "Admins can manage all surveys" ON surveys FOR ALL TO authenticated USING (true);
CREATE POLICY "Public can read published surveys" ON surveys FOR SELECT TO anon USING (status = 'PUBLISHED');

-- Questions: Admins can manage all questions. Public can read questions of published surveys.
CREATE POLICY "Admins can manage all questions" ON questions FOR ALL TO authenticated USING (true);
CREATE POLICY "Public can read questions of published surveys" ON questions FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = questions.survey_id AND surveys.status = 'PUBLISHED')
);

-- Responses: Admins can read all responses. Public can insert responses.
CREATE POLICY "Admins can read all responses" ON responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public can insert responses" ON responses FOR INSERT TO anon WITH CHECK (true);

-- Answers: Admins can read all answers. Public can insert answers.
CREATE POLICY "Admins can read all answers" ON answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public can insert answers" ON answers FOR INSERT TO anon WITH CHECK (true);

-- Functions & Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
