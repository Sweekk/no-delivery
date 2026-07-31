# Assumptions Log

1. **Supabase Integration**: Auth and database operations are managed via `@supabase/supabase-js`.
2. **Timer Window**: The substitution confirmation timer defaults to 3 minutes before auto-resolving.
3. **Dispatch Finalization**: Dispatch process requires all order items to be marked as picked or substituted.
