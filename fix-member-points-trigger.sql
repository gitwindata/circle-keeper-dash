-- Fix Member Points Calculation Trigger (Safe Version)
-- Run this in Supabase SQL Editor

-- Create or replace the function with explicit field access
CREATE OR REPLACE FUNCTION update_member_stats_after_visit()
RETURNS TRIGGER AS $$
DECLARE
    v_member_id UUID;
    v_hairstylist_id UUID;
    v_final_price DECIMAL;
    v_member_tier membership_tier;
    v_points_to_add INTEGER;
    v_tier_multiplier DECIMAL;
BEGIN
    -- Extract values from NEW record explicitly
    v_member_id := NEW.member_id;
    v_hairstylist_id := NEW.hairstylist_id;
    v_final_price := NEW.final_price;
    
    -- Only process completed visits
    IF NEW.status != 'completed' THEN
        RETURN NEW;
    END IF;
    
    -- Get member's current tier
    SELECT membership_tier INTO v_member_tier 
    FROM members 
    WHERE id = v_member_id;
    
    -- Calculate tier multiplier
    v_tier_multiplier := CASE 
        WHEN v_member_tier = 'diamond' THEN 2.0
        WHEN v_member_tier = 'platinum' THEN 1.8
        WHEN v_member_tier = 'gold' THEN 1.5
        WHEN v_member_tier = 'silver' THEN 1.2
        WHEN v_member_tier = 'bronze' THEN 1.0
        ELSE 1.0
    END;
    
    -- Calculate points (1 point per 10k IDR)
    v_points_to_add := FLOOR((v_final_price / 10000.0) * v_tier_multiplier);
    
    -- Update member stats
    UPDATE members SET
        membership_points = membership_points + v_points_to_add,
        total_visits = total_visits + 1,
        total_spent = total_spent + v_final_price,
        last_visit_date = CURRENT_DATE
    WHERE id = v_member_id;
    
    -- Update hairstylist stats  
    UPDATE hairstylists SET
        total_revenue = total_revenue + v_final_price
    WHERE id = v_hairstylist_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger with simple condition
CREATE TRIGGER update_stats_after_visit 
    AFTER INSERT ON visits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_member_stats_after_visit();