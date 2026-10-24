<#
  Retail Solutions — local development server (Windows, no install needed)

  Serves the site and implements the same admin API as api/index.php,
  so the admin panel works locally without PHP.

  Run:   powershell -ExecutionPolicy Bypass -File tools\dev-server.ps1
  Open:  http://localhost:8787/        (site)
         http://localhost:8787/admin/  (admin panel)
#>
param([int]$Port = 8787)

$ErrorActionPreference = 'Stop'
$Root        = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ContentFile = Join-Path $Root 'content\content.json'
$BackupDir   = Join-Path $Root 'content\backups'
$UploadDir   = Join-Path $Root 'uploads'
$DataDir     = Join-Path $Root 'api\data'
$AuthFile    = Join-Path $DataDir 'auth.json'
$RequiredKeys = 'site','nav','hero','about','services','pains','difference','solutions','industries','footer'
$Utf8 = New-Object System.Text.UTF8Encoding $false
foreach ($d in $BackupDir, $UploadDir, $DataDir) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force $d | Out-Null } }

$Types = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='text/javascript; charset=utf-8'
  '.json'='application/json; charset=utf-8'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'
  '.webp'='image/webp'; '.gif'='image/gif'; '.svg'='image/svg+xml'; '.ico'='image/x-icon'
  '.ttf'='font/ttf'; '.woff'='font/woff'; '.woff2'='font/woff2'; '.md'='text/plain; charset=utf-8'; '.txt'='text/plain; charset=utf-8'
}
$Sessions = @{}
$Attempts = @{}

function New-Hex([int]$bytes) { $b = New-Object byte[] $bytes; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | ForEach-Object { $_.ToString('x2') }) }
function Get-Derived([string]$pw, [string]$salt) {
  $k = New-Object System.Security.Cryptography.Rfc2898DeriveBytes -ArgumentList $pw, ([Text.Encoding]::ASCII.GetBytes($salt)), 100000, ([System.Security.Cryptography.HashAlgorithmName]::SHA256)
  -join ($k.GetBytes(32) | ForEach-Object { $_.ToString('x2') })
}
function Set-Password([string]$pw) {
  if ($pw.Length -lt 8) { throw [System.ArgumentException]'رمز عبور باید حداقل ۸ کاراکتر باشد.' }
  $salt = New-Hex 16
  $json = '{"salt":"' + $salt + '","hash":"' + (Get-Derived $pw $salt) + '","iter":100000}'
  [IO.File]::WriteAllText($AuthFile, $json, $Utf8)
}
function Test-Password([string]$pw) {
  if (-not (Test-Path $AuthFile)) { return $false }
  $a = [IO.File]::ReadAllText($AuthFile) | ConvertFrom-Json
  return ((Get-Derived $pw $a.salt) -eq $a.hash)
}
function Esc([string]$s) { ($s -replace '\\','\\' -replace '"','\"') }
# full JSON string escaping (quotes, backslashes, control characters)
function JsonStr([string]$s) {
  $sb = New-Object System.Text.StringBuilder
  foreach ($ch in $s.ToCharArray()) {
    switch ($ch) {
      '"' { [void]$sb.Append('\"') } '\' { [void]$sb.Append('\\') }
      "`n" { [void]$sb.Append('\n') } "`r" { [void]$sb.Append('\r') } "`t" { [void]$sb.Append('\t') }
      default { if ([int]$ch -lt 32) { [void]$sb.Append(('\u{0:x4}' -f [int]$ch)) } else { [void]$sb.Append($ch) } }
    }
  }
  '"' + $sb.ToString() + '"'
}
$MsgFile = Join-Path $DataDir 'messages.jsonl'
$MsgFields = [ordered]@{ fullName=120; company=120; jobTitle=120; mobile=30; email=160; industry=80; branches=20; city=80; preferredContactMethod=40; preferredContactTime=80; primaryChallenge=3000; page=200 }
$ContactHits = @{}

function Send($ctx, [int]$code, [string]$body, [string]$type = 'application/json; charset=utf-8') {
  $bytes = $Utf8.GetBytes($body)
  $ctx.Response.StatusCode = $code
  $ctx.Response.ContentType = $type
  $ctx.Response.AddHeader('Cache-Control','no-store')
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
}
function Fail($ctx, [int]$code, [string]$msg) { Send $ctx $code ('{"ok":false,"error":"' + (Esc $msg) + '"}') }

function Get-Session($ctx) {
  $c = $ctx.Request.Cookies['rs_admin_local']
  if (-not $c) { return $null }
  $s = $Sessions[$c.Value]
  if (-not $s) { return $null }
  if (((Get-Date) - $s.at).TotalHours -gt 8) { $Sessions.Remove($c.Value); return $null }
  $s.at = Get-Date
  return $s
}
function New-Session($ctx) {
  $token = New-Hex 32; $csrf = New-Hex 32
  $Sessions[$token] = @{ csrf = $csrf; at = Get-Date }
  $ctx.Response.AppendHeader('Set-Cookie', "rs_admin_local=$token; Path=/; HttpOnly; SameSite=Strict")
  return $csrf
}
function Backup-Current {
  if (-not (Test-Path $ContentFile)) { return }
  $name = 'content-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + (New-Hex 2) + '.json'
  Copy-Item $ContentFile (Join-Path $BackupDir $name)
  Get-ChildItem $BackupDir -Filter 'content-*.json' | Sort-Object Name -Descending | Select-Object -Skip 50 | Remove-Item -Force
}
function To-Unix($dt) { ([DateTimeOffset][datetime]$dt).ToUnixTimeSeconds() }

function Handle-Api($ctx) {
  $req = $ctx.Request
  $action = $req.QueryString['action']
  $isPost = $req.HttpMethod -eq 'POST'
  $raw = ''
  if ($req.HasEntityBody) { $sr = New-Object IO.StreamReader($req.InputStream, $Utf8); $raw = $sr.ReadToEnd(); $sr.Close() }
  $session = Get-Session $ctx
  $csrfOk = $session -and ($req.Headers['X-CSRF-Token'] -eq $session.csrf)
  $needAuth = { param($mut) if (-not $session) { Fail $ctx 401 'لطفاً دوباره وارد شوید.'; return $false }; if ($mut -and -not $csrfOk) { Fail $ctx 403 'توکن امنیتی نامعتبر است؛ صفحه را تازه کنید.'; return $false }; return $true }

  switch ($action) {
    'status' {
      $needs = if (Test-Path $AuthFile) { 'false' } else { 'true' }
      $auth = if ($session) { 'true' } else { 'false' }
      $csrf = if ($session) { '"' + $session.csrf + '"' } else { 'null' }
      Send $ctx 200 ('{"ok":true,"needsSetup":' + $needs + ',"authenticated":' + $auth + ',"csrf":' + $csrf + '}')
    }
    'setup' {
      if (-not $isPost) { return Fail $ctx 405 'Method not allowed' }
      if (Test-Path $AuthFile) { return Fail $ctx 403 'رمز عبور قبلاً تعیین شده است.' }
      $b = $raw | ConvertFrom-Json
      try { Set-Password ([string]$b.password) } catch { return Fail $ctx 400 $_.Exception.Message }
      $csrf = New-Session $ctx
      Send $ctx 200 ('{"ok":true,"csrf":"' + $csrf + '"}')
    }
    'login' {
      if (-not $isPost) { return Fail $ctx 405 'Method not allowed' }
      $ip = $req.RemoteEndPoint.Address.ToString()
      $a = $Attempts[$ip]
      if ($a -and $a.until -gt (Get-Date)) { return Fail $ctx 429 'به دلیل تلاش‌های ناموفق زیاد، چند دقیقه‌ی دیگر دوباره امتحان کنید.' }
      $b = $raw | ConvertFrom-Json
      if (-not (Test-Password ([string]$b.password))) {
        if (-not $a) { $a = @{ count = 0; until = Get-Date } ; $Attempts[$ip] = $a }
        $a.count++
        if ($a.count -ge 5) { $a.until = (Get-Date).AddMinutes(10); $a.count = 0 }
        return Fail $ctx 401 'رمز عبور اشتباه است.'
      }
      $Attempts.Remove($ip)
      $csrf = New-Session $ctx
      Send $ctx 200 ('{"ok":true,"csrf":"' + $csrf + '"}')
    }
    'logout' {
      $c = $req.Cookies['rs_admin_local']; if ($c) { $Sessions.Remove($c.Value) }
      Send $ctx 200 '{"ok":true}'
    }
    'password' {
      if (-not (& $needAuth $true)) { return }
      $b = $raw | ConvertFrom-Json
      if (-not (Test-Password ([string]$b.current))) { return Fail $ctx 400 'رمز فعلی اشتباه است.' }
      try { Set-Password ([string]$b.next) } catch { return Fail $ctx 400 $_.Exception.Message }
      Send $ctx 200 '{"ok":true}'
    }
    'save' {
      if (-not (& $needAuth $true)) { return }
      # body is exactly {"content":<json>} — store the inner JSON untouched (avoids PowerShell re-serialising it)
      if (-not $raw.StartsWith('{"content":') -or -not $raw.EndsWith('}')) { return Fail $ctx 400 'محتوای ارسالی نامعتبر است.' }
      $inner = $raw.Substring(11, $raw.Length - 12)
      try { $obj = $inner | ConvertFrom-Json } catch { return Fail $ctx 400 'JSON نامعتبر است.' }
      foreach ($k in $RequiredKeys) { if ($null -eq $obj.$k) { return Fail $ctx 400 "بخش «$k» در محتوا وجود ندارد." } }
      Backup-Current
      [IO.File]::WriteAllText($ContentFile, $inner + "`n", $Utf8)
      Send $ctx 200 ('{"ok":true,"savedAt":' + (To-Unix (Get-Date)) + '}')
    }
    'upload' {
      if (-not (& $needAuth $true)) { return }
      $m = [regex]::Match($raw, '"data"\s*:\s*"([A-Za-z0-9+/=]+)"')
      $n = [regex]::Match($raw, '"name"\s*:\s*"([^"]*)"')
      if (-not $m.Success) { return Fail $ctx 400 'فایل ارسالی نامعتبر است.' }
      $bytes = [Convert]::FromBase64String($m.Groups[1].Value)
      if ($bytes.Length -gt 8MB) { return Fail $ctx 413 'حجم تصویر بیش از ۸ مگابایت است.' }
      $ext = $null
      if ($bytes.Length -gt 12) {
        if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8) { $ext = 'jpg' }
        elseif ($bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50 -and $bytes[2] -eq 0x4E -and $bytes[3] -eq 0x47) { $ext = 'png' }
        elseif ([Text.Encoding]::ASCII.GetString($bytes, 0, 4) -eq 'RIFF' -and [Text.Encoding]::ASCII.GetString($bytes, 8, 4) -eq 'WEBP') { $ext = 'webp' }
        elseif ([Text.Encoding]::ASCII.GetString($bytes, 0, 3) -eq 'GIF') { $ext = 'gif' }
      }
      if (-not $ext) { return Fail $ctx 400 'فقط تصاویر JPG، PNG، WEBP و GIF مجاز هستند.' }
      $base = ([IO.Path]::GetFileNameWithoutExtension($n.Groups[1].Value)).ToLower() -replace '[^a-z0-9-]+','-'
      if ($base.Length -gt 40) { $base = $base.Substring(0,40) }
      $base = $base.Trim('-'); if (-not $base) { $base = 'image' }
      $name = (Get-Date -Format 'yyyyMMdd') + "-$base-" + (New-Hex 3) + ".$ext"
      [IO.File]::WriteAllBytes((Join-Path $UploadDir $name), $bytes)
      Send $ctx 200 ('{"ok":true,"url":"uploads/' + $name + '"}')
    }
    'media' {
      if (-not (& $needAuth $false)) { return }
      $items = Get-ChildItem $UploadDir -File | Where-Object { $_.Extension -match '^\.(jpe?g|png|webp|gif)$' } | Sort-Object LastWriteTime -Descending |
        ForEach-Object { '{"url":"uploads/' + $_.Name + '","time":' + (To-Unix $_.LastWriteTime) + ',"size":' + $_.Length + '}' }
      Send $ctx 200 ('{"ok":true,"items":[' + ($items -join ',') + ']}')
    }
    'backups' {
      if (-not (& $needAuth $false)) { return }
      $items = Get-ChildItem $BackupDir -Filter 'content-*.json' | Sort-Object Name -Descending |
        ForEach-Object { '{"file":"' + $_.Name + '","time":' + (To-Unix $_.LastWriteTime) + ',"size":' + $_.Length + '}' }
      Send $ctx 200 ('{"ok":true,"items":[' + ($items -join ',') + ']}')
    }
    'restore' {
      if (-not (& $needAuth $true)) { return }
      $b = $raw | ConvertFrom-Json
      $file = [IO.Path]::GetFileName([string]$b.file)
      $path = Join-Path $BackupDir $file
      if ($file -notmatch '^content-\d{8}-\d{6}-[a-f0-9]{4}\.json$' -or -not (Test-Path $path)) { return Fail $ctx 404 'نسخه‌ی پشتیبان پیدا نشد.' }
      Backup-Current
      Copy-Item $path $ContentFile -Force
      Send $ctx 200 '{"ok":true}'
    }
    'contact' {
      if (-not $isPost) { return Fail $ctx 405 'Method not allowed' }
      $b = $raw | ConvertFrom-Json
      if ($b.website_hp) { return Send $ctx 200 '{"ok":true}' }
      $ip = $req.RemoteEndPoint.Address.ToString()
      $hits = @($ContactHits[$ip] | Where-Object { $_ -gt (Get-Date).AddHours(-1) })
      if ($hits.Count -ge 5) { return Fail $ctx 429 'تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.' }
      $vals = [ordered]@{}
      foreach ($k in $MsgFields.Keys) {
        $v = ([string]$b.$k).Trim()
        if ($v.Length -gt $MsgFields[$k]) { $v = $v.Substring(0, $MsgFields[$k]) }
        $vals[$k] = $v
      }
      if (-not $vals.fullName -or -not $vals.company -or -not $vals.mobile) { return Fail $ctx 400 'نام، نام برند و شماره تماس الزامی است.' }
      if ($vals.email -and $vals.email -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { return Fail $ctx 400 'ایمیل وارد شده معتبر نیست.' }
      if (-not $b.consent) { return Fail $ctx 400 'لطفاً موافقت با ذخیره‌ی اطلاعات را تأیید کنید.' }
      $ContactHits[$ip] = $hits + (Get-Date)
      # note: in PowerShell "," binds tighter than "+", so each element is parenthesised
      $parts = @(('"id":"' + (New-Hex 6) + '"'), ('"time":' + (To-Unix (Get-Date))), '"read":false')
      foreach ($k in $vals.Keys) { $parts += ('"' + $k + '":' + (JsonStr $vals[$k])) }
      [IO.File]::AppendAllText($MsgFile, '{' + ($parts -join ',') + "}`n", $Utf8)
      Send $ctx 200 '{"ok":true}'
    }
    'messages' {
      if (-not (& $needAuth $false)) { return }
      $lines = @(); if (Test-Path $MsgFile) { $lines = @([IO.File]::ReadAllLines($MsgFile, $Utf8) | Where-Object { $_.Trim() }) }
      [array]::Reverse($lines)
      Send $ctx 200 ('{"ok":true,"items":[' + ($lines -join ',') + ']}')
    }
    'message-update' {
      if (-not (& $needAuth $true)) { return }
      $b = $raw | ConvertFrom-Json
      $id = [string]$b.id
      if ($id -notmatch '^[a-f0-9]{12}$' -or -not (Test-Path $MsgFile)) { return Fail $ctx 404 'پیام پیدا نشد.' }
      $found = $false; $out = New-Object System.Collections.Generic.List[string]
      foreach ($line in [IO.File]::ReadAllLines($MsgFile, $Utf8)) {
        if (-not $line.Trim()) { continue }
        if ($line.Contains('"id":"' + $id + '"')) {
          $found = $true
          if ($b.delete) { continue }
          $line = $line -replace '"read":(true|false)', ('"read":' + $(if ($b.read) { 'true' } else { 'false' }))
        }
        $out.Add($line)
      }
      if (-not $found) { return Fail $ctx 404 'پیام پیدا نشد.' }
      $text = if ($out.Count) { ($out -join "`n") + "`n" } else { '' }
      [IO.File]::WriteAllText($MsgFile, $text, $Utf8)
      Send $ctx 200 '{"ok":true}'
    }
    default { Fail $ctx 404 'Unknown action' }
  }
}

function Handle-Static($ctx) {
  $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($rel -eq '' -or $rel.EndsWith('/')) { $rel += 'index.html' }
  # same protections as the .htaccess files on the real server
  if ($rel -match '(^|/)(api/data|content/backups|tools|\.claude)(/|$)' -or $rel -match '\.(php|ps1|htaccess)$' -or $rel -match '(^|/)\.') { return Send $ctx 403 'Forbidden' 'text/plain' }
  $full = [IO.Path]::GetFullPath((Join-Path $Root $rel))
  if (-not $full.StartsWith($Root)) { return Send $ctx 403 'Forbidden' 'text/plain' }
  if (Test-Path $full -PathType Container) { $ctx.Response.Redirect('/' + $rel.TrimEnd('/') + '/'); return }
  if (-not (Test-Path $full -PathType Leaf)) { return Send $ctx 404 'Not found' 'text/plain' }
  $bytes = [IO.File]::ReadAllBytes($full)
  $ext = [IO.Path]::GetExtension($full).ToLower()
  $ctx.Response.ContentType = if ($Types[$ext]) { $Types[$ext] } else { 'application/octet-stream' }
  if ($ext -eq '.json') { $ctx.Response.AddHeader('Cache-Control','no-store') }
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Retail Solutions dev server"
Write-Host "  Site : http://localhost:$Port/"
Write-Host "  Admin: http://localhost:$Port/admin/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    if ($ctx.Request.Url.AbsolutePath -eq '/api/index.php') { Handle-Api $ctx } else { Handle-Static $ctx }
  } catch {
    Write-Host "Error: $($_.Exception.Message)"
    try { Fail $ctx 500 ('خطای سرور: ' + $_.Exception.Message) } catch {}
  } finally {
    try { $ctx.Response.Close() } catch {}
  }
}
