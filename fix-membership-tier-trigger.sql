-- Fix the update_membership_tier function
-- The issue is it's looking for NEW.member_id but the field is NEW.id

CREATE OR REPLACE FUNCTION update_membership_tier()
RETURNS TRIGGER AS $$
DECLARE
    new_tier membership_tier;
    current_tier membership_tier;
BEGIN
    -- Use NEW.id instead of NEW.member_id since this is the members table
    current_tier := OLD.membership_tier;
    
    -- Calculate new tier based on total visits and spending
    SELECT CASE
        WHEN NEW.total_visits >= 50 OR NEW.total_spent >= 10000000 THEN 'diamond'::membership_tier
        WHEN NEW.total_visits >= 30 OR NEW.total_spent >= 5000000 THEN 'platinum'::membership_tier  
        WHEN NEW.total_visits >= 20 OR NEW.total_spent >= 2500000 THEN 'gold'::membership_tier
        WHEN NEW.total_visits >= 10 OR NEW.total_spent >= 1000000 THEN 'silver'::membership_tier
        ELSE 'bronze'::membership_tier
    END INTO new_tier;
    
    -- Update tier if changed and add bonus points
    IF new_tier != current_tier THEN
        NEW.membership_tier := new_tier;
        NEW.membership_points := NEW.membership_points + 
            CASE new_tier
                WHEN 'diamond' THEN 1000
                WHEN 'platinum' THEN 500
                WHEN 'gold' THEN 250
                WHEN 'silver' THEN 100
                ELSE 0
            END;
        
        -- Log tier change
        INSERT INTO membership_level_history (member_id, previous_tier, new_tier, reason)
        VALUES (NEW.id, current_tier, new_tier, 'Automatic tier upgrade based on activity');
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';