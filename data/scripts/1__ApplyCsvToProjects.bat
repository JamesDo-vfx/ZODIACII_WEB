@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -Command "$bat = '%~f0'; $csvArg = '%~1'; $lines = Get-Content -LiteralPath $bat; $marker = [Array]::IndexOf($lines, '# POWERSHELL_START'); if ($marker -lt 0) { Write-Error 'PowerShell payload marker not found.'; exit 1 }; $script = $lines[($marker + 1)..($lines.Length - 1)] -join [Environment]::NewLine; & ([ScriptBlock]::Create($script)) -BatPath $bat -CsvArg $csvArg"
set "RESULT=%ERRORLEVEL%"
if "%RESULT%"=="3" (
  echo.
  echo Cancelled. No files were changed.
  pause
  exit /b 0
)
if not "%RESULT%"=="0" (
  echo.
  echo Failed to apply CSV data to data\projects.js.
  pause
  exit /b %RESULT%
)

echo.
echo Done.
pause
exit /b 0

# POWERSHELL_START
param(
  [string]$BatPath,
  [string]$CsvArg
)

$ErrorActionPreference = 'Stop'

function Split-ListValue {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return @()
  }

  return @(
    $Value -split '\s*\|\s*' |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ -ne '' }
  )
}

function Get-TextValue {
  param(
    [object]$Row,
    [string]$Name
  )

  if ($Row.PSObject.Properties.Name -contains $Name) {
    return [string]$Row.$Name
  }

  # Handle UTF-8 BOM in CSV header (e.g. "﻿title").
  $bomName = ([char]0xFEFF) + $Name
  if ($Row.PSObject.Properties.Name -contains $bomName) {
    return [string]$Row.$bomName
  }

  return ''
}

function Get-FirstTextValue {
  param(
    [object]$Row,
    [string[]]$Names
  )

  foreach ($name in $Names) {
    $value = Get-TextValue -Row $Row -Name $name
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      return [string]$value
    }
  }

  return ''
}

function Normalize-CategorySlug {
  param([string]$Value)

  $v = "$Value".Trim().ToLowerInvariant()

  switch -Regex ($v) {
    '^(commercial|commerce|tvc|brand-film|brand film|ads?|advertising)$' { return 'commercial' }
    '^(music-video|music video|mv)$' { return 'music-video' }
    '^(film|movie|cinema|short-film|short film)$' { return 'film' }
    '^(billboard|ooh|outdoor|large-format|large format|led)$' { return 'billboard' }
    '^(tvshow|tv-show|tv show|television|tv)$' { return 'tvshow' }
    default { return $v }
  }
}

function Get-CategoryLabel {
  param([string]$Category)

  $slug = Normalize-CategorySlug $Category

  switch ($slug) {
    'commercial' { return 'Commercial' }
    'music-video' { return 'Music Video' }
    'film' { return 'Film' }
    'billboard' { return 'Billboard' }
    'tvshow' { return 'TV Show' }
    default {
      if ([string]::IsNullOrWhiteSpace($slug)) { return '' }

      return (($slug -split '[-_\s]+') | ForEach-Object {
        if ([string]::IsNullOrWhiteSpace($_)) { return $_ }
        $_.Substring(0,1).ToUpperInvariant() + $_.Substring(1).ToLowerInvariant()
      }) -join ' '
    }
  }
}

function Normalize-CardSize {
  param([string]$Value)

  $v = "$Value".Trim().ToLowerInvariant()
  if ($v -eq 'large') {
    return 'large'
  }

  return 'small'
}

function Import-ProjectCsvRows {
  param([string]$Path)

  # Prefer UTF-8 because project metadata contains Vietnamese text.
  try {
    $rowsUtf8 = @(Import-Csv -LiteralPath $Path -Encoding UTF8)
    if ($rowsUtf8.Count -gt 0) {
      return $rowsUtf8
    }
  } catch {
    # Continue to fallback strategies.
  }

  # Fallback: force UTF-8 read with BOM detection then parse from raw text.
  try {
    $utf8 = [System.Text.UTF8Encoding]::new($false)
    $reader = [System.IO.StreamReader]::new($Path, $utf8, $true)
    try {
      $rawUtf8 = $reader.ReadToEnd()
    } finally {
      $reader.Dispose()
    }
    $rowsFromRaw = @($rawUtf8 | ConvertFrom-Csv)
    if ($rowsFromRaw.Count -gt 0) {
      return $rowsFromRaw
    }
  } catch {
    # Continue to ANSI fallback.
  }

  # Fallback for legacy ANSI CSV files.
  return @(Import-Csv -LiteralPath $Path -Encoding Default)
}

function New-ProjectIndexContent {
@'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Project detail by Zodiac II Media.">
    <title>Project | Zodiac II Media</title>
    <link rel="icon" type="image/svg+xml" href="/assets/icons/zodiacii-logo.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/style.css">
  </head>
  <body data-page="project">
    <div class="grain" aria-hidden="true"></div>

    <header class="site-header" data-header>
      <a class="brand-mark" href="/" aria-label="Zodiac II Media home">Zodiac II Media</a>
      <div class="nav-timeline" aria-hidden="true">
        <span data-progress-segment></span><span data-progress-segment></span>
        <span data-progress-segment></span><span data-progress-segment></span>
        <span data-progress-segment></span><span data-progress-segment></span>
      </div>
      <nav class="nav-links" aria-label="Primary navigation">
        <button type="button" data-work-trigger>Work</button>
        <a href="/about/">About</a>
        <a href="/contact/">Contact</a>
      </nav>
    </header>

    <main id="page" class="page-shell">
      <article class="project-detail" data-project-page>
        <aside class="project-detail__info reveal">
          <a class="project-detail__back" href="/work/">Back To Work</a>
          <header class="project-detail__header">
            <p class="project-detail__category" data-project-category>Project</p>
            <h1 data-project-title>Project</h1>
            <p class="project-detail__client" data-project-client></p>
            <p class="project-detail__year" data-project-year></p>
          </header>

          <dl class="project-detail__meta">
            <div>
              <dt>Type</dt>
              <dd data-project-type></dd>
            </div>
            <div>
              <dt>Scope</dt>
              <dd data-project-role></dd>
            </div>
          </dl>

          <div class="project-detail__sections">
            <details class="project-disclosure">
              <summary>Description</summary>
              <p data-project-description></p>
            </details>
            <details class="project-disclosure">
              <summary>Credits</summary>
              <ul data-project-credits></ul>
            </details>
            <details class="project-disclosure">
              <summary>Awards</summary>
              <ul data-project-awards></ul>
            </details>
          </div>
        </aside>

        <section class="project-detail__media" aria-label="Project media">
          <div class="project-detail__player reveal">
            <video controls playsinline preload="metadata" data-project-video></video>
          </div>
          <div class="project-detail__gallery reveal" data-project-gallery></div>
        </section>
      </article>
    </main>

    <footer class="site-footer">
      <span>Zodiac II Media</span>
      <span>Ho Chi Minh City, Vietnam</span>
      <span>&copy; 2026</span>
      <span data-local-time>Local Time --:--</span>
    </footer>

    <script src="/data/projects.js" defer></script>
    <script src="https://unpkg.com/lenis@1.1.20/dist/lenis.min.js"></script>
    <script src="/script.js" defer></script>
  </body>
</html>
'@
}

$tempDir = Split-Path -Parent $BatPath
$repoRoot = Resolve-Path (Join-Path $tempDir '..\..')
$projectsPath = Join-Path $repoRoot 'data\projects.js'
$projectRoot = Join-Path $repoRoot 'project'

if ($CsvArg -and $CsvArg.Trim() -ne '') {
  $candidateCsv = $CsvArg
  if (-not [System.IO.Path]::IsPathRooted($candidateCsv)) {
    $candidateCsv = Join-Path $tempDir $candidateCsv
  }
  $csvPath = Resolve-Path $candidateCsv
} else {
  $csvPath = Get-ChildItem -LiteralPath $tempDir -Filter '*.csv' -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 -ExpandProperty FullName
}

if (-not $csvPath) {
  throw "No CSV file found in $tempDir."
}

if (-not (Test-Path -LiteralPath $projectsPath)) {
  throw "Cannot find $projectsPath."
}

$rows = Import-ProjectCsvRows -Path $csvPath
if (-not $rows -or $rows.Count -eq 0) {
  throw "CSV file has no project rows: $csvPath"
}

$projects = @()
foreach ($row in $rows) {
  $title = (Get-TextValue $row 'title').Trim()
  if ($title -eq '') {
    continue
  }

  $orderText = (Get-TextValue $row 'order').Trim()
  $order = 0
  if (-not [int]::TryParse($orderText, [ref]$order)) {
    $order = $projects.Count + 1
  }

  $featuredText = (Get-TextValue $row 'featured').Trim().ToLowerInvariant()
  $featured = @('true', '1', 'yes', 'y') -contains $featuredText

  $thumbnail = (Get-FirstTextValue $row @('thumbnail', 'image')).Trim()
  $mediaUrl = (Get-FirstTextValue $row @('embedUrl', 'video')).Trim()
  $categoryRaw = (Get-TextValue $row 'category').Trim()
  $category = Normalize-CategorySlug $categoryRaw
  if ([string]::IsNullOrWhiteSpace($category)) {
    Write-Warning "Project '$title' has empty category. Falling back to 'commercial'."
    $category = 'commercial'
  }
  $categoryLabel = Get-CategoryLabel $category
  $cardSizeRaw = (Get-TextValue $row 'cardSize').Trim()
  $cardSize = Normalize-CardSize $cardSizeRaw

  $project = [ordered]@{
    title = $title
    slug = (Get-TextValue $row 'slug').Trim()
    category = $category
    categoryLabel = $categoryLabel
    client = (Get-TextValue $row 'client').Trim()
    scope = (Get-TextValue $row 'scope').Trim()
    description = (Get-TextValue $row 'description').Trim()
    credits = @(Split-ListValue (Get-TextValue $row 'credits'))
    awards = @(Split-ListValue (Get-TextValue $row 'awards'))
    awardTag = (Get-FirstTextValue $row @('awardTag', 'award tag', 'award_tag')).Trim()
    thumbnail = $thumbnail
    previewVideo = (Get-TextValue $row 'previewVideo').Trim()
    embedUrl = $mediaUrl
    gallery = @(Split-ListValue (Get-TextValue $row 'gallery'))
    year = (Get-TextValue $row 'year').Trim()
    featured = $featured
    order = $order
    cardSize = $cardSize
  }

  $projects += [pscustomobject]$project
}

if ($projects.Count -eq 0) {
  throw "No valid projects were found in $csvPath."
}

$projectSlugs = @(
  $projects |
    ForEach-Object { [string]$_.slug } |
    ForEach-Object { $_.Trim().ToLowerInvariant() } |
    Where-Object { $_ -match '^[a-z0-9][a-z0-9-]*$' } |
    Sort-Object -Unique
)

$invalidProjectSlugs = @(
  $projects |
    ForEach-Object { [string]$_.slug } |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -ne '' -and $_ -notmatch '^[a-zA-Z0-9][a-zA-Z0-9-]*$' } |
    Sort-Object -Unique
)

$existingProjectSlugs = @()
if (Test-Path -LiteralPath $projectRoot) {
  $existingProjectSlugs = @(
    Get-ChildItem -LiteralPath $projectRoot -Directory |
      ForEach-Object { $_.Name.Trim().ToLowerInvariant() } |
      Where-Object { $_ -ne '' } |
      Sort-Object -Unique
  )
}

$missingProjectDirectories = @(
  $projectSlugs |
    Where-Object { $existingProjectSlugs -notcontains $_ }
)

$orphanProjectDirectories = @(
  $existingProjectSlugs |
    Where-Object { $projectSlugs -notcontains $_ }
)

$backupPath = "$projectsPath.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host ''
Write-Host 'CSV to projects.js import preview'
Write-Host '--------------------------------'
Write-Host "Source CSV       : $csvPath"
Write-Host "Action           : Read project rows from CSV and regenerate data\projects.js"
Write-Host "Output file      : $projectsPath"
Write-Host "Backup file      : $backupPath"
Write-Host "Projects detected: $($projects.Count)"
Write-Host "Project pages    : $($projectSlugs.Count) index.html files under project\"
Write-Host "Missing folders  : $($missingProjectDirectories.Count) (from CSV slug list)"
Write-Host "Orphan folders   : $($orphanProjectDirectories.Count) (exist in project\ but not in CSV)"
if ($invalidProjectSlugs.Count -gt 0) {
  Write-Host "Skipped slugs    : $($invalidProjectSlugs -join ', ')"
}
if ($missingProjectDirectories.Count -gt 0) {
  Write-Host "Missing list     : $($missingProjectDirectories -join ', ')"
}
if ($orphanProjectDirectories.Count -gt 0) {
  Write-Host "Orphan list      : $($orphanProjectDirectories -join ', ')"
}
Write-Host ''
Write-Host 'Category preview :'
foreach ($project in ($projects | Select-Object -First 12)) {
  Write-Host "  - $($project.title): $($project.category) / $($project.categoryLabel)"
}
if ($projects.Count -gt 12) {
  Write-Host "  ... and $($projects.Count - 12) more project(s)"
}
Write-Host ''
Write-Host 'No file will be changed until you confirm.'
Write-Host "Type Y to continue, or D to continue and delete orphan project folders."
Write-Host ''
$confirm = Read-Host 'Type Y or D then press Enter to continue'
$confirmValue = $confirm.Trim().ToLowerInvariant()
if ($confirmValue -notin @('y', 'yes', 'd', 'delete')) {
  Write-Host 'Cancelled by user.'
  exit 3
}

$deleteOrphans = $confirmValue -in @('d', 'delete')

Copy-Item -LiteralPath $projectsPath -Destination $backupPath -Force

$json = $projects | ConvertTo-Json -Depth 8
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

$projectIndexContent = New-ProjectIndexContent
$projectPagesWritten = 0
$sharedFolderNames = @('gallery', 'previewVideo', 'thumbnail')
foreach ($slug in $projectSlugs) {
  $projectDir = Join-Path $projectRoot $slug
  $projectIndexPath = Join-Path $projectDir 'index.html'
  New-Item -ItemType Directory -Path $projectDir -Force | Out-Null
  foreach ($folderName in $sharedFolderNames) {
    New-Item -ItemType Directory -Path (Join-Path $projectDir $folderName) -Force | Out-Null
  }
  [System.IO.File]::WriteAllText($projectIndexPath, $projectIndexContent, [System.Text.UTF8Encoding]::new($false))
  $projectPagesWritten += 1
}

$deletedOrphanCount = 0
if ($deleteOrphans -and $orphanProjectDirectories.Count -gt 0) {
  foreach ($slug in $orphanProjectDirectories) {
    $orphanDir = Join-Path $projectRoot $slug
    if (-not (Test-Path -LiteralPath $orphanDir -PathType Container)) {
      continue
    }

    $resolvedOrphanDir = [System.IO.Path]::GetFullPath($orphanDir)
    $resolvedProjectRoot = [System.IO.Path]::GetFullPath($projectRoot)
    if (-not $resolvedOrphanDir.StartsWith($resolvedProjectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      Write-Warning "Skip deleting '$orphanDir' because it is outside project root."
      continue
    }

    Remove-Item -LiteralPath $orphanDir -Recurse -Force
    $deletedOrphanCount += 1
  }
}

Write-Host "CSV: $csvPath"
Write-Host "Updated: $projectsPath"
Write-Host "Backup: $backupPath"
Write-Host "Projects written: $($projects.Count)"
Write-Host "Project pages written: $projectPagesWritten"
if ($deleteOrphans) {
  Write-Host "Orphan folders deleted: $deletedOrphanCount"
}

