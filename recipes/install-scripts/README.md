# Recipe: install-scripts

Cross-platform installer scripts (`.sh` for macOS/Linux, `.ps1` for Windows)
that download a release bundle from a manifest URL, verify its SHA-256, and
unpack it into a user directory. Pairs naturally with the `r2-asset-proxy`
recipe — host the manifest and bundles in R2 and serve them through the
proxy.

## When to use

- You're shipping a downloadable tool/CLI alongside the website.
- You want a one-liner like `curl -fsSL https://example.com/install.sh | sh`
  or `iwr https://example.com/install.ps1 | iex`.
- The tool is **Python-based** with a tar.gz bundle and a `requirements.txt`.
  *If your tool isn't Python, you'll need to adapt the venv/requirements
  steps in the scripts — the download/verify/extract scaffolding still
  applies.*

## Manifest format

The scripts expect a JSON manifest at `MANIFEST_URL` shaped like:

```json
{
  "latest": "v1.2.3",
  "releases": [
    {
      "tag": "v1.2.3",
      "bundle_url": "https://example.com/releases/v1.2.3/bundle.tar.gz",
      "sha256": "<hex>"
    }
  ]
}
```

The bundle is a tar.gz that, when extracted with `--strip-components=1`,
gives a directory containing at minimum `requirements.txt` and your entry
point (e.g. `run.py`).

## What it adds

| File                  | Purpose                                |
| --------------------- | -------------------------------------- |
| `public/install.sh`   | macOS/Linux installer.                 |
| `public/install.ps1`  | Windows installer.                     |

Once deployed, they're served at `/install.sh` and `/install.ps1`.

## Apply

1. Copy `files/public/install.sh` → `public/install.sh`.
2. Copy `files/public/install.ps1` → `public/install.ps1`.
3. **Replace placeholders** in *both* scripts:
   - `{{TOOL_NAME}}` — display name (e.g. `MyTool`).
   - `{{INSTALL_DIR_NAME}}` — folder under `$HOME` / `%USERPROFILE%`
     (e.g. `mytool`).
   - `{{MANIFEST_URL}}` — full URL of the release manifest
     (e.g. `https://example.com/releases/manifest.json`).
   - `{{ENTRY_POINT}}` — Python entry filename (e.g. `run.py`).
   - `{{SERVER_PORT}}` — local port the tool serves on (e.g. `8080`).
4. On macOS/Linux, ensure the file is executable when committed:
   `chmod +x public/install.sh && git update-index --chmod=+x public/install.sh`.

## Manual steps for the user

- Create the manifest and bundle storage (typically R2 — apply the
  `r2-asset-proxy` recipe and host the manifest at e.g.
  `/assets/releases/manifest.json`).
- Decide on a release process for cutting new versions and updating the
  manifest. (A common pattern: a GitHub Actions release workflow that
  builds the bundle, uploads to R2, computes SHA-256, and patches
  `manifest.json`.)

## Notes

- Both scripts wrap the install in a function so a truncated download
  doesn't execute partial code — important for `curl | sh` style installs.
- SHA-256 verification is enforced when present; missing checksum prints a
  warning but proceeds (so you can ship without checksums during early
  development).
- The Linux branch tries `apt` then `dnf` — extend if you need other
  package managers.
- The macOS branch downloads the `.pkg` installer from python.org, which
  needs `sudo`. If that's a problem, swap to Homebrew or another approach.
