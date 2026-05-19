# Wrap in a function so a truncated download doesn't execute partial code
function Install-Tool {
    $ErrorActionPreference = "Stop"

    $InstallDir = "$env:USERPROFILE\{{INSTALL_DIR_NAME}}"
    $ManifestUrl = "{{MANIFEST_URL}}"
    $TempDir = Join-Path $env:TEMP "{{INSTALL_DIR_NAME}}-install-$(Get-Random)"

    try {
        New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

        Write-Host "Installing {{TOOL_NAME}}..." -ForegroundColor Cyan
        Write-Host ""

        # ── Check/install Python 3.11+ ──────────────────────────────────
        $python = $null
        foreach ($cmd in @("python", "python3")) {
            try {
                $ver = & $cmd -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
                if ($ver) {
                    $parts = $ver -split '\.'
                    if ([int]$parts[0] -ge 3 -and [int]$parts[1] -ge 11) {
                        $python = $cmd
                        Write-Host "Found Python $ver"
                        break
                    }
                }
            } catch {}
        }

        if (-not $python) {
            Write-Host "Python 3.11+ not found. Installing Python 3.13..."
            $arch = if ([Environment]::Is64BitOperatingSystem) {
                if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "amd64" }
            } else { "win32" }
            $installerUrl = "https://www.python.org/ftp/python/3.13.3/python-3.13.3-$arch.exe"
            $installerPath = Join-Path $TempDir "python-installer.exe"
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
            Start-Process -FilePath $installerPath -ArgumentList "/quiet", "InstallAllUsers=0", "PrependPath=1" -Wait
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "User") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "Machine")
            $python = "python"
        }

        # ── Download latest bundle ───────────────────────────────────────
        Write-Host "Fetching latest version..."
        $manifest = Invoke-RestMethod -Uri $ManifestUrl
        $tag = $manifest.latest
        $release = $manifest.releases | Where-Object { $_.tag -eq $tag } | Select-Object -First 1

        Write-Host "Downloading {{TOOL_NAME}} $tag..."
        $bundlePath = Join-Path $TempDir "bundle.tar.gz"
        Invoke-WebRequest -Uri $release.bundle_url -OutFile $bundlePath

        # Verify SHA256 checksum
        if ($release.sha256) {
            $actualHash = (Get-FileHash -Path $bundlePath -Algorithm SHA256).Hash.ToLower()
            if ($actualHash -ne $release.sha256) {
                throw "Checksum verification failed! Expected: $($release.sha256), Got: $actualHash"
            }
            Write-Host "Checksum verified."
        }

        # ── Extract and install ──────────────────────────────────────────
        New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
        tar -xzf $bundlePath -C $InstallDir --strip-components=1

        # ── Create venv and install dependencies ─────────────────────────
        Write-Host "Setting up Python environment..."
        & $python -m venv "$InstallDir\.venv"
        & "$InstallDir\.venv\Scripts\pip.exe" install -r "$InstallDir\requirements.txt" --quiet

        Write-Host ""
        Write-Host "{{TOOL_NAME}} $tag installed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "To start {{TOOL_NAME}}:"
        Write-Host "  cd $InstallDir; .venv\Scripts\Activate.ps1; python {{ENTRY_POINT}}"
        Write-Host ""
        Write-Host "Then open http://localhost:{{SERVER_PORT}} in your browser."
    }
    finally {
        if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
    }
}

Install-Tool
