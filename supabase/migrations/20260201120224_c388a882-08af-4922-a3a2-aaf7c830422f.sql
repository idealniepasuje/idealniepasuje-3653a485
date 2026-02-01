-- Profiles table for user type distinction
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('candidate', 'employer')),
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Candidate test results
CREATE TABLE public.candidate_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Competency scores (averages 1-5)
  komunikacja_score DECIMAL(3,2),
  myslenie_analityczne_score DECIMAL(3,2),
  out_of_the_box_score DECIMAL(3,2),
  determinacja_score DECIMAL(3,2),
  adaptacja_score DECIMAL(3,2),
  -- Culture scores (averages 1-5)
  culture_relacja_wspolpraca DECIMAL(3,2),
  culture_elastycznosc_innowacyjnosc DECIMAL(3,2),
  culture_wyniki_cele DECIMAL(3,2),
  culture_stabilnosc_struktura DECIMAL(3,2),
  culture_autonomia_styl_pracy DECIMAL(3,2),
  culture_wlb_dobrostan DECIMAL(3,2),
  -- Additional data
  industry TEXT,
  experience TEXT,
  position_level TEXT,
  wants_to_change_industry TEXT,
  work_description TEXT,
  -- Status flags
  competency_tests_completed BOOLEAN DEFAULT false,
  culture_test_completed BOOLEAN DEFAULT false,
  additional_completed BOOLEAN DEFAULT false,
  all_tests_completed BOOLEAN DEFAULT false,
  -- Raw answers stored as JSONB
  competency_answers JSONB DEFAULT '{}',
  culture_answers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Employer profiles
CREATE TABLE public.employer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  role_description TEXT,
  role_responsibilities TEXT,
  -- Competency requirements (importance 1-5)
  req_komunikacja INTEGER CHECK (req_komunikacja >= 1 AND req_komunikacja <= 5),
  req_myslenie_analityczne INTEGER CHECK (req_myslenie_analityczne >= 1 AND req_myslenie_analityczne <= 5),
  req_out_of_the_box INTEGER CHECK (req_out_of_the_box >= 1 AND req_out_of_the_box <= 5),
  req_determinacja INTEGER CHECK (req_determinacja >= 1 AND req_determinacja <= 5),
  req_adaptacja INTEGER CHECK (req_adaptacja >= 1 AND req_adaptacja <= 5),
  -- Culture scores (averages 1-5)
  culture_relacja_wspolpraca DECIMAL(3,2),
  culture_elastycznosc_innowacyjnosc DECIMAL(3,2),
  culture_wyniki_cele DECIMAL(3,2),
  culture_stabilnosc_struktura DECIMAL(3,2),
  culture_autonomia_styl_pracy DECIMAL(3,2),
  culture_wlb_dobrostan DECIMAL(3,2),
  -- Additional data
  industry TEXT,
  required_experience TEXT,
  position_level TEXT,
  accepted_industries TEXT[],
  -- Status flags
  role_completed BOOLEAN DEFAULT false,
  requirements_completed BOOLEAN DEFAULT false,
  culture_completed BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  -- Raw answers stored as JSONB
  culture_answers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Match results
CREATE TABLE public.match_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_percent INTEGER,
  competence_percent INTEGER,
  culture_percent INTEGER,
  extra_percent INTEGER,
  match_details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'considering', 'rejected', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(candidate_user_id, employer_user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Helper function to get user type
CREATE OR REPLACE FUNCTION public.get_user_type(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Candidate test results policies
CREATE POLICY "Candidates can view own results"
ON public.candidate_test_results
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Candidates can insert own results"
ON public.candidate_test_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Candidates can update own results"
ON public.candidate_test_results
FOR UPDATE
USING (auth.uid() = user_id);

-- Employers can view matched candidates
CREATE POLICY "Employers can view matched candidates"
ON public.candidate_test_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.match_results
    WHERE match_results.candidate_user_id = candidate_test_results.user_id
    AND match_results.employer_user_id = auth.uid()
  )
);

-- Employer profiles policies
CREATE POLICY "Employers can view own profile"
ON public.employer_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Employers can insert own profile"
ON public.employer_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employers can update own profile"
ON public.employer_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Candidates can view matched employers
CREATE POLICY "Candidates can view matched employers"
ON public.employer_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.match_results
    WHERE match_results.employer_user_id = employer_profiles.user_id
    AND match_results.candidate_user_id = auth.uid()
  )
);

-- Match results policies
CREATE POLICY "Users can view own matches as candidate"
ON public.match_results
FOR SELECT
USING (auth.uid() = candidate_user_id);

CREATE POLICY "Users can view own matches as employer"
ON public.match_results
FOR SELECT
USING (auth.uid() = employer_user_id);

CREATE POLICY "System can insert matches"
ON public.match_results
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Employers can update match status"
ON public.match_results
FOR UPDATE
USING (auth.uid() = employer_user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_results_updated_at
BEFORE UPDATE ON public.candidate_test_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employer_profiles_updated_at
BEFORE UPDATE ON public.employer_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_match_results_updated_at
BEFORE UPDATE ON public.match_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate')
  );
  
  -- Create corresponding records based on user type
  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate') = 'candidate' THEN
    INSERT INTO public.candidate_test_results (user_id) VALUES (NEW.id);
  ELSE
    INSERT INTO public.employer_profiles (user_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();