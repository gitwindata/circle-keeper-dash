-- =================== COMPREHENSIVE DATABASE SCHEMA ===================
-- Circle Keeper Dashboard - Hair Management System
-- Created for Haijoel Men's Salon

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'jwt-scrett';

-- =================== EXTENSIONS ===================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =================== ENUMS ===================
CREATE TYPE user_role AS ENUM ('admin', 'hairstylist', 'member');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE membership_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
CREATE TYPE service_category AS ENUM ('haircut', 'styling', 'treatment', 'coloring', 'beard', 'wash', 'combo');
CREATE TYPE photo_type AS ENUM ('before', 'after', 'profile');
CREATE TYPE review_type AS ENUM ('service', 'hairstylist', 'barbershop');

-- =================== CORE TABLES ===================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    full_name TEXT NOT NULL,
    phone TEXT,
    whatsapp_number TEXT,
    instagram_handle TEXT,
    address TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hairstylist specific data
CREATE TABLE hairstylists (
    id UUID REFERENCES user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    specialties TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    total_clients INTEGER DEFAULT 0,
    monthly_clients INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    schedule_notes TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    cabang TEXT
);

-- Member specific data with membership tracking
CREATE TABLE members (
    id UUID REFERENCES user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    membership_tier membership_tier DEFAULT 'bronze',
    membership_points INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    last_visit_date DATE,
    preferred_services TEXT[] DEFAULT '{}',
    notes TEXT,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES members(id),
    birthday DATE
);

-- Services (hardcoded in app but stored for pricing/tracking)
CREATE TABLE services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category service_category NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    requires_consultation BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member-Hairstylist Assignments (many-to-many)
CREATE TABLE member_hairstylist_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    hairstylist_id UUID REFERENCES hairstylists(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES user_profiles(id),
    notes TEXT,
    UNIQUE(member_id, hairstylist_id)
);

-- Visits/Appointments
CREATE TABLE visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    hairstylist_id UUID REFERENCES hairstylists(id) ON DELETE CASCADE NOT NULL,
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status appointment_status DEFAULT 'completed',
    total_duration INTEGER, -- calculated from services
    total_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    hairstylist_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visit Services (many-to-many for multiple services per visit)
CREATE TABLE visit_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    notes TEXT,
    UNIQUE(visit_id, service_id)
);

-- Photos for visits
CREATE TABLE visit_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    photo_type photo_type NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID REFERENCES user_profiles(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personal Notes by Hairstylists about Members
CREATE TABLE personal_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hairstylist_id UUID REFERENCES hairstylists(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews and Feedback
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    review_type review_type NOT NULL,
    target_id UUID, -- service_id, hairstylist_id, or NULL for barbershop
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================== MEMBERSHIP LEVEL TRACKING ===================
CREATE TABLE membership_level_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    previous_tier membership_tier,
    new_tier membership_tier NOT NULL,
    points_earned INTEGER DEFAULT 0,
    reason TEXT,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================== INDEXES FOR PERFORMANCE ===================
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_visits_member_id ON visits(member_id);
CREATE INDEX idx_visits_hairstylist_id ON visits(hairstylist_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_reviews_target ON reviews(review_type, target_id);
CREATE INDEX idx_member_assignments ON member_hairstylist_assignments(member_id, hairstylist_id);
CREATE INDEX idx_personal_notes_lookup ON personal_notes(hairstylist_id, member_id);

-- =================== TRIGGERS FOR AUTO-UPDATES ===================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_notes_updated_at BEFORE UPDATE ON personal_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate member stats after visit
CREATE OR REPLACE FUNCTION update_member_stats_after_visit()
RETURNS TRIGGER AS $$
BEGIN
    -- Update member statistics
    UPDATE members SET
        total_visits = (
            SELECT COUNT(*) FROM visits 
            WHERE member_id = NEW.member_id AND status = 'completed'
        ),
        total_spent = (
            SELECT COALESCE(SUM(final_price), 0) FROM visits 
            WHERE member_id = NEW.member_id AND status = 'completed'
        ),
        last_visit_date = NEW.visit_date::DATE
    WHERE id = NEW.member_id;
    
    -- Update hairstylist stats
    UPDATE hairstylists SET
        total_clients = (
            SELECT COUNT(DISTINCT member_id) FROM visits 
            WHERE hairstylist_id = NEW.hairstylist_id AND status = 'completed'
        ),
        total_revenue = (
            SELECT COALESCE(SUM(final_price), 0) FROM visits 
            WHERE hairstylist_id = NEW.hairstylist_id AND status = 'completed'
        )
    WHERE id = NEW.hairstylist_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stats_after_visit 
    AFTER INSERT OR UPDATE ON visits 
    FOR EACH ROW 
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_member_stats_after_visit();

-- Auto-update membership tier based on visits and spending
CREATE OR REPLACE FUNCTION update_membership_tier()
RETURNS TRIGGER AS $$
DECLARE
    new_tier membership_tier;
    current_tier membership_tier;
BEGIN
    SELECT membership_tier INTO current_tier FROM members WHERE id = NEW.member_id;
    
    -- Calculate new tier based on total visits and spending
    SELECT CASE
        WHEN NEW.total_visits >= 50 OR NEW.total_spent >= 10000000 THEN 'diamond'::membership_tier
        WHEN NEW.total_visits >= 30 OR NEW.total_spent >= 5000000 THEN 'platinum'::membership_tier  
        WHEN NEW.total_visits >= 20 OR NEW.total_spent >= 2500000 THEN 'gold'::membership_tier
        WHEN NEW.total_visits >= 10 OR NEW.total_spent >= 1000000 THEN 'silver'::membership_tier
        ELSE 'bronze'::membership_tier
    END INTO new_tier;
    
    -- Update tier if changed
    IF new_tier != current_tier THEN
        UPDATE members SET 
            membership_tier = new_tier,
            membership_points = membership_points + 
                CASE new_tier
                    WHEN 'diamond' THEN 1000
                    WHEN 'platinum' THEN 500
                    WHEN 'gold' THEN 250
                    WHEN 'silver' THEN 100
                    ELSE 0
                END
        WHERE id = NEW.member_id;
        
        -- Log tier change
        INSERT INTO membership_level_history (member_id, previous_tier, new_tier, reason)
        VALUES (NEW.member_id, current_tier, new_tier, 'Automatic tier upgrade based on activity');
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_membership_tier_update 
    AFTER UPDATE ON members 
    FOR EACH ROW 
    WHEN (OLD.total_visits != NEW.total_visits OR OLD.total_spent != NEW.total_spent)
    EXECUTE FUNCTION update_membership_tier();

-- =================== ROW LEVEL SECURITY POLICIES ===================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hairstylists ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_hairstylist_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_level_history ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can create any profile" ON user_profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Members Policies
CREATE POLICY "Members can view their own data" ON members FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins and assigned hairstylists can view member data" ON members FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM member_hairstylist_assignments WHERE member_id = members.id AND hairstylist_id = auth.uid())
);

-- Hairstylists Policies  
CREATE POLICY "Hairstylists can view their own data" ON hairstylists FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Anyone can view active hairstylists" ON hairstylists FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = hairstylists.id AND is_active = true)
);

-- Visits Policies
CREATE POLICY "Members can view their own visits" ON visits FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Hairstylists can view their visits" ON visits FOR SELECT USING (hairstylist_id = auth.uid());
CREATE POLICY "Admins can view all visits" ON visits FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Hairstylists can create visits for their assigned members" ON visits FOR INSERT WITH CHECK (
    hairstylist_id = auth.uid() AND
    EXISTS (SELECT 1 FROM member_hairstylist_assignments WHERE member_id = visits.member_id AND hairstylist_id = auth.uid())
);

-- Personal Notes Policies
CREATE POLICY "Hairstylists can manage their own notes" ON personal_notes FOR ALL USING (hairstylist_id = auth.uid());
CREATE POLICY "Admins can view all personal notes" ON personal_notes FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews Policies
CREATE POLICY "Members can manage their own reviews" ON reviews FOR ALL USING (member_id = auth.uid());
CREATE POLICY "Anyone can view non-anonymous reviews" ON reviews FOR SELECT USING (is_anonymous = false OR member_id = auth.uid());
CREATE POLICY "Admins can view all reviews" ON reviews FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Services Policies (read-only for most users)
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage services" ON services FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =================== INSERT DEFAULT SERVICES ===================
INSERT INTO services (name, category, base_price, duration_minutes, description) VALUES
('Haircut', 'haircut', 150000, 45, 'Classic men''s haircut with styling'),
('Root Lift', 'styling', 200000, 60, 'Root lifting treatment for volume'),
('Down Perm', 'treatment', 350000, 120, 'Permanent wave treatment - downward style'),
('Design Perm', 'treatment', 400000, 150, 'Custom design permanent wave treatment'),
('Keratin Smooth', 'treatment', 500000, 180, 'Keratin smoothing treatment'),
('Hair Repair', 'treatment', 300000, 90, 'Deep hair repair and conditioning treatment'),
('Home Service (JABODETABEK)', 'haircut', 250000, 60, 'Haircut service at your location in JABODETABEK area'),
('Haircut + Root Lift', 'combo', 320000, 105, 'Combination of haircut and root lift'),
('Haircut + Down Perm', 'combo', 450000, 165, 'Combination of haircut and down perm'),
('Haircut + Down Perm + Root Lift', 'combo', 600000, 225, 'Complete styling package with haircut, down perm, and root lift'),
('Haircut + Design Perm', 'combo', 500000, 195, 'Combination of haircut and design perm'),
('Haircut + Keratin Smooth', 'combo', 600000, 225, 'Combination of haircut and keratin smooth treatment'),
('Haircut + Hair Repair', 'combo', 420000, 135, 'Combination of haircut and hair repair treatment');

-- =================== CREATE ADMIN USER FUNCTION ===================
CREATE OR REPLACE FUNCTION create_admin_user(
    user_email TEXT,
    user_password TEXT,
    admin_name TEXT
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- This would typically be called during initial setup
    -- In practice, you'd create the admin through Supabase Auth UI or API
    RAISE NOTICE 'Admin user creation should be done through Supabase Auth, then call update_user_profile_role';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user role (should be called after user registration)
CREATE OR REPLACE FUNCTION update_user_profile_role(
    target_user_id UUID,
    new_role user_role,
    full_name TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_profiles (id, email, role, full_name)
    SELECT target_user_id, auth.users.email, new_role, full_name
    FROM auth.users WHERE auth.users.id = target_user_id
    ON CONFLICT (id) DO UPDATE SET
        role = new_role,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
        
    -- Create role-specific record
    IF new_role = 'hairstylist' THEN
        INSERT INTO hairstylists (id) VALUES (target_user_id)
        ON CONFLICT (id) DO NOTHING;
    ELSIF new_role = 'member' THEN
        INSERT INTO members (id) VALUES (target_user_id)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;