
-- Attach existing prevent_user_type_change function as trigger on profiles
DROP TRIGGER IF EXISTS trg_prevent_user_type_change ON public.profiles;
CREATE TRIGGER trg_prevent_user_type_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_user_type_change();

-- Restrict EXECUTE on internal trigger/handler SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_deletion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_candidate_profile_ready() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_text_lengths() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_score_ranges() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_user_type_change() FROM PUBLIC, anon, authenticated;

-- get_user_type is referenced by RLS policies; keep available to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_user_type(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_type(uuid) TO authenticated;
