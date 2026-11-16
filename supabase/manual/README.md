# Manual SQL

Files in this directory are **not** migrations. `supabase db push` ignores them. Run each file by hand in the SQL editor, and only when its own header says the precondition is met.

| File | When to run |
| --- | --- |
| `20261025140001_validate_messages_body_max_length.sql` | After `20261025140000_pre_purchase_enquiry_limits.sql` has added `messages_body_max_length` as `NOT VALID`, and only after `supabase/preflight/2026-10-25_preflight.sql` shows `long_message_count = 0`. A non-zero count means at least one existing message is longer than 3000 characters; validating the constraint would fail and block the session. |

Samuel runs the pre-flight on production. On the test project (`vhfskuabgsudbaiqotth`), run the same pre-flight there before validating. Do not validate early to "see what happens".
