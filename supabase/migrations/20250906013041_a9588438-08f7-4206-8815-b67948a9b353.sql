-- Fix signup failure: allow null cpf and phone on initial signup
ALTER TABLE public.profiles
  ALTER COLUMN cpf DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;

-- Ensure trigger exists to create profile on new user signup (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END
$$;