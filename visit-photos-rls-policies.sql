-- RLS Policies for visit_photos table
-- This allows proper access to visit photos based on user roles

-- Policy for hairstylists to access photos from their own visits
CREATE POLICY "hairstylists_can_access_their_visit_photos" ON visit_photos FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM visits v
            JOIN hairstylists h ON h.id = v.hairstylist_id
        WHERE
            v.id = visit_photos.visit_id
            AND h.id = auth.uid ()
    )
);

-- Policy for members to access photos from their own visits
CREATE POLICY "members_can_access_their_visit_photos" ON visit_photos FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM visits v
            JOIN members m ON m.id = v.member_id
        WHERE
            v.id = visit_photos.visit_id
            AND m.id = auth.uid ()
    )
);

-- Policy for admins to access all visit photos
CREATE POLICY "admins_can_access_all_visit_photos" ON visit_photos FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM user_profiles up
        WHERE
            up.id = auth.uid ()
            AND up.role = 'admin'
    )
);

-- Policy to allow users to upload visit photos (for insert operations)
CREATE POLICY "authenticated_users_can_upload_visit_photos" ON visit_photos FOR
INSERT
WITH
    CHECK (
        auth.role () = 'authenticated'
        AND uploaded_by = auth.uid ()
    );