-- Add notifications table for admin alerts and extend transaction statuses
BEGIN;

-- 1) Ensure transactions status supports failed and processing
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check CHECK (status IN ('pending','completed','failed','processing'));

-- 2) Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  target_role TEXT NOT NULL DEFAULT 'admin',
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  -- Admins can view admin-targeted notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Admins can view admin notifications'
  ) THEN
    CREATE POLICY "Admins can view admin notifications"
    ON public.notifications
    FOR SELECT
    USING (target_role = 'admin' AND is_admin());
  END IF;

  -- Users can view their own notifications (if any created for them)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Users can insert notifications for actions they trigger (e.g., withdrawal request)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can insert their own notifications'
  ) THEN
    CREATE POLICY "Users can insert their own notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Admins can update admin notifications (e.g., mark as read)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Admins can update admin notifications'
  ) THEN
    CREATE POLICY "Admins can update admin notifications"
    ON public.notifications
    FOR UPDATE
    USING (target_role = 'admin' AND is_admin());
  END IF;
END $$;

-- 3) Timestamp trigger for notifications.updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_notifications_updated_at'
  ) THEN
    CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

COMMIT;