-- 1. Clean up duplicates in mediation_presence
-- Keep only the most recent record for each (dispute_id, user_id) pair
DELETE FROM public.mediation_presence a USING (
      SELECT MIN(ctid) as ctid, dispute_id, user_id
      FROM public.mediation_presence 
      GROUP BY dispute_id, user_id HAVING COUNT(*) > 1
      ) b
      WHERE a.dispute_id = b.dispute_id 
      AND a.user_id = b.user_id 
      AND a.ctid <> b.ctid;

-- 2. Add Unique Constraint to prevent future duplicates
-- This ensures one user can only have ONE presence record per dispute
ALTER TABLE public.mediation_presence
ADD CONSTRAINT mediation_presence_dispute_user_unique UNIQUE (dispute_id, user_id);

-- 3. Create index for performance if not exists
CREATE INDEX IF NOT EXISTS idx_mediation_presence_lookup 
ON public.mediation_presence(dispute_id, user_id);
