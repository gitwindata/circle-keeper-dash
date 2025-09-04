-- Create table for pending members that hairstylists can create
-- This allows hairstylists to add members without needing auth user creation

CREATE TABLE pending_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    whatsapp_number TEXT,
    instagram_handle TEXT,
    email TEXT,
    membership_tier membership_tier DEFAULT 'bronze',
    notes TEXT,

-- Hairstylist who added this member
added_by_hairstylist_id UUID REFERENCES hairstylists (id),

-- Status tracking
status TEXT DEFAULT 'pending' CHECK (
    status IN (
        'pending',
        'approved',
        'rejected'
    )
),

-- Timestamps
created_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW(),

-- When approved, this will link to the actual member record
approved_member_id UUID REFERENCES members(id),
    approved_by_admin_id UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for pending_members
ALTER TABLE pending_members ENABLE ROW LEVEL SECURITY;

-- Policy: Hairstylists can view pending members they created
CREATE POLICY "Hairstylists can view their pending members" ON pending_members FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE
                user_profiles.id = auth.uid ()
                AND user_profiles.role = 'hairstylist'
                AND pending_members.added_by_hairstylist_id = auth.uid ()
        )
    );

-- Policy: Hairstylists can create pending members
CREATE POLICY "Hairstylists can create pending members" ON pending_members FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE
                user_profiles.id = auth.uid ()
                AND user_profiles.role = 'hairstylist'
        )
        AND added_by_hairstylist_id = auth.uid ()
    );

-- Policy: Admins can view all pending members
CREATE POLICY "Admins can view all pending members" ON pending_members FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE
                user_profiles.id = auth.uid ()
                AND user_profiles.role = 'admin'
        )
    );

-- Policy: Admins can update pending members (for approval)
CREATE POLICY "Admins can update pending members" ON pending_members FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE
            user_profiles.id = auth.uid ()
            AND user_profiles.role = 'admin'
    )
);

-- Create index for performance
CREATE INDEX idx_pending_members_hairstylist ON pending_members (added_by_hairstylist_id);

CREATE INDEX idx_pending_members_status ON pending_members (status);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_pending_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pending_members_updated_at
    BEFORE UPDATE ON pending_members
    FOR EACH ROW
    EXECUTE FUNCTION update_pending_members_updated_at();