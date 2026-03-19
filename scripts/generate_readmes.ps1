$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Rel([string]$path) {
    $full = (Resolve-Path -LiteralPath $path).Path
    if ($full -eq $root) { return '.' }
    if ($full.StartsWith($root + '\')) {
        return ($full.Substring($root.Length + 1) -replace '\\', '/')
    }
    return ($full -replace '\\', '/')
}

$purposeMap = @{
    '.' = 'Monorepo root for SecureSight-AI, coordinating backend APIs, ML services, browser extension UI, Flask agent bot, datasets, and documentation.'
    'AI_Agent_Bot' = 'Flask web app and Telegram bot integration layer for upload, scan, status, and report workflows.'
    'AI_Agent_Bot/static' = 'Static frontend assets used by Flask templates.'
    'AI_Agent_Bot/static/css' = 'CSS stylesheets for the Flask frontend pages.'
    'AI_Agent_Bot/static/js' = 'Client-side JavaScript for UI interactions and real-time updates.'
    'AI_Agent_Bot/templates' = 'Jinja/HTML templates rendered by the Flask application.'
    'AI_Agent_Bot/uploads' = 'Uploaded/sample files used for scanning demos and threat analysis tests.'
    'backend' = 'Node.js/Express API service that validates requests, performs scans, and returns verdicts.'
    'backend/lib' = 'Core backend modules for feature extraction, heuristics, score fusion, and decision logic.'
    'backend/__tests__' = 'Backend test suites for helpers, extractors, and API behavior.'
    'datasets' = 'Static dataset and label files used by ML and heuristics components.'
    'docs' = 'Technical documentation for architecture, APIs, and ML model details.'
    'extension' = 'Browser extension source for background logic, UI pages, and manifest utilities.'
    'extension/ui' = 'Extension dashboard/scanner/report/warning UI pages and scripts.'
    'extension/utils' = 'Extension configuration helpers and manifest assets.'
    'ml' = 'Python ML package root with extraction, inference, and training components.'
    'ml/inference' = 'Inference-time model loading and prediction entry points.'
    'ml/training' = 'Training scripts and data preparation for model development.'
    'ml/training/ml_training' = 'Nested training workspace containing datasets and metadata.'
    'ml/training/ml_training/data' = 'CSV datasets and dataset metadata used by training pipelines.'
    'Model Training' = 'Standalone/legacy model training workspace and related scripts.'
    'Model Training/data' = 'Data assets for the standalone model training flow.'
    'node-ml-bridge' = 'Bridge service connecting Node backend requests to Python ML inference logic.'
    'tests' = 'Project-level performance and accuracy validation scripts.'
    'scripts' = 'Project utility scripts for automation and maintenance tasks.'
}

function GetPurpose([string]$relDir) {
    if ($purposeMap.ContainsKey($relDir)) {
        return $purposeMap[$relDir]
    }
    return 'Project subdirectory containing implementation assets for SecureSight-AI.'
}

function GetFileType([System.IO.FileInfo]$file) {
    $ext = $file.Extension.ToLowerInvariant()
    $name = $file.Name.ToLowerInvariant()

    switch ($ext) {
        '.js' { return 'JavaScript source' }
        '.py' { return 'Python source' }
        '.md' { return 'Documentation' }
        '.html' { return 'HTML template' }
        '.css' { return 'Stylesheet' }
        '.json' { return 'JSON data/config' }
        '.csv' { return 'CSV dataset' }
        '.txt' { return 'Text data' }
        '.h5' { return 'ML model artifact' }
        '.seb' { return 'SEB assessment file' }
        '.zip' { return 'ZIP archive' }
        '.exe' { return 'Executable binary' }
        '.yml' { return 'YAML config' }
        '.yaml' { return 'YAML config' }
        '.env' { return '.env file' }
        '.ps1' { return 'PowerShell script' }
        default {
            if ($name -like 'dockerfile*') { return 'Container build file' }
            if ($name -like '*.gitignore') { return '.gitignore file' }
            if ($name -like '*.lock') { return 'Lock file' }
            return "$ext file"
        }
    }
}

function GetFileNote([System.IO.FileInfo]$file) {
    $ext = $file.Extension.ToLowerInvariant()
    switch ($ext) {
        '.js' { return 'Executable logic/module code.' }
        '.py' { return 'Python implementation script.' }
        '.md' { return 'Documentation content.' }
        '.html' { return 'Template/view markup.' }
        '.css' { return 'Presentation and visual styling.' }
        '.json' { return 'Configuration or structured data.' }
        '.csv' { return 'Tabular dataset for analysis/training.' }
        '.h5' { return 'Binary model artifact for inference.' }
        '.seb' { return 'Binary assessment file uploaded for scan/testing.' }
        '.ps1' { return 'Automation/maintenance script logic.' }
        default { return 'Project artifact file.' }
    }
}

function SafeLineCount([System.IO.FileInfo]$file) {
    $textExt = @('.js', '.py', '.md', '.html', '.css', '.json', '.csv', '.txt', '.env', '.yml', '.yaml', '.ps1')
    if ($textExt -contains $file.Extension.ToLowerInvariant() -or $file.Name -eq '.gitignore' -or $file.Name -like 'Dockerfile*') {
        try {
            return (Get-Content -LiteralPath $file.FullName -ErrorAction Stop | Measure-Object -Line).Lines
        }
        catch {
            return '-'
        }
    }
    return '-'
}

function GetCodeSummary([System.IO.FileInfo]$file) {
    $imports = New-Object System.Collections.Generic.List[string]
    $symbols = New-Object System.Collections.Generic.List[object]
    $seen = @{}

    try {
        $lines = Get-Content -LiteralPath $file.FullName -ErrorAction Stop
    }
    catch {
        return @{ imports = @(); symbols = @() }
    }

    $ext = $file.Extension.ToLowerInvariant()
    $jsBlocked = @('if', 'for', 'while', 'switch', 'catch', 'else', 'try', 'do', 'return', 'function', 'constructor')

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        if ($ext -eq '.py') {
            if ($line -match '^\s*import\s+([A-Za-z0-9_\.,\s]+)$') {
                $imports.Add("import $($matches[1].Trim())") | Out-Null
            }
            elseif ($line -match '^\s*from\s+([A-Za-z0-9_\.]+)\s+import\s+(.+)$') {
                $imports.Add("from $($matches[1]) import $($matches[2].Trim())") | Out-Null
            }

            if ($line -match '^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)\s*(\([^)]*\))?\s*:') {
                $name = $matches[1]
                $base = if ($matches[2]) { $matches[2] } else { '' }
                $key = "class|$name|$i"
                if (-not $seen.ContainsKey($key)) {
                    $symbols.Add([pscustomobject]@{ kind = 'class'; signature = "$name$base"; line = ($i + 1) }) | Out-Null
                    $seen[$key] = $true
                }
                continue
            }

            if ($line -match '^\s*(async\s+def|def)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*:') {
                $kind = if ($matches[1] -like 'async*') { 'async function' } else { 'function' }
                $name = $matches[2]
                $params = $matches[3]
                $key = "$kind|$name|$i"
                if (-not $seen.ContainsKey($key)) {
                    $symbols.Add([pscustomobject]@{ kind = $kind; signature = "$name($params)"; line = ($i + 1) }) | Out-Null
                    $seen[$key] = $true
                }
                continue
            }
        }

        if ($ext -eq '.js') {
            if ($line -match '^\s*import\s+.+\s+from\s+[\"''][^\"'']+[\"'']\s*;?') {
                $module = [regex]::Match($line, '[\"'']([^\"'']+)[\"'']').Groups[1].Value
                if ($module) { $imports.Add("import '$module'") | Out-Null }
            }
            elseif ($line -match '^\s*(?:const|let|var)\s+.+?=\s*require\([\"''][^\"'']+[\"'']\)\s*;?') {
                $module = [regex]::Match($line, 'require\([\"'']([^\"'']+)[\"'']\)').Groups[1].Value
                if ($module) { $imports.Add("require '$module'") | Out-Null }
            }

            if ($line -match '^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)\b') {
                $name = $matches[1]
                $key = "class|$name|$i"
                if (-not $seen.ContainsKey($key)) {
                    $symbols.Add([pscustomobject]@{ kind = 'class'; signature = $name; line = ($i + 1) }) | Out-Null
                    $seen[$key] = $true
                }
                continue
            }

            if ($line -match '^\s*(async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)') {
                $kind = if ($matches[1]) { 'async function' } else { 'function' }
                $name = $matches[2]
                $params = $matches[3]
                $key = "$kind|$name|$i"
                if (-not $seen.ContainsKey($key)) {
                    $symbols.Add([pscustomobject]@{ kind = $kind; signature = "$name($params)"; line = ($i + 1) }) | Out-Null
                    $seen[$key] = $true
                }
                continue
            }

            if ($line -match '^\s*(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(async\s*)?\(([^)]*)\)\s*=>') {
                if ($line -match '=\s*\(\s*\(') {
                    # Skip immediately-invoked wrapper forms like const x = (() => {...})();
                    continue
                }
                $kind = if ($matches[2]) { 'async function' } else { 'function' }
                $name = $matches[1]
                $params = $matches[3].Trim()
                # Handle wrapped IIFE forms like const x = (() => { ... })();
                if ($params -eq '(') { $params = '' }
                $key = "$kind|$name|$i"
                if (-not $seen.ContainsKey($key)) {
                    $symbols.Add([pscustomobject]@{ kind = $kind; signature = "$name($params)"; line = ($i + 1) }) | Out-Null
                    $seen[$key] = $true
                }
                continue
            }

            if ($line -match '^\s*(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(async\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=>') {
                $kind = if ($matches[2]) { 'async function' } else { 'function' }
                $name = $matches[1]
                $param = $matches[3]
                $key = "$kind|$name|$i"
                if (-not $seen.ContainsKey($key)) {
                    $symbols.Add([pscustomobject]@{ kind = $kind; signature = "$name($param)"; line = ($i + 1) }) | Out-Null
                    $seen[$key] = $true
                }
                continue
            }

            if ($line -match '^\s*(async\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*\{\s*$') {
                $name = $matches[2]
                if ($jsBlocked -notcontains $name) {
                    $kind = if ($matches[1]) { 'async method' } else { 'method' }
                    $params = $matches[3]
                    $key = "$kind|$name|$i"
                    if (-not $seen.ContainsKey($key)) {
                        $symbols.Add([pscustomobject]@{ kind = $kind; signature = "$name($params)"; line = ($i + 1) }) | Out-Null
                        $seen[$key] = $true
                    }
                }
                continue
            }
        }
    }

    return @{
        imports = @($imports.ToArray() | Sort-Object -Unique)
        symbols = @($symbols.ToArray())
    }
}

$allDirs = @((Get-Item -LiteralPath $root)) + @(
    Get-ChildItem -Path $root -Recurse -Directory |
        Where-Object {
            $_.FullName -notmatch '\\node_modules(\\|$)' -and
            $_.FullName -notmatch '\\\.git(\\|$)' -and
            $_.FullName -notmatch '\\__pycache__(\\|$)'
        }
)

foreach ($dir in $allDirs) {
    $relDir = Rel $dir.FullName
    if ($relDir -eq '.') {
        # Keep root README manually curated as the complete project guide.
        continue
    }
    $leaf = if ($relDir -eq '.') { Split-Path -Leaf $root } else { Split-Path -Leaf $dir.FullName }

    $subdirs = @(Get-ChildItem -LiteralPath $dir.FullName -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -notin @('node_modules', '.git', '__pycache__') } |
            Sort-Object Name)
    $files = @(Get-ChildItem -LiteralPath $dir.FullName -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -ne 'README.md' } |
            Sort-Object Name)

    $content = New-Object System.Collections.Generic.List[string]
    $content.Add("# $leaf Directory") | Out-Null
    $content.Add('') | Out-Null
    $content.Add('## Folder Path') | Out-Null
    $content.Add('') | Out-Null
    $content.Add("- $relDir") | Out-Null
    $content.Add('') | Out-Null
    $content.Add('## Purpose') | Out-Null
    $content.Add('') | Out-Null
    $content.Add((GetPurpose $relDir)) | Out-Null
    $content.Add('') | Out-Null
    $content.Add('## Subfolders') | Out-Null
    $content.Add('') | Out-Null

    if ($subdirs.Count -eq 0) {
        $content.Add('- No direct subfolders.') | Out-Null
    }
    else {
        foreach ($sd in $subdirs) {
            $content.Add("- $($sd.Name)/ ($(Rel $sd.FullName))") | Out-Null
        }
    }

    $content.Add('') | Out-Null
    $content.Add('## Files Overview') | Out-Null
    $content.Add('') | Out-Null
    $content.Add('| File | Type | Size | Lines | Notes |') | Out-Null
    $content.Add('|---|---|---:|---:|---|') | Out-Null

    if ($files.Count -eq 0) {
        $content.Add('| _none_ | - | - | - | No files directly in this folder. |') | Out-Null
    }
    else {
        foreach ($f in $files) {
            $sizeKB = [Math]::Round($f.Length / 1KB, 2)
            $lineCount = SafeLineCount $f
            $ft = GetFileType $f
            $note = GetFileNote $f
            $content.Add("| $($f.Name) | $ft | $sizeKB KB | $lineCount | $note |") | Out-Null
        }
    }

    $content.Add('') | Out-Null
    $content.Add('## Function and Class Reference') | Out-Null
    $content.Add('') | Out-Null

    $codeFiles = @($files | Where-Object { $_.Extension.ToLowerInvariant() -in @('.js', '.py') })
    if ($codeFiles.Count -eq 0) {
        $content.Add('- No JavaScript/Python source files in this folder.') | Out-Null
    }
    else {
        foreach ($cf in $codeFiles) {
            $summary = GetCodeSummary $cf
            $content.Add("### $($cf.Name)") | Out-Null
            $content.Add('') | Out-Null

            if ($summary.imports.Count -gt 0) {
                $content.Add('Dependencies/imports detected:') | Out-Null
                foreach ($imp in $summary.imports) {
                    $content.Add("- $imp") | Out-Null
                }
                $content.Add('') | Out-Null
            }

            if ($summary.symbols.Count -eq 0) {
                $content.Add('- No function/class signatures were detected in this file.') | Out-Null
            }
            else {
                foreach ($symbol in $summary.symbols) {
                    $content.Add("- $($symbol.kind) $($symbol.signature) (line $($symbol.line))") | Out-Null
                }
            }

            $content.Add('') | Out-Null
        }
    }

    $content.Add('') | Out-Null
    $content.Add('## Integration Notes') | Out-Null
    $content.Add('') | Out-Null
    $content.Add('- Keep this README updated whenever files are added/removed or function signatures change.') | Out-Null
    $content.Add('- For architecture and API contracts, cross-reference docs in docs/ and major module READMEs.') | Out-Null
    $content.Add('- This README is generated to provide folder-level and function-level visibility for maintainers and evaluators.') | Out-Null

    $outPath = Join-Path $dir.FullName 'README.md'
    [System.IO.File]::WriteAllText($outPath, ($content -join [Environment]::NewLine), $utf8NoBom)
}

$readmeCount = (Get-ChildItem -Path $root -Recurse -Filter README.md -File |
    Where-Object {
        $_.FullName -notmatch '\\node_modules(\\|$)' -and
        $_.FullName -notmatch '\\\.git(\\|$)' -and
        $_.FullName -notmatch '\\__pycache__(\\|$)'
    }).Count

Write-Host "README generation complete. Total README files: $readmeCount"
