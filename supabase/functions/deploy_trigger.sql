
-- Apply the updated handle_signup_code_usage trigger function
SELECT pg_catalog.set_config('search_path', '', false);
DROP TRIGGER IF EXISTS handle_new_user_signup_code ON auth.users;
CREATE TRIGGER handle_new_user_signup_code
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_signup_code_usage();
