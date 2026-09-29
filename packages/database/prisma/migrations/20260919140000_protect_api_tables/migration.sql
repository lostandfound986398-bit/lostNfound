-- Application data is accessed through the NestJS API using its server database role.
-- Browser clients use Supabase Auth and Storage, not the public table Data API.
BEGIN;

ALTER TABLE public."master_people" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."item_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."item_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."item_matches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."claim_proofs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."release_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."announcements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."audit_logs" ENABLE ROW LEVEL SECURITY;

-- Keep this migration compatible with plain PostgreSQL development databases.
DO $$
DECLARE
  client_role text;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE public."master_people" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."users" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."categories" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."locations" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."item_reports" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."item_images" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."item_matches" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."claims" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."claim_proofs" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."release_transactions" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."notifications" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."announcements" FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public."audit_logs" FROM %I', client_role);
    END IF;
  END LOOP;
END
$$;

COMMIT;
