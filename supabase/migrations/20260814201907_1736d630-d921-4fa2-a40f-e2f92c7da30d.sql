INSERT INTO public.user_plan_overrides (user_id, plan_type, expires_at) 
VALUES ('b82f8ded-1c7f-462c-9e18-98be8e3681ff', 'lifetime', NULL)
ON CONFLICT (user_id) 
DO UPDATE SET plan_type = 'lifetime', expires_at = NULL;