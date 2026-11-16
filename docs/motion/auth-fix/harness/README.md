# Auth-slide harness

The product no longer ships a Log in / Create account **tab bar**. Mode switches happen only via the inline "Create an account" / "Log in" links below the form, and those links drive the 480 ms panel slide (MOTION_SPEC §14). This suite asserts the tablist is absent and only exercises the links.

## `--expect` modes

`authslide_suite.py --expect links-only` (default). Deprecated aliases `links-slide` and `tabs-slide` map to the same links-only behaviour. The runner reads `EXPECT=` and writes to `runs/<sha>-<expect>/`.

- **links-only**: hard-fails if any `[role=tab]`, `[role=tablist]`, `.mm-auth-tabs`, `.mm-auth-tab-indicator`, `#auth-tab-signin`, or `#auth-tab-signup` is in the DOM (desktop and mobile, both modes). The full 480 ms slide checks run on the inline links. Rapid taps hit the links (5 alternate create/log-in clicks in ~300 ms). History is driven by one link change + Back/Forward. Reduced motion and mobile also use links only. Video is `desktop_1440_links.{webm,mp4}` (link→signup, link→signin).

## Run

```bash
EXPECT=links-only ./run_against_ref.sh <git-ref> [port] [outdir]
# or against an already-running server:
python3 authslide_suite.py --base http://localhost:PORT --out DIR --label NAME --expect links-only
```

Contrast probe (panel text vs orange, logo fills): `python3 contrast_probe.py --base http://localhost:PORT --out contrast.json`.
