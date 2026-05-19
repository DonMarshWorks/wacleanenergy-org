#!/bin/bash
set -eo pipefail

# Wrap everything in main() so a truncated download doesn't execute partial code
main() {
    INSTALL_DIR="$HOME/{{INSTALL_DIR_NAME}}"
    MANIFEST_URL="{{MANIFEST_URL}}"
    TMPDIR_INSTALL=""

    cleanup() {
        [ -n "$TMPDIR_INSTALL" ] && rm -rf "$TMPDIR_INSTALL"
    }
    trap cleanup EXIT

    TMPDIR_INSTALL=$(mktemp -d)

    echo "Installing {{TOOL_NAME}}..."
    echo ""

    # ── Detect OS ────────────────────────────────────────────────────────
    OS="$(uname -s)"
    case "$OS" in
        Darwin) PLATFORM="macos" ;;
        Linux)  PLATFORM="linux" ;;
        *)      echo "Error: Unsupported OS: $OS"; exit 1 ;;
    esac

    # ── Check/install Python 3.11+ ──────────────────────────────────────
    PYTHON=""
    for cmd in python3 python; do
        if command -v "$cmd" >/dev/null 2>&1; then
            version=$("$cmd" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
            major=$(echo "$version" | cut -d. -f1)
            minor=$(echo "$version" | cut -d. -f2)
            if [ "$major" -ge 3 ] && [ "$minor" -ge 11 ]; then
                PYTHON="$cmd"
                echo "Found Python $version"
                break
            fi
        fi
    done

    if [ -z "$PYTHON" ]; then
        echo "Python 3.11+ not found. Installing..."
        if [ "$PLATFORM" = "macos" ]; then
            echo "Downloading Python installer for macOS..."
            PKG_URL="https://www.python.org/ftp/python/3.13.3/python-3.13.3-macos11.pkg"
            PKG_PATH="$TMPDIR_INSTALL/python.pkg"
            curl -fsSL -o "$PKG_PATH" "$PKG_URL"
            echo "Installing Python (may require your password)..."
            sudo installer -pkg "$PKG_PATH" -target /
        else
            if command -v apt >/dev/null 2>&1; then
                sudo apt update && sudo apt install -y python3 python3-venv
            elif command -v dnf >/dev/null 2>&1; then
                sudo dnf install -y python3
            else
                echo "Error: Could not install Python. Please install Python 3.11+ manually."
                exit 1
            fi
        fi
        PYTHON="python3"
    fi

    # ── Download latest bundle ───────────────────────────────────────────
    echo "Fetching latest version..."
    MANIFEST_JSON="$TMPDIR_INSTALL/manifest.json"
    curl -fsSL -o "$MANIFEST_JSON" "$MANIFEST_URL"

    TAG=$($PYTHON -c "import json, sys; print(json.load(open(sys.argv[1]))['latest'])" "$MANIFEST_JSON")
    BUNDLE_URL=$($PYTHON -c "
import json, sys
data = json.load(open(sys.argv[1]))
r = next(r for r in data['releases'] if r['tag'] == sys.argv[2])
print(r['bundle_url'])
" "$MANIFEST_JSON" "$TAG")
    EXPECTED_SHA256=$($PYTHON -c "
import json, sys
data = json.load(open(sys.argv[1]))
r = next(r for r in data['releases'] if r['tag'] == sys.argv[2])
print(r.get('sha256', ''))
" "$MANIFEST_JSON" "$TAG")

    echo "Downloading {{TOOL_NAME}} $TAG..."
    BUNDLE_PATH="$TMPDIR_INSTALL/bundle.tar.gz"
    curl -fsSL -o "$BUNDLE_PATH" "$BUNDLE_URL"

    # Verify SHA256 checksum
    if [ -n "$EXPECTED_SHA256" ]; then
        if command -v sha256sum >/dev/null 2>&1; then
            ACTUAL_SHA256=$(sha256sum "$BUNDLE_PATH" | cut -d' ' -f1)
        elif command -v shasum >/dev/null 2>&1; then
            ACTUAL_SHA256=$(shasum -a 256 "$BUNDLE_PATH" | cut -d' ' -f1)
        else
            echo "Warning: Cannot verify checksum (sha256sum/shasum not found)"
            ACTUAL_SHA256="$EXPECTED_SHA256"
        fi
        if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
            echo "Error: Checksum verification failed!"
            echo "  Expected: $EXPECTED_SHA256"
            echo "  Got:      $ACTUAL_SHA256"
            exit 1
        fi
        echo "Checksum verified."
    fi

    # ── Extract and install ──────────────────────────────────────────────
    mkdir -p "$INSTALL_DIR"
    tar -xzf "$BUNDLE_PATH" -C "$INSTALL_DIR" --strip-components=1

    # ── Create venv and install dependencies ─────────────────────────────
    echo "Setting up Python environment..."
    $PYTHON -m venv "$INSTALL_DIR/.venv"
    source "$INSTALL_DIR/.venv/bin/activate"
    pip install -r "$INSTALL_DIR/requirements.txt" --quiet

    echo ""
    echo "{{TOOL_NAME}} $TAG installed successfully!"
    echo ""
    echo "To start {{TOOL_NAME}}:"
    echo "  cd $INSTALL_DIR && source .venv/bin/activate && python {{ENTRY_POINT}}"
    echo ""
    echo "Then open http://localhost:{{SERVER_PORT}} in your browser."
}

main "$@"
