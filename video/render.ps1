$ErrorActionPreference = "Stop"
$ffmpegDir = "C:\Users\MonG\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin"
$env:PATH = "$ffmpegDir;$env:PATH"

Write-Host "Verifying FFmpeg..."
& ffmpeg.exe -version | Select-Object -First 1

Write-Host "Rendering HyperFrames video..."
Set-Location -Path "$PSScriptRoot"
& hyperframes.cmd render --output "renders/mlops_fraud_detection.mp4"
