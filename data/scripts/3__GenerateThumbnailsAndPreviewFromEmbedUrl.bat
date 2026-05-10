@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -Command "$bat = '%~f0'; $csvArg = '%~1'; $lines = Get-Content -LiteralPath $bat; $marker = [Array]::IndexOf($lines, '# POWERSHELL_START'); if ($marker -lt 0) { Write-Error 'PowerShell payload marker not found.'; exit 1 }; $script = $lines[($marker + 1)..($lines.Length - 1)] -join [Environment]::NewLine; & ([ScriptBlock]::Create($script)) -BatPath $bat -CsvArg $csvArg"
set "RESULT=%ERRORLEVEL%"
if "%RESULT%"=="3" (
  echo.
  echo Cancelled.
  pause
  exit /b 0
)
if not "%RESULT%"=="0" (
  echo.
  echo Failed to generate thumbnails/previews from embedUrl.
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

function Get-TextValue {
  param(
    [object]$Row,
    [string]$Name
  )

  if ($Row.PSObject.Properties.Name -contains $Name) {
    return [string]$Row.$Name
  }

  return ''
}

function Get-VideoProvider {
  param([string]$Url)

  if ([string]::IsNullOrWhiteSpace($Url)) {
    return ''
  }

  $u = $Url.Trim()
  if ($u -match '(?i)(youtube\.com|youtu\.be)') {
    return 'youtube'
  }
  if ($u -match '(?i)(vimeo\.com)') {
    return 'vimeo'
  }
  if ($u -match '(?i)(tiktok\.com|vm\.tiktok\.com|t\.tiktok\.com)') {
    return 'tiktok'
  }

  return ''
}

function Get-VideoIdFromUrl {
  param(
    [string]$Url,
    [string]$Provider
  )

  if ([string]::IsNullOrWhiteSpace($Url)) {
    return ''
  }

  $u = $Url.Trim()

  if ($Provider -eq 'youtube') {
    $patterns = @(
      '(?i)youtube\.com/embed/([a-zA-Z0-9_-]{6,})',
      '(?i)[?&]v=([a-zA-Z0-9_-]{6,})',
      '(?i)youtu\.be/([a-zA-Z0-9_-]{6,})'
    )
    foreach ($p in $patterns) {
      $m = [regex]::Match($u, $p)
      if ($m.Success) {
        return $m.Groups[1].Value
      }
    }
    return ''
  }

  if ($Provider -eq 'vimeo') {
    $patterns = @(
      '(?i)player\.vimeo\.com/video/([0-9]+)',
      '(?i)vimeo\.com/([0-9]+)'
    )
    foreach ($p in $patterns) {
      $m = [regex]::Match($u, $p)
      if ($m.Success) {
        return $m.Groups[1].Value
      }
    }
    return ''
  }

  if ($Provider -eq 'tiktok') {
    $patterns = @(
      '(?i)tiktok\.com/@[^/]+/video/([0-9]+)',
      '(?i)tiktok\.com/v/([0-9]+)',
      '(?i)/video/([0-9]+)',
      '(?i)tiktok\.com/.+?[?&]item_id=([0-9]+)'
    )
    foreach ($p in $patterns) {
      $m = [regex]::Match($u, $p)
      if ($m.Success) {
        return $m.Groups[1].Value
      }
    }
    return ''
  }

  return ''
}

function Invoke-DownloadFile {
  param(
    [string]$Url,
    [string]$OutputPath
  )

  try {
    Invoke-WebRequest -Uri $Url -OutFile $OutputPath -UseBasicParsing -TimeoutSec 30 | Out-Null
    if (Test-Path -LiteralPath $OutputPath) {
      $fi = Get-Item -LiteralPath $OutputPath
      return $fi.Length -gt 0
    }
  } catch {
    return $false
  }

  return $false
}

function Convert-ImageToWebp {
  param(
    [string]$InputPath,
    [string]$OutputPath
  )

  $args = @(
    '-y',
    '-i', $InputPath,
    '-vf', 'scale=960:-2',
    '-q:v', '80',
    $OutputPath
  )
  & ffmpeg @args | Out-Null
  if ($LASTEXITCODE -ne 0) {
    return $false
  }
  return (Test-Path -LiteralPath $OutputPath)
}

function Convert-ToEmbedUrl {
  param(
    [string]$Provider,
    [string]$VideoId,
    [string]$OriginalUrl
  )

  if ($Provider -eq 'youtube' -and $VideoId) {
    return "https://www.youtube.com/embed/$VideoId"
  }
  if ($Provider -eq 'vimeo' -and $VideoId) {
    return "https://player.vimeo.com/video/$VideoId"
  }
  if ($Provider -eq 'tiktok') {
    return $OriginalUrl
  }
  return $OriginalUrl
}

function Get-ThumbnailUrlFromYtDlp {
  param([string]$SourceUrl)

  try {
    $thumbUrl = & yt-dlp --skip-download --no-warnings --print thumbnail $SourceUrl 2>$null
    if ($LASTEXITCODE -ne 0) {
      return ''
    }
    if ($thumbUrl -is [array]) {
      $thumbUrl = $thumbUrl | Select-Object -Last 1
    }
    $thumbUrl = [string]$thumbUrl
    return $thumbUrl.Trim()
  } catch {
    return ''
  }
}

function Update-ProjectsJsPaths {
  param(
    [string]$ProjectsPath,
    [hashtable]$GeneratedPathBySlug
  )

  if (-not (Test-Path -LiteralPath $ProjectsPath)) {
    Write-Warning "projects.js not found: $ProjectsPath"
    return $false
  }

  $raw = Get-Content -LiteralPath $ProjectsPath -Raw
  $match = [regex]::Match($raw, '(?s)const\s+projects\s*=\s*(\[[\s\S]*?\]);')
  if (-not $match.Success) {
    Write-Warning "Cannot parse projects array from $ProjectsPath"
    return $false
  }

  $projects = $match.Groups[1].Value | ConvertFrom-Json
  $updated = 0

  foreach ($p in $projects) {
    $slug = ([string]$p.slug).Trim().ToLowerInvariant()
    if ($GeneratedPathBySlug.ContainsKey($slug)) {
      $info = $GeneratedPathBySlug[$slug]
      if ($info.ContainsKey('thumbnail')) {
        $p.thumbnail = $info['thumbnail']
      }
      if ($info.ContainsKey('previewVideo')) {
        $p.previewVideo = $info['previewVideo']
      }
      $updated += 1
    }
  }

  $backupPath = "$ProjectsPath.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Copy-Item -LiteralPath $ProjectsPath -Destination $backupPath -Force

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

  [System.IO.File]::WriteAllText($ProjectsPath, $content, [System.Text.UTF8Encoding]::new($false))
  Write-Host "[OK] projects.js updated ($updated project(s))"
  Write-Host "Backup: $backupPath"
  return $true
}

function Resolve-ToolCommand {
  param([string]$Name)
  return Get-Command $Name -ErrorAction SilentlyContinue
}

function Install-YtDlp {
  $winget = Resolve-ToolCommand -Name 'winget'
  if ($winget) {
    Write-Host "Installing yt-dlp via winget..."
    & winget install -e --id yt-dlp.yt-dlp --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -eq 0) { return $true }
  }

  $python = Resolve-ToolCommand -Name 'python'
  if ($python) {
    Write-Host "Installing yt-dlp via python -m pip..."
    & python -m pip install -U yt-dlp
    if ($LASTEXITCODE -eq 0) { return $true }
  }

  $py = Resolve-ToolCommand -Name 'py'
  if ($py) {
    Write-Host "Installing yt-dlp via py -m pip..."
    & py -m pip install -U yt-dlp
    if ($LASTEXITCODE -eq 0) { return $true }
  }

  return $false
}

function Install-Ffmpeg {
  $winget = Resolve-ToolCommand -Name 'winget'
  if ($winget) {
    Write-Host "Installing ffmpeg via winget..."
    & winget install -e --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -eq 0) { return $true }
  }

  return $false
}

function Ensure-Tool {
  param(
    [string]$ToolName,
    [scriptblock]$InstallScript,
    [string]$InstallHint
  )

  $cmd = Resolve-ToolCommand -Name $ToolName
  if ($cmd) {
    return $cmd
  }

  Write-Host "[WARN] $ToolName not found in PATH"
  Write-Host "Install hint: $InstallHint"
  $confirm = Read-Host "Install $ToolName now? (Y/N)"
  if ($confirm.Trim().ToLowerInvariant() -notin @('y', 'yes')) {
    return $null
  }

  $ok = & $InstallScript
  if (-not $ok) {
    return $null
  }

  $cmd = Resolve-ToolCommand -Name $ToolName
  return $cmd
}

function Read-PreviewDurationSeconds {
  param([int]$DefaultSeconds = 2)

  $input = Read-Host "Preview duration in seconds? (default: $DefaultSeconds)"
  if ([string]::IsNullOrWhiteSpace($input)) {
    return [double]$DefaultSeconds
  }

  $normalized = $input.Trim().Replace(',', '.')
  $value = 0.0
  if (-not [double]::TryParse($normalized, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$value)) {
    Write-Host "[WARN] Invalid number. Using default: $DefaultSeconds second(s)."
    return [double]$DefaultSeconds
  }

  if ($value -le 0) {
    Write-Host "[WARN] Duration must be > 0. Using default: $DefaultSeconds second(s)."
    return [double]$DefaultSeconds
  }

  if ($value -gt 15) {
    Write-Host "[WARN] Duration too long for preview. Capped to 15 second(s)."
    return [double]15
  }

  return $value
}

function Read-ExistingMediaMode {
  $input = Read-Host "If media already exists, choose: [O]verwrite or [S]kip-existing (default: O)"
  if ([string]::IsNullOrWhiteSpace($input)) {
    return 'overwrite'
  }
  $v = $input.Trim().ToLowerInvariant()
  if ($v -in @('s', 'skip', 'skip-existing')) {
    return 'skip-existing'
  }
  return 'overwrite'
}

$scriptDir = Split-Path -Parent $BatPath
$repoRoot = (Resolve-Path (Join-Path $scriptDir '..\..')).Path
$projectRoot = Join-Path $repoRoot 'project'
$projectsJsPath = Join-Path $repoRoot 'data\projects.js'

if (-not (Test-Path -LiteralPath $projectRoot)) {
  throw "Cannot find project root: $projectRoot"
}

$yt = Ensure-Tool -ToolName 'yt-dlp' -InstallScript ${function:Install-YtDlp} -InstallHint 'winget install yt-dlp.yt-dlp'
if (-not $yt) {
  Write-Host "[ERROR] yt-dlp is required but not available."
  exit 1
}

$ffmpeg = Ensure-Tool -ToolName 'ffmpeg' -InstallScript ${function:Install-Ffmpeg} -InstallHint 'winget install Gyan.FFmpeg'
if (-not $ffmpeg) {
  Write-Host "[ERROR] ffmpeg is required but not available."
  exit 1
}

if ($CsvArg -and $CsvArg.Trim() -ne '') {
  $candidateCsv = $CsvArg
  if (-not [System.IO.Path]::IsPathRooted($candidateCsv)) {
    $candidateCsv = Join-Path $scriptDir $candidateCsv
  }
  $csvPath = (Resolve-Path $candidateCsv).Path
} else {
  $csvPath = Get-ChildItem -LiteralPath $scriptDir -Filter '*.csv' -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 -ExpandProperty FullName
}

if (-not $csvPath) {
  throw "No CSV file found in $scriptDir"
}

$rows = Import-Csv -LiteralPath $csvPath
if (-not $rows -or $rows.Count -eq 0) {
  throw "CSV file has no rows: $csvPath"
}

$totalRows = $rows.Count
$rowsMissingSlug = 0
$rowsMissingEmbed = 0
$rowsUnsupportedProvider = 0
$rowsReady = 0
$rowsExistingMedia = 0
$skipMissingSlugItems = New-Object System.Collections.Generic.List[string]
$skipMissingEmbedItems = New-Object System.Collections.Generic.List[string]
$skipUnsupportedProviderItems = New-Object System.Collections.Generic.List[string]
$skipParseVideoIdItems = New-Object System.Collections.Generic.List[string]
$existingMediaItems = New-Object System.Collections.Generic.List[string]

foreach ($row in $rows) {
  $slugPreview = (Get-TextValue -Row $row -Name 'slug').Trim()
  $titlePreview = (Get-TextValue -Row $row -Name 'title').Trim()
  $embedPreview = (Get-TextValue -Row $row -Name 'embedUrl').Trim()
  $labelPreview = if ($slugPreview) { $slugPreview } elseif ($titlePreview) { $titlePreview } else { '<unknown>' }

  if ([string]::IsNullOrWhiteSpace($slugPreview)) {
    $rowsMissingSlug += 1
    $skipMissingSlugItems.Add($labelPreview) | Out-Null
    continue
  }

  if ([string]::IsNullOrWhiteSpace($embedPreview)) {
    $rowsMissingEmbed += 1
    $skipMissingEmbedItems.Add($labelPreview) | Out-Null
    continue
  }

  $providerPreview = Get-VideoProvider -Url $embedPreview
  if (-not $providerPreview) {
    $rowsUnsupportedProvider += 1
    $skipUnsupportedProviderItems.Add("$labelPreview -> $embedPreview") | Out-Null
    continue
  }

  $videoIdPreview = Get-VideoIdFromUrl -Url $embedPreview -Provider $providerPreview
  if (-not $videoIdPreview) {
    $rowsUnsupportedProvider += 1
    $skipParseVideoIdItems.Add("$labelPreview -> $embedPreview") | Out-Null
    continue
  }

  $thumbPreviewPath = Join-Path $projectRoot (Join-Path $slugPreview 'thumbnail\\thumb.webp')
  $previewPreviewPath = Join-Path $projectRoot (Join-Path $slugPreview 'previewVideo\\preview.webm')
  if ((Test-Path -LiteralPath $thumbPreviewPath) -or (Test-Path -LiteralPath $previewPreviewPath)) {
    $rowsExistingMedia += 1
    $existingMediaItems.Add($labelPreview) | Out-Null
  }

  $rowsReady += 1
}

$estimatedSkip = $rowsMissingSlug + $rowsMissingEmbed + $rowsUnsupportedProvider
$previewDurationSec = Read-PreviewDurationSeconds -DefaultSeconds 2
$previewDurationArg = $previewDurationSec.ToString([System.Globalization.CultureInfo]::InvariantCulture)
$existingMediaMode = Read-ExistingMediaMode

Write-Host ""
Write-Host "Preflight summary"
Write-Host "-----------------"
Write-Host "CSV source                 : $csvPath"
Write-Host "Project root               : $projectRoot"
Write-Host "Output thumbnail pattern   : project/<slug>/thumbnail/thumb.webp"
Write-Host "Output preview pattern     : project/<slug>/previewVideo/preview.webm"
Write-Host "Total rows                 : $totalRows"
Write-Host "Ready to process           : $rowsReady"
Write-Host "Will skip (missing slug)   : $rowsMissingSlug"
Write-Host "Will skip (missing embed)  : $rowsMissingEmbed"
Write-Host "Will skip (unsupported URL): $rowsUnsupportedProvider"
Write-Host "Estimated skipped rows     : $estimatedSkip"
Write-Host "Projects with existing media: $rowsExistingMedia"
Write-Host "Existing media mode        : $existingMediaMode"
Write-Host "Preview duration (seconds) : $previewDurationArg"
Write-Host "Using yt-dlp               : $($yt.Source)"
Write-Host "Using ffmpeg               : $($ffmpeg.Source)"
Write-Host ""
if ($skipMissingSlugItems.Count -gt 0) {
  Write-Host "Skip detail - missing slug:"
  foreach ($item in ($skipMissingSlugItems | Select-Object -Unique)) {
    Write-Host "  - $item"
  }
}
if ($skipMissingEmbedItems.Count -gt 0) {
  Write-Host "Skip detail - missing embedUrl:"
  foreach ($item in ($skipMissingEmbedItems | Select-Object -Unique)) {
    Write-Host "  - $item"
  }
}
if ($skipUnsupportedProviderItems.Count -gt 0) {
  Write-Host "Skip detail - unsupported provider URL:"
  foreach ($item in ($skipUnsupportedProviderItems | Select-Object -Unique)) {
    Write-Host "  - $item"
  }
}
if ($skipParseVideoIdItems.Count -gt 0) {
  Write-Host "Skip detail - cannot parse video id:"
  foreach ($item in ($skipParseVideoIdItems | Select-Object -Unique)) {
    Write-Host "  - $item"
  }
}
if ($existingMediaItems.Count -gt 0) {
  Write-Host "Existing media detected:"
  foreach ($item in ($existingMediaItems | Select-Object -Unique)) {
    Write-Host "  - $item"
  }
}
if (
  $skipMissingSlugItems.Count -gt 0 -or
  $skipMissingEmbedItems.Count -gt 0 -or
  $skipUnsupportedProviderItems.Count -gt 0 -or
  $skipParseVideoIdItems.Count -gt 0 -or
  $existingMediaItems.Count -gt 0
) {
  Write-Host ""
}
Write-Host "No files will be changed until you confirm."
$startConfirm = Read-Host "Type Y then press Enter to start"
if ($startConfirm.Trim().ToLowerInvariant() -notin @('y', 'yes')) {
  Write-Host "Cancelled by user."
  exit 3
}

$totalRows = $rows.Count
$withEmbedCount = 0
$thumbOk = 0
$previewOk = 0
$skipCount = 0
$warnCount = 0
$errorCount = 0
$skipExistingCount = 0
$failedProjects = New-Object System.Collections.Generic.List[string]
$skipExistingProjects = New-Object System.Collections.Generic.List[string]
$generatedPaths = @{}

$tempRoot = Join-Path $env:TEMP ("zodiacii_embed_media_" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
Write-Host ""
Write-Host "Start processing..."
Write-Host ""

foreach ($row in $rows) {
  $slug = (Get-TextValue -Row $row -Name 'slug').Trim()
  $title = (Get-TextValue -Row $row -Name 'title').Trim()
  $embedUrl = (Get-TextValue -Row $row -Name 'embedUrl').Trim()
  $nameForLog = if ($slug) { $slug } elseif ($title) { $title } else { '<unknown>' }

  try {
    if ([string]::IsNullOrWhiteSpace($slug)) {
      Write-Host "[SKIP] $nameForLog -> missing slug"
      $skipCount += 1
      continue
    }

    if ([string]::IsNullOrWhiteSpace($embedUrl)) {
      Write-Host "[SKIP] $slug -> no embedUrl"
      $skipCount += 1
      continue
    }

    $withEmbedCount += 1

    $provider = Get-VideoProvider -Url $embedUrl
    if (-not $provider) {
      Write-Host "[WARN] $slug -> unsupported provider"
      $warnCount += 1
      continue
    }

    $videoId = Get-VideoIdFromUrl -Url $embedUrl -Provider $provider
    if (-not $videoId) {
      Write-Host "[WARN] $slug -> cannot parse video id"
      $warnCount += 1
      continue
    }

    $projectDir = Join-Path $projectRoot $slug
    $thumbDir = Join-Path $projectDir 'thumbnail'
    $previewDir = Join-Path $projectDir 'previewVideo'
    New-Item -ItemType Directory -Path $projectDir -Force | Out-Null
    New-Item -ItemType Directory -Path $thumbDir -Force | Out-Null
    New-Item -ItemType Directory -Path $previewDir -Force | Out-Null

    $thumbPath = Join-Path $thumbDir 'thumb.webp'
    $previewPath = Join-Path $previewDir 'preview.webm'
    $tempThumbInputPath = Join-Path $tempRoot ($slug + '_thumb_src.jpg')

    if (
      $existingMediaMode -eq 'skip-existing' -and
      (
        (Test-Path -LiteralPath $thumbPath) -or
        (Test-Path -LiteralPath $previewPath)
      )
    ) {
      Write-Host "[SKIP] $slug -> existing media found (skip-existing mode)"
      $skipCount += 1
      $skipExistingCount += 1
      $skipExistingProjects.Add($slug) | Out-Null
      continue
    }

    $thumbnailSaved = $false
    if ($provider -eq 'youtube') {
      $thumbCandidates = @(
        "https://i.ytimg.com/vi/$videoId/maxresdefault.jpg",
        "https://i.ytimg.com/vi/$videoId/hqdefault.jpg"
      )

      foreach ($tUrl in $thumbCandidates) {
        if (Invoke-DownloadFile -Url $tUrl -OutputPath $thumbPath) {
          $thumbnailSaved = $true
          break
        }
      }
    } elseif ($provider -eq 'vimeo') {
      try {
        $oembedUrl = 'https://vimeo.com/api/oembed.json?url=' + [uri]::EscapeDataString((Convert-ToEmbedUrl -Provider $provider -VideoId $videoId -OriginalUrl $embedUrl))
        $oembed = Invoke-RestMethod -Uri $oembedUrl -Method Get -TimeoutSec 30
        $thumbUrl = [string]$oembed.thumbnail_url
        if (-not [string]::IsNullOrWhiteSpace($thumbUrl)) {
          $thumbnailSaved = Invoke-DownloadFile -Url $thumbUrl -OutputPath $tempThumbInputPath
        }
      } catch {
        $thumbnailSaved = $false
      }
    } elseif ($provider -eq 'tiktok') {
      $thumbUrl = Get-ThumbnailUrlFromYtDlp -SourceUrl $embedUrl
      if (-not [string]::IsNullOrWhiteSpace($thumbUrl)) {
        $thumbnailSaved = Invoke-DownloadFile -Url $thumbUrl -OutputPath $tempThumbInputPath
      }
    }

    if ($provider -eq 'youtube' -and $thumbnailSaved) {
      $tempDownloadedJpg = Join-Path $tempRoot ($slug + '_thumb_src.jpg')
      Move-Item -LiteralPath $thumbPath -Destination $tempDownloadedJpg -Force
      $thumbnailSaved = Convert-ImageToWebp -InputPath $tempDownloadedJpg -OutputPath $thumbPath
      Remove-Item -LiteralPath $tempDownloadedJpg -Force -ErrorAction SilentlyContinue
    } elseif (($provider -eq 'vimeo' -or $provider -eq 'tiktok') -and $thumbnailSaved) {
      $thumbnailSaved = Convert-ImageToWebp -InputPath $tempThumbInputPath -OutputPath $thumbPath
      Remove-Item -LiteralPath $tempThumbInputPath -Force -ErrorAction SilentlyContinue
    }

    if ($thumbnailSaved) {
      Write-Host "[OK] $slug -> thumbnail saved"
      $thumbOk += 1
    } else {
      Write-Host "[WARN] $slug -> thumbnail failed"
      $warnCount += 1
    }

    $sourceUrl = Convert-ToEmbedUrl -Provider $provider -VideoId $videoId -OriginalUrl $embedUrl
    $tmpOutTemplate = Join-Path $tempRoot ($slug + '.%(ext)s')

    $ytArgs = @(
      '--no-warnings',
      '--no-progress',
      '--restrict-filenames',
      '-f', 'mp4/best',
      '-o', $tmpOutTemplate,
      $sourceUrl
    )
    & yt-dlp @ytArgs | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "[ERROR] $slug -> yt-dlp failed"
      $errorCount += 1
      $failedProjects.Add($slug) | Out-Null
      continue
    }

    $downloaded = Get-ChildItem -LiteralPath $tempRoot -File |
      Where-Object { $_.BaseName -eq $slug -or $_.Name -like "$slug.*" } |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1

    if (-not $downloaded) {
      Write-Host "[ERROR] $slug -> downloaded source not found"
      $errorCount += 1
      $failedProjects.Add($slug) | Out-Null
      continue
    }

    $ffArgs = @(
      '-y',
      '-ss', '5',
      '-i', $downloaded.FullName,
      '-t', $previewDurationArg,
      '-an',
      '-vf', 'scale=960:-2,fps=24',
      '-c:v', 'libvpx-vp9',
      '-b:v', '0',
      '-crf', '34',
      $previewPath
    )
    & ffmpeg @ffArgs | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "[ERROR] $slug -> ffmpeg failed"
      $errorCount += 1
      $failedProjects.Add($slug) | Out-Null
      continue
    }

    Remove-Item -LiteralPath $downloaded.FullName -Force -ErrorAction SilentlyContinue

    if (Test-Path -LiteralPath $previewPath) {
      Write-Host "[OK] $slug -> preview saved"
      $previewOk += 1
    } else {
      Write-Host "[ERROR] $slug -> preview output missing"
      $errorCount += 1
      $failedProjects.Add($slug) | Out-Null
      continue
    }

    $slugKey = $slug.Trim().ToLowerInvariant()
    $generatedPaths[$slugKey] = @{
      thumbnail = "/project/$slug/thumbnail/thumb.webp"
      previewVideo = "/project/$slug/previewVideo/preview.webm"
    }
  } catch {
    Write-Host "[ERROR] $nameForLog -> $($_.Exception.Message)"
    $errorCount += 1
    if ($slug) {
      $failedProjects.Add($slug) | Out-Null
    }
    continue
  }
}

Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========== Summary =========="
Write-Host "CSV source              : $csvPath"
Write-Host "Total rows              : $totalRows"
Write-Host "Projects with embedUrl  : $withEmbedCount"
Write-Host "Thumbnails created      : $thumbOk"
Write-Host "Previews created        : $previewOk"
Write-Host "Skipped projects        : $skipCount"
Write-Host "Skipped (existing media): $skipExistingCount"
Write-Host "Warnings                : $warnCount"
Write-Host "Failed projects         : $errorCount"
if ($failedProjects.Count -gt 0) {
  $failedList = ($failedProjects | Select-Object -Unique) -join ', '
  Write-Host "Failed slug(s)          : $failedList"
}
if ($skipMissingSlugItems.Count -gt 0) {
  Write-Host "Skipped (missing slug)  : $(($skipMissingSlugItems | Select-Object -Unique) -join ', ')"
}
if ($skipMissingEmbedItems.Count -gt 0) {
  Write-Host "Skipped (missing embed) : $(($skipMissingEmbedItems | Select-Object -Unique) -join ', ')"
}
if ($skipUnsupportedProviderItems.Count -gt 0) {
  Write-Host "Skipped (unsupported URL): $(($skipUnsupportedProviderItems | Select-Object -Unique) -join ' | ')"
}
if ($skipParseVideoIdItems.Count -gt 0) {
  Write-Host "Skipped (parse id fail) : $(($skipParseVideoIdItems | Select-Object -Unique) -join ' | ')"
}
if ($skipExistingProjects.Count -gt 0) {
  Write-Host "Skipped (existing media): $(($skipExistingProjects | Select-Object -Unique) -join ', ')"
}

if ($generatedPaths.Count -gt 0 -and (Test-Path -LiteralPath $projectsJsPath)) {
  Write-Host ""
  $updateConfirm = Read-Host 'Update thumbnail and previewVideo paths in data/projects.js? (Y/N)'
  if ($updateConfirm.Trim().ToLowerInvariant() -in @('y', 'yes')) {
    Update-ProjectsJsPaths -ProjectsPath $projectsJsPath -GeneratedPathBySlug $generatedPaths | Out-Null
  } else {
    Write-Host "Skip updating data/projects.js"
  }
}

exit 0
