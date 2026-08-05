<#
.SYNOPSIS
  Crops and resizes any photo into the exact size the portfolio needs.

.DESCRIPTION
  Center-crops the source photo to the correct aspect ratio (no squashing),
  resizes it, honours EXIF rotation from phone cameras, and writes the result
  straight into assets/ with the right filename.

.EXAMPLE
  .\tools\prepare-image.ps1 -In "C:\Users\Rylle\Pictures\tip.jpg" -For about

.EXAMPLE
  .\tools\prepare-image.ps1 -In "C:\Users\Rylle\Pictures\onsite.jpg" -For experience -Anchor Top

.EXAMPLE
  .\tools\prepare-image.ps1 -In "C:\Users\Rylle\Pictures\shot.png" -For project -Name philprop
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$In,

  [Parameter(Mandatory = $true)]
  [ValidateSet('about', 'experience', 'project')]
  [string]$For,

  # Only used with -For project. One of: philprop, lutong-bahay, messenger-ai
  [string]$Name,

  # Which part of the photo to keep when cropping.
  # Top/Bottom apply when height is being trimmed (e.g. a tall photo into a wide slot).
  # Left/Right apply when width is being trimmed (e.g. a wide photo into a square slot).
  [ValidateSet('Center', 'Top', 'Bottom', 'Left', 'Right')]
  [string]$Anchor = 'Center',

  # auto = PNG for project screenshots, JPEG for photos.
  # Override with jpg when a screenshot is photo-heavy (a big hero image),
  # which compresses far smaller than PNG.
  [ValidateSet('auto', 'jpg', 'png')]
  [string]$Format = 'auto',

  [ValidateRange(50, 100)]
  [int]$Quality = 88
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot

# ── target spec per slot ────────────────────────────────────────────
switch ($For) {
  'about'      { $tw = 1000; $th = 1000; $out = Join-Path $root 'assets\about.jpg' }
  'experience' { $tw = 1600; $th =  900; $out = Join-Path $root 'assets\experience.jpg' }
  'project'    {
    if ([string]::IsNullOrWhiteSpace($Name)) {
      throw "-For project also needs -Name (philprop, lutong-bahay, or messenger-ai)"
    }
    $tw = 1600; $th = 1000
    # PNG for screenshots — JPEG artifacts smear UI text
    $out = Join-Path $root ('assets\projects\{0}.png' -f $Name)
  }
}

# apply an explicit format override
if ($Format -ne 'auto') {
  $out = [System.IO.Path]::ChangeExtension($out, $Format)
}

if (-not (Test-Path -LiteralPath $In)) { throw "Source image not found: $In" }

$inFull = (Resolve-Path -LiteralPath $In).Path
$src = [System.Drawing.Image]::FromFile($inFull)

try {
  # ── honour EXIF orientation (phone photos) ────────────────────────
  if ($src.PropertyIdList -contains 0x0112) {
    $o = $src.GetPropertyItem(0x0112).Value[0]
    switch ($o) {
      3 { $src.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
      6 { $src.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
      8 { $src.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
    }
  }

  # ── work out the biggest crop with the target aspect ratio ────────
  $targetRatio = $tw / $th
  $srcRatio = $src.Width / $src.Height

  if ($srcRatio -gt $targetRatio) {
    # source is wider than the slot -> trim width, anchor horizontally
    $cropH = $src.Height
    $cropW = [int][math]::Round($src.Height * $targetRatio)
    $y = 0
    $x = switch ($Anchor) {
      'Left'  { 0 }
      'Right' { $src.Width - $cropW }
      default { [int][math]::Floor(($src.Width - $cropW) / 2) }
    }
  }
  else {
    # source is taller than the slot -> trim height, anchor vertically
    $cropW = $src.Width
    $cropH = [int][math]::Round($src.Width / $targetRatio)
    $x = 0
    $y = switch ($Anchor) {
      'Top'    { 0 }
      'Bottom' { $src.Height - $cropH }
      default  { [int][math]::Floor(($src.Height - $cropH) / 2) }
    }
  }

  # ── render ────────────────────────────────────────────────────────
  $bmp = New-Object System.Drawing.Bitmap($tw, $th)
  $bmp.SetResolution(96, 96)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  try {
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $dst = New-Object System.Drawing.Rectangle(0, 0, $tw, $th)
    $crop = New-Object System.Drawing.Rectangle($x, $y, $cropW, $cropH)
    $g.DrawImage($src, $dst, $crop, [System.Drawing.GraphicsUnit]::Pixel)
  }
  finally { $g.Dispose() }

  # ── save as JPEG at the requested quality ─────────────────────────
  $outDir = Split-Path -Parent $out
  if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
  }

  if ($out -like '*.png') {
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  else {
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
      [System.Drawing.Imaging.Encoder]::Quality, [int64]$Quality)
    $bmp.Save($out, $codec, $encParams)
  }
}
finally {
  if ($bmp) { $bmp.Dispose() }
  $src.Dispose()
}

$kb = [math]::Round((Get-Item -LiteralPath $out).Length / 1KB, 1)
Write-Host ""
Write-Host "  Saved  $out" -ForegroundColor Green
Write-Host "  Size   $tw x $th px  |  $kb KB  |  anchor: $Anchor"
Write-Host ""
if ($kb -gt 500) {
  if ($out -like '*.png') {
    Write-Host "  Tip: heavy for a screenshot. PNG ignores -Quality; shrink it at" -ForegroundColor Yellow
    Write-Host "       squoosh.app, or use a cleaner screenshot with less photo detail." -ForegroundColor Yellow
  }
  else {
    Write-Host "  Tip: that's a bit heavy. Re-run with -Quality 75 to shrink it." -ForegroundColor Yellow
  }
  Write-Host ""
}
