$ErrorActionPreference = "Stop"

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "Please run this script in an elevated PowerShell." -ForegroundColor Red
  exit 1
}

# Ensure PowerShell can run the uv installer in this process.
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  Write-Host "winget is required. Install it then re-run this script." -ForegroundColor Red
  exit 1
}

$packages = @(
  "Git.Git",
  "Kitware.CMake",
  "Python.Python.3.12",
  "Gyan.FFmpeg"
)

foreach ($pkg in $packages) {
  winget install -e --id $pkg --accept-package-agreements --accept-source-agreements
}

# Install uv
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
  irm https://astral.sh/uv/install.ps1 | iex
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Host "ffmpeg was not detected on PATH." -ForegroundColor Yellow
}

Write-Host "OpenBLAS and LAPACKE must be manually installed system-wide." -ForegroundColor Yellow
Write-Host "Use WSL or Docker for the most reliable setup." -ForegroundColor Yellow
