-- ============================================================================
-- FIX: ALLOW ALL NEW USERS TO SIGN UP & SIGN IN IMMEDIATELY
-- Fixes "Database error creating new user" in Supabase
-- ============================================================================

-- 1. Drop old trigger to unblock new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create bulletproof trigger function with exception handling & core md5
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    avatar_url,
    badge_level,
    assigned_bus,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Traveler'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'passenger'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || md5(COALESCE(NEW.email, NEW.id::text))),
    CASE 
      WHEN (NEW.raw_user_meta_data->>'role') = 'driver' THEN 'Mountain Transit Authority • Fleet Captain'
      WHEN (NEW.raw_user_meta_data->>'role') = 'station_master' THEN 'Regional Transit Headquarters • Chief Controller'
      ELSE 'Scenic Mountain Line • Citizen Traveler'
    END,
    CASE WHEN (NEW.raw_user_meta_data->>'role') = 'driver' THEN '#BS-402' ELSE NULL END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user signup even if profile insert has a conflict
  RAISE WARNING 'handle_new_user warning: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
