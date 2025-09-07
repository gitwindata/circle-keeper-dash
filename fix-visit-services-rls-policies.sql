-- Fix missing RLS policies for visit_services table
-- The visit_services table has RLS enabled but no policies defined,
-- which blocks all access to the table

-- Add RLS policies for visit_services table
CREATE POLICY "Members can view their own visit services" ON visit_services FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM visits
            WHERE
                id = visit_services.visit_id
                AND member_id = auth.uid ()
        )
    );

CREATE POLICY "Hairstylists can view visit services for their visits" ON visit_services FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM visits
            WHERE
                id = visit_services.visit_id
                AND hairstylist_id = auth.uid ()
        )
    );

CREATE POLICY "Admins can view all visit services" ON visit_services FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );

CREATE POLICY "Hairstylists can manage visit services for their visits" ON visit_services FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM visits
        WHERE
            id = visit_services.visit_id
            AND hairstylist_id = auth.uid ()
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM visits
            WHERE
                id = visit_services.visit_id
                AND hairstylist_id = auth.uid ()
        )
    );

CREATE POLICY "Admins can manage all visit services" ON visit_services FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );