<#
.SYNOPSIS
    Builds all three Angular POC projects (ntier, clean, hexagonal).

.DESCRIPTION
    Runs a production build (npm run build) for each project folder under POC.
    Dependencies are installed automatically the first time (when node_modules
    is missing); pass -Install to force a reinstall for every project.

.EXAMPLE
    .\build-all.ps1
    .\build-all.ps1 -Install
    .\build-all.ps1 -Projects clean_architecture,hexagonal_architecture
#>

[CmdletBinding()]
param(
    # Force `npm install` for every project, even if node_modules exists.
    [switch]$Install,

    # Which projects to build (defaults to all three).
    [string[]]$Projects = @('ntier_architecture', 'clean_architecture', 'hexagonal_architecture')
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

Write-Host "Building Angular POC projects under: $root" -ForegroundColor Cyan
$node = (& node --version) 2>$null
$npm  = (& npm --version) 2>$null
Write-Host "Node $node - npm $npm`n" -ForegroundColor DarkGray

$results = @()

foreach ($proj in $Projects) {
    $path = Join-Path $root $proj
    Write-Host "=== $proj ===" -ForegroundColor Cyan

    if (-not (Test-Path $path)) {
        Write-Host "  SKIP - folder not found: $path`n" -ForegroundColor Yellow
        $results += [pscustomobject]@{ Project = $proj; Status = 'MISSING'; Time = '-' }
        continue
    }

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    Push-Location $path
    try {
        $needsInstall = $Install -or -not (Test-Path (Join-Path $path 'node_modules'))
        if ($needsInstall) {
            Write-Host "  npm install ..." -ForegroundColor DarkGray
            npm install
            if ($LASTEXITCODE -ne 0) { throw "npm install failed (exit $LASTEXITCODE)" }
        }
        else {
            Write-Host "  dependencies present - skipping npm install" -ForegroundColor DarkGray
        }

        Write-Host "  npm run build ..." -ForegroundColor DarkGray
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed (exit $LASTEXITCODE)" }

        $sw.Stop()
        Write-Host "  OK ($([math]::Round($sw.Elapsed.TotalSeconds,1))s)`n" -ForegroundColor Green
        $results += [pscustomobject]@{ Project = $proj; Status = 'OK'; Time = "$([math]::Round($sw.Elapsed.TotalSeconds,1))s" }
    }
    catch {
        $sw.Stop()
        Write-Host "  FAILED: $_`n" -ForegroundColor Red
        $results += [pscustomobject]@{ Project = $proj; Status = 'FAILED'; Time = "$([math]::Round($sw.Elapsed.TotalSeconds,1))s" }
    }
    finally {
        Pop-Location
    }
}

Write-Host "===== Build Summary =====" -ForegroundColor Cyan
$results | Format-Table -AutoSize | Out-String | Write-Host

$failed = @($results | Where-Object { $_.Status -ne 'OK' })
if ($failed.Count -gt 0) {
    Write-Host "$($failed.Count) project(s) did not build cleanly." -ForegroundColor Red
    exit 1
}

Write-Host "All projects built successfully." -ForegroundColor Green
exit 0
