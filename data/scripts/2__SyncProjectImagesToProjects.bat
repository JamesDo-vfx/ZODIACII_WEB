@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -Command "$bat = '%~f0'; $lines = Get-Content -LiteralPath $bat; $marker = [Array]::IndexOf($lines, '# POWERSHELL_START'); if ($marker -lt 0) { Write-Error 'PowerShell payload marker not found.'; exit 1 }; $script = $lines[($marker + 1)..($lines.Length - 1)] -join [Environment]::NewLine; & ([ScriptBlock]::Create($script)) -BatPath $bat"
set "RESULT=%ERRORLEVEL%"
if "%RESULT%"=="3" (
  echo.
  echo Cancelled. No files were changed.
  pause
  exit /b 0
)
if not "%RESULT%"=="0" (
  echo.
  echo Failed to sync project images into data\projects.js.
  pause
  exit /b %RESULT%
)

echo.
echo Done.
pause
exit /b 0

# POWERSHELL_START
param(
  [string]$BatPath
)

$ErrorActionPreference = 'Stop'

function Convert-ToWebPath {
  param(
    [string]$AbsolutePath,
    [string]$RepoRoot
  )

  $repoFull = [System.IO.Path]::GetFullPath($RepoRoot)
  $absFull = [System.IO.Path]::GetFullPath($AbsolutePath)

  if (-not $repoFull.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $repoFull += [System.IO.Path]::DirectorySeparatorChar
  }

  $repoUri = [System.Uri]$repoFull
  $absUri = [System.Uri]$absFull
  $relative = [System.Uri]::UnescapeDataString($repoUri.MakeRelativeUri($absUri).ToString())
  $relative = $relative -replace '\\', '/'
  return "/$relative"
}

function Get-PreferredCoverImage {
  param([array]$Files)

  $cover = $Files | Where-Object { $_.Name -match '(?i)(thumb|thumbnail|cover|poster|hero|key)' } | Select-Object -First 1
  if ($cover) {
    return $cover
  }
  return $Files | Select-Object -First 1
}

function Read-TextFilePreferUtf8 {
  param([string]$Path)

  # Prefer UTF-8 with BOM detection to avoid mojibake when projects.js contains Vietnamese text.
  try {
    $utf8 = [System.Text.UTF8Encoding]::new($false)
    $reader = [System.IO.StreamReader]::new($Path, $utf8, $true)
    try {
      return $reader.ReadToEnd()
    } finally {
      $reader.Dispose()
    }
  } catch {
    # Fallback for legacy ANSI files.
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::Default)
  }
}

$imageExtensions = @(
  '.jpg', '.jpeg', '.jpe', '.jfif',
  '.png', '.webp', '.avif', '.gif', '.bmp',
  '.tif', '.tiff', '.svg', '.ico', '.heic', '.heif'
)
$videoExtensions = @(
  '.webm', '.mp4', '.m4v', '.mov', '.avi', '.mkv'
)

$scriptDir = Split-Path -Parent $BatPath
$repoRoot = (Resolve-Path (Join-Path $scriptDir '..\..')).Path
$projectsPath = Join-Path $repoRoot 'data\projects.js'
$projectRoot = Join-Path $repoRoot 'project'
$fallbackThumbnailPath = Join-Path $projectRoot 'placehole_image.jpg'
$fallbackPreviewVideoPath = Join-Path $projectRoot 'placehole_video.webm'

if (-not (Test-Path -LiteralPath $projectsPath)) {
  throw "Cannot find $projectsPath."
}

if (-not (Test-Path -LiteralPath $projectRoot)) {
  throw "Cannot find project root: $projectRoot."
}

if (-not (Test-Path -LiteralPath $fallbackThumbnailPath)) {
  throw "Cannot find fallback thumbnail: $fallbackThumbnailPath."
}

if (-not (Test-Path -LiteralPath $fallbackPreviewVideoPath)) {
  throw "Cannot find fallback preview video: $fallbackPreviewVideoPath."
}

$raw = Read-TextFilePreferUtf8 -Path $projectsPath
$match = [regex]::Match($raw, '(?s)const\s+projects\s*=\s*(\[[\s\S]*?\]);')
if (-not $match.Success) {
  throw "Cannot parse projects array from $projectsPath."
}

$projects = $match.Groups[1].Value | ConvertFrom-Json
if (-not $projects -or $projects.Count -eq 0) {
  throw "No projects found in $projectsPath."
}

$bySlug = @{}
foreach ($p in $projects) {
  $slug = [string]$p.slug
  if (-not [string]::IsNullOrWhiteSpace($slug)) {
    $bySlug[$slug.Trim().ToLowerInvariant()] = $p
  }
}

$projectDirs = Get-ChildItem -LiteralPath $projectRoot -Directory
$updatedCount = 0
$unknownSlugDirs = New-Object System.Collections.Generic.List[string]
$sharedFolderNames = @('gallery', 'previewVideo', 'thumbnail')
$fallbackThumbnailWeb = Convert-ToWebPath -AbsolutePath $fallbackThumbnailPath -RepoRoot $repoRoot
$fallbackPreviewVideoWeb = Convert-ToWebPath -AbsolutePath $fallbackPreviewVideoPath -RepoRoot $repoRoot

function Get-FilesByExtensions {
  param(
    [string]$Path,
    [string[]]$Extensions
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return @()
  }

  return @(
    Get-ChildItem -LiteralPath $Path -File -Recurse |
      Where-Object { $Extensions -contains $_.Extension.ToLowerInvariant() } |
      Sort-Object FullName
  )
}

foreach ($dir in $projectDirs) {
  foreach ($folderName in $sharedFolderNames) {
    New-Item -ItemType Directory -Path (Join-Path $dir.FullName $folderName) -Force | Out-Null
  }

  $slug = $dir.Name.Trim().ToLowerInvariant()
  if (-not $bySlug.ContainsKey($slug)) {
    $unknownSlugDirs.Add($dir.Name) | Out-Null
    continue
  }

  $galleryDir = Join-Path $dir.FullName 'gallery'
  $thumbnailDir = Join-Path $dir.FullName 'thumbnail'
  $previewVideoDir = Join-Path $dir.FullName 'previewVideo'

  $galleryFiles = Get-FilesByExtensions -Path $galleryDir -Extensions $imageExtensions
  $thumbnailFiles = Get-FilesByExtensions -Path $thumbnailDir -Extensions $imageExtensions
  $allProjectImages = Get-FilesByExtensions -Path $dir.FullName -Extensions $imageExtensions
  $previewVideoFiles = Get-FilesByExtensions -Path $previewVideoDir -Extensions $videoExtensions

  $gallerySource = if ($galleryFiles.Count -gt 0) {
    $galleryFiles
  } elseif ($thumbnailFiles.Count -gt 0) {
    $thumbnailFiles
  } else {
    $allProjectImages
  }

  $webGallery = if ($gallerySource.Count -gt 0) {
    @($gallerySource | ForEach-Object { Convert-ToWebPath -AbsolutePath $_.FullName -RepoRoot $repoRoot })
  } else {
    @($fallbackThumbnailWeb)
  }

  # Build a flat array without `+` so single FileInfo values do not trigger op_Addition.
  $coverPool = @(
    $thumbnailFiles
    $galleryFiles
    $allProjectImages
  ) | Where-Object { $_ -is [System.IO.FileInfo] }
  $coverCandidate = if ($coverPool.Count -gt 0) {
    Get-PreferredCoverImage -Files $coverPool
  } else {
    $null
  }
  if ($coverCandidate) {
    $coverWeb = Convert-ToWebPath -AbsolutePath $coverCandidate.FullName -RepoRoot $repoRoot
  } else {
    $coverWeb = $fallbackThumbnailWeb
  }

  $previewVideoCandidate = $previewVideoFiles | Select-Object -First 1
  if ($previewVideoCandidate) {
    $previewVideoWeb = Convert-ToWebPath -AbsolutePath $previewVideoCandidate.FullName -RepoRoot $repoRoot
  } else {
    $previewVideoWeb = $fallbackPreviewVideoWeb
  }

  $project = $bySlug[$slug]
  $project.gallery = @($webGallery)
  $project.thumbnail = $coverWeb
  $project.previewVideo = $previewVideoWeb
  $updatedCount += 1
}

$unmatchedProjects = @(
  $projects |
    Where-Object { $_.slug -and -not (Test-Path -LiteralPath (Join-Path $projectRoot $_.slug)) } |
    ForEach-Object { $_.slug }
)

$backupPath = "$projectsPath.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host ''
Write-Host 'Project image sync preview'
Write-Host '--------------------------'
Write-Host "Project root     : $projectRoot"
Write-Host "Projects file    : $projectsPath"
Write-Host "Backup file      : $backupPath"
Write-Host "Projects total   : $($projects.Count)"
Write-Host "Projects updated : $updatedCount"
Write-Host "Dir not in data  : $($unknownSlugDirs.Count)"
Write-Host "Data not in dir  : $($unmatchedProjects.Count)"
if ($unknownSlugDirs.Count -gt 0) {
  Write-Host "Unknown dirs     : $($unknownSlugDirs -join ', ')"
}
if ($unmatchedProjects.Count -gt 0) {
  Write-Host "Missing dirs     : $($unmatchedProjects -join ', ')"
}
Write-Host ''
Write-Host 'No file will be changed until you confirm.'
Write-Host ''
$confirm = Read-Host 'Type Y then press Enter to continue'
if ($confirm.Trim().ToLowerInvariant() -notin @('y', 'yes')) {
  Write-Host 'Cancelled by user.'
  exit 3
}

Copy-Item -LiteralPath $projectsPath -Destination $backupPath -Force

$json = $projects | ConvertTo-Json -Depth 10
$content = @"
// Generated from CSV by data/temp/ApplyCsvToProjects.bat.
const projects = $json;

const getProjectOrder = (project) =>
  Number.isFinite(project.order) ? project.order : Number.POSITIVE_INFINITY;

window.projects = projects
  .map((project, index) => ({ project, index }))
  .sort((a, b) => getProjectOrder(a.project) - getProjectOrder(b.project) || a.index - b.index)
  .map(({ project }) => project);
"@

[System.IO.File]::WriteAllText($projectsPath, $content, [System.Text.UTF8Encoding]::new($false))

Write-Host "Updated: $projectsPath"
Write-Host "Backup : $backupPath"
Write-Host "Synced : $updatedCount project(s)"
