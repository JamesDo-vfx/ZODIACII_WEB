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
# Prevent native tool stderr (ffmpeg/yt-dlp banners/progress) from becoming terminating errors.
$PSNativeCommandUseErrorActionPreference = $false

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
    $oldProgressPreference = $ProgressPreference
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $Url -OutFile $OutputPath -UseBasicParsing -TimeoutSec 30 | Out-Null
    $ProgressPreference = $oldProgressPreference
    if (Test-Path -LiteralPath $OutputPath) {
      $fi = Get-Item -LiteralPath $OutputPath
      return $fi.Length -gt 0
    }
  } catch {
    $ProgressPreference = $oldProgressPreference
    return $false
  }

  return $false
}

function Convert-ImageToWebp {
  param(
    [object]$FfmpegRunner,
    [string]$InputPath,
    [string]$OutputPath,
    [ref]$ErrorLines
  )

  $args = @(
    '-hide_banner',
    '-loglevel', 'error',
    '-nostats',
    '-y',
    '-i', $InputPath,
    '-vf', 'scale=960:-2',
    '-q:v', '80',
    $OutputPath
  )
  $ok = Invoke-ExternalQuiet -Command $FfmpegRunner.Command -BaseArgs $FfmpegRunner.BaseArgs -NativeArgs $args -ErrorLines $ErrorLines
  return ($ok -and (Test-Path -LiteralPath $OutputPath))
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
  param(
    [object]$YtRunner,
    [string]$SourceUrl
  )

  try {
    $thumbUrl = & $YtRunner.Command @($YtRunner.BaseArgs + @('--quiet', '--no-warnings', '--no-progress', '--skip-download', '--print', 'thumbnail', $SourceUrl)) 2>$null
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

function Invoke-ExternalQuiet {
  param(
    [string]$Command,
    [string[]]$BaseArgs = @(),
    [string[]]$NativeArgs = @(),
    [ref]$ErrorLines
  )

  $ErrorLines.Value = @()
  $oldErrorActionPreference = $ErrorActionPreference
  $previousNativePref = $PSNativeCommandUseErrorActionPreference
  $stderrFile = Join-Path $env:TEMP ("zodiacii_stderr_" + [guid]::NewGuid().ToString('N') + ".log")
  $stdoutFile = Join-Path $env:TEMP ("zodiacii_stdout_" + [guid]::NewGuid().ToString('N') + ".log")
  try {
    # Keep native stderr from being promoted to terminating PowerShell errors.
    $ErrorActionPreference = 'Continue'
    $PSNativeCommandUseErrorActionPreference = $false

    $argList = @($BaseArgs + $NativeArgs) |
      Where-Object { $_ -ne $null } |
      ForEach-Object { [string]$_ } |
      Where-Object { $_.Length -gt 0 }
    $proc = Start-Process -FilePath $Command -ArgumentList $argList -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile
    $exitCode = $proc.ExitCode
  } finally {
    $ErrorActionPreference = $oldErrorActionPreference
    $PSNativeCommandUseErrorActionPreference = $previousNativePref
  }

  if ($exitCode -eq 0) {
    Remove-Item -LiteralPath $stderrFile, $stdoutFile -Force -ErrorAction SilentlyContinue
    return $true
  }

  $stderrLines = @()
  if (Test-Path -LiteralPath $stderrFile) {
    $stderrLines = @(Get-Content -LiteralPath $stderrFile -ErrorAction SilentlyContinue)
  }
  $stdoutLines = @()
  if (Test-Path -LiteralPath $stdoutFile) {
    $stdoutLines = @(Get-Content -LiteralPath $stdoutFile -ErrorAction SilentlyContinue)
  }

  $parsed = @($stderrLines + $stdoutLines) |
    ForEach-Object { [string]$_ } |
    Where-Object {
      -not [string]::IsNullOrWhiteSpace($_) -and
      $_ -notmatch '^\s*ffmpeg version\s'
    } |
    Select-Object -First 3

  Remove-Item -LiteralPath $stderrFile, $stdoutFile -Force -ErrorAction SilentlyContinue
  $ErrorLines.Value = @($parsed)
  return $false
}

function Resolve-YtDlpRunner {
  $cmd = Resolve-ToolCommand -Name 'yt-dlp'
  if ($cmd) {
    return @{
      Kind = 'command'
      Label = $cmd.Source
      Command = $cmd.Source
      BaseArgs = @()
    }
  }

  $py = Resolve-ToolCommand -Name 'py'
  if ($py) {
    & $py.Source -m yt_dlp --version 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      return @{
        Kind = 'py-module'
        Label = "$($py.Source) -m yt_dlp"
        Command = $py.Source
        BaseArgs = @('-m', 'yt_dlp')
      }
    }
  }

  $python = Resolve-ToolCommand -Name 'python'
  if ($python) {
    & $python.Source -m yt_dlp --version 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      return @{
        Kind = 'python-module'
        Label = "$($python.Source) -m yt_dlp"
        Command = $python.Source
        BaseArgs = @('-m', 'yt_dlp')
      }
    }
  }

  return $null
}

function Resolve-FfmpegRunner {
  $cmd = Resolve-ToolCommand -Name 'ffmpeg'
  if ($cmd) {
    return @{
      Label = $cmd.Source
      Command = $cmd.Source
      BaseArgs = @()
    }
  }

  $searchPatterns = @(
    (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_*\\**\\bin\\ffmpeg.exe'),
    (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\ffmpeg.exe'),
    (Join-Path $env:ProgramFiles 'ffmpeg\bin\ffmpeg.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'ffmpeg\bin\ffmpeg.exe')
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

  foreach ($pattern in $searchPatterns) {
    try {
      $matches = Get-ChildItem -Path $pattern -File -ErrorAction SilentlyContinue
      $best = $matches | Sort-Object LastWriteTime -Descending | Select-Object -First 1
      if ($best) {
        return @{
          Label = $best.FullName
          Command = $best.FullName
          BaseArgs = @()
        }
      }
    } catch {
      # continue searching
    }
  }

  return $null
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

function Ensure-YtDlp {
  $runner = Resolve-YtDlpRunner
  if ($runner) {
    return $runner
  }

  Write-Host "[WARN] yt-dlp not found in PATH"
  Write-Host "Install hint: winget install yt-dlp.yt-dlp"
  $confirm = Read-Host "Install yt-dlp now? (Y/N)"
  if ($confirm.Trim().ToLowerInvariant() -notin @('y', 'yes')) {
    return $null
  }

  $ok = Install-YtDlp
  if (-not $ok) {
    return $null
  }

  return (Resolve-YtDlpRunner)
}

function Ensure-Ffmpeg {
  $runner = Resolve-FfmpegRunner
  if ($runner) {
    return $runner
  }

  Write-Host "[WARN] ffmpeg not found in PATH"
  Write-Host "Install hint: winget install Gyan.FFmpeg"
  $confirm = Read-Host "Install ffmpeg now? (Y/N)"
  if ($confirm.Trim().ToLowerInvariant() -notin @('y', 'yes')) {
    return $null
  }

  $ok = Install-Ffmpeg
  if (-not $ok) {
    return $null
  }

  return (Resolve-FfmpegRunner)
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

$yt = Ensure-YtDlp
if (-not $yt) {
  Write-Host "[ERROR] yt-dlp is required but not available."
  exit 1
}

$ffmpeg = Ensure-Ffmpeg
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

$rows = Import-ProjectCsvRows -Path $csvPath
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
Write-Host "Total rows                 : $totalRows"
Write-Host "Ready to process           : $rowsReady"
Write-Host "Will skip (missing slug)   : $rowsMissingSlug"
Write-Host "Will skip (missing embed)  : $rowsMissingEmbed"
Write-Host "Will skip (unsupported URL): $rowsUnsupportedProvider"
Write-Host "Projects with existing media: $rowsExistingMedia"
Write-Host "Existing media mode        : $existingMediaMode"
Write-Host "Preview duration (seconds) : $previewDurationArg"
Write-Host ""
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

$processedCount = 0
foreach ($row in $rows) {
  $processedCount += 1
  $slug = (Get-TextValue -Row $row -Name 'slug').Trim()
  $title = (Get-TextValue -Row $row -Name 'title').Trim()
  $embedUrl = (Get-TextValue -Row $row -Name 'embedUrl').Trim()
  $nameForLog = if ($slug) { $slug } elseif ($title) { $title } else { '<unknown>' }
  Write-Host "[$processedCount/$totalRows] Processing: $nameForLog"

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
        if (Invoke-DownloadFile -Url $tUrl -OutputPath $tempThumbInputPath) {
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
      $thumbUrl = Get-ThumbnailUrlFromYtDlp -YtRunner $yt -SourceUrl $embedUrl
      if (-not [string]::IsNullOrWhiteSpace($thumbUrl)) {
        $thumbnailSaved = Invoke-DownloadFile -Url $thumbUrl -OutputPath $tempThumbInputPath
      }
    }

    if (($provider -eq 'youtube' -or $provider -eq 'vimeo' -or $provider -eq 'tiktok') -and $thumbnailSaved) {
      $thumbErr = @()
      $thumbnailSaved = Convert-ImageToWebp -FfmpegRunner $ffmpeg -InputPath $tempThumbInputPath -OutputPath $thumbPath -ErrorLines ([ref]$thumbErr)
      Remove-Item -LiteralPath $tempThumbInputPath -Force -ErrorAction SilentlyContinue
    }

    if ($thumbnailSaved) {
      Write-Host "[OK] thumbnail saved"
      $thumbOk += 1
    } else {
      Write-Host "[WARN] thumbnail failed"
      if ($thumbErr -and $thumbErr.Count -gt 0) {
        Write-Host ("       " + (($thumbErr -join ' | ')))
      }
      $warnCount += 1
    }

    $sourceUrl = Convert-ToEmbedUrl -Provider $provider -VideoId $videoId -OriginalUrl $embedUrl
    $tmpOutTemplate = Join-Path $tempRoot ($slug + '.%(ext)s')

    $ytFormat = 'bestvideo*[height>=1080]+bestaudio/best[height>=1080]/bestvideo*+bestaudio/best'
    $ytArgs = @(
      '--quiet',
      '--no-warnings',
      '--no-progress',
      '--restrict-filenames',
      '-f', $ytFormat,
      '-o', $tmpOutTemplate,
      $sourceUrl
    )
    Write-Host "[..] downloading source video..."
    $ytErr = @()
    $ytOk = Invoke-ExternalQuiet -Command $yt.Command -BaseArgs $yt.BaseArgs -NativeArgs $ytArgs -ErrorLines ([ref]$ytErr)
    if (-not $ytOk) {
      Write-Host "[ERROR] yt-dlp failed"
      if ($ytErr.Count -gt 0) {
        Write-Host ("       " + (($ytErr -join ' | ')))
      }
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
      '-hide_banner',
      '-loglevel', 'error',
      '-nostats',
      '-y',
      '-ss', '5',
      '-i', $downloaded.FullName,
      '-t', $previewDurationArg,
      '-an',
      '-vf', 'scale=1920:-2,fps=24',
      '-c:v', 'libvpx-vp9',
      '-b:v', '0',
      '-crf', '34',
      $previewPath
    )
    Write-Host "[..] saving preview..."
    $ffErr = @()
    $ffOk = Invoke-ExternalQuiet -Command $ffmpeg.Command -BaseArgs $ffmpeg.BaseArgs -NativeArgs $ffArgs -ErrorLines ([ref]$ffErr)
    if (-not $ffOk) {
      Write-Host "[ERROR] ffmpeg failed"
      if ($ffErr.Count -gt 0) {
        Write-Host ("       " + (($ffErr -join ' | ')))
      }
      $errorCount += 1
      $failedProjects.Add($slug) | Out-Null
      continue
    }

    Remove-Item -LiteralPath $downloaded.FullName -Force -ErrorAction SilentlyContinue

    if (Test-Path -LiteralPath $previewPath) {
      Write-Host "[OK] preview saved"
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
Write-Host "Processed               : $processedCount"
Write-Host "Thumbnails created      : $thumbOk"
Write-Host "Previews created        : $previewOk"
Write-Host "Skipped                 : $skipCount"
Write-Host "Warnings                : $warnCount"
Write-Host "Failed projects         : $errorCount"
if ($failedProjects.Count -gt 0) {
  $failedList = ($failedProjects | Select-Object -Unique) -join ', '
  Write-Host "Failed slug(s)          : $failedList"
}

Write-Host ""
$nextBatPath = Join-Path $scriptDir '2__SyncProjectImagesToProjects.bat'
if (Test-Path -LiteralPath $nextBatPath) {
  $runNext = Read-Host 'Run 2__SyncProjectImagesToProjects.bat now? (Y/N)'
  if ($runNext.Trim().ToLowerInvariant() -in @('y', 'yes')) {
    & $nextBatPath
  } else {
    Write-Host 'Skip running 2__SyncProjectImagesToProjects.bat'
  }
} else {
  Write-Host "[WARN] Cannot find: $nextBatPath"
}

exit 0
