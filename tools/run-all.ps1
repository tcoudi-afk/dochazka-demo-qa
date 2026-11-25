<#
.SYNOPSIS
  Pusti Maestro testy po jednom a vypise tabulku: co prosel / selhal a jestli je to to, co cekame na verzi 1.0.

.DESCRIPTION
  1. preflight: adb, maestro, java, emulator, shodny cas emulatoru a PC
  2. volitelne instalace APK (adb install -r)
  3. kazdy flow zvlast (jedno selhani nezastavi ostatni), vystup do <OutDir>\<ID-testu>\
  4. trideni podle tools\known-bugs.json:
       OK              prosel (bez known-bug) nebo selhal (znama chyba)
       ZMENA           prosel test s known-bug (mozna opraveno) nebo selhal test bez known-bug (regrese / zmena UI)
       PROSTREDI       selhani vypada na vypadek emulatoru (device offline, hned na zacatku) - opakovat
  Skript nic neupravuje v testech ani v known-bugs.json. Trideni je jen podklad pro rozhodnuti cloveka.

.PARAMETER Apk
  Cesta k APK, ktere se ma nainstalovat. Bez nej se pouzije aplikace, ktera uz je v emulatoru.

.PARAMETER Suites
  Ktere sady pustit. Vychozi: manual-entry, requests, login, offline (celkem asi 32 min).
  Kratsi varianta: -Suites manual-entry,requests (asi 20 min). Login trva kvuli L03 pres minutu.

.PARAMETER OutDir
  Kam ulozit vystupy. Vychozi: docs\test-runs\<datum-cas>

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File tools\run-all.ps1 -Apk C:\Users\Koudy\Downloads\dochazka-demo-1.1.apk

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File tools\run-all.ps1 -Suites manual-entry,requests
#>
param(
    [string]$Apk,
    [string[]]$Suites = @('manual-entry', 'requests', 'login', 'offline'),
    [string]$OutDir
)

$appId = 'cz.demo.dochazka'
$root = Split-Path -Parent $PSScriptRoot
$tests = Join-Path $root 'tests'
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
if (-not $OutDir) { $OutDir = Join-Path $root "docs\test-runs\$stamp" }
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
# Java pri presmerovanem vystupu pise v kodove strance Windows (Cp1250), PowerShell cte UTF-8:
# bez tohoto by ceske nazvy kroku v maestro.log a v trideni byly rozbite (otazniky misto diakritiky).
$env:MAESTRO_OPTS = (($env:MAESTRO_OPTS, '-Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8') -ne $null) -join ' '

function Stop-Run($msg) {
    Write-Host "CHYBA: $msg" -ForegroundColor Red
    exit 2
}

# ---------- preflight ----------
foreach ($tool in 'adb', 'maestro', 'java') {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { Stop-Run "$tool neni v PATH" }
}
$devices = @((& adb devices) | Select-String -Pattern "`tdevice\s*$")
if ($devices.Count -eq 0) { Stop-Run 'adb nevidi zadne zarizeni ve stavu "device". Spust emulator a pockej na nabehnuti.' }
if ($devices.Count -gt 1) { Stop-Run 'adb vidi vic zarizeni. Nech pripojene jen jedno (Maestro by se ptal, na ktere).' }

$knownFile = Join-Path $PSScriptRoot 'known-bugs.json'
if (-not (Test-Path $knownFile)) { Stop-Run "chybi $knownFile" }
$known = (Get-Content $knownFile -Raw -Encoding UTF8 | ConvertFrom-Json).tests

if ($Apk) {
    if (-not (Test-Path $Apk)) { Stop-Run "APK nenalezeno: $Apk" }
    Write-Host "Instalace APK: $Apk"
    $inst = (& cmd /c "adb install -r `"$Apk`" 2>&1") -join ' '
    if ($inst -notmatch 'Success') {
        Stop-Run "instalace selhala: $inst`nPri jinem podpisu nejdriv: adb uninstall $appId"
    }
}

$pkg = (& adb shell dumpsys package $appId) | Select-String 'versionName=' | Select-Object -First 1
if (-not $pkg) { Stop-Run "aplikace $appId neni v emulatoru nainstalovana (pouzij -Apk)" }
$version = $pkg.Line.Trim()

$emuHour = ((& adb shell date +%H) -join '').Trim()
$pcHour = (Get-Date).ToString('HH')
$tzWarn = ''
if ($emuHour -ne $pcHour) {
    $tzWarn = "Emulator ukazuje hodinu $emuHour, PC $pcHour. Testy pocitaji data podle PC, aplikace podle emulatoru: nastav pasmo emulatoru stejne jako na PC."
    Write-Host "POZOR: $tzWarn" -ForegroundColor Yellow
}
$ime = ((& adb shell settings get secure show_ime_with_hard_keyboard) -join '').Trim()
if ($ime -ne '1') {
    Write-Host "POZOR: softwarova klavesnice neni zapnuta (show_ime_with_hard_keyboard=$ime). Oprava: adb shell settings put secure show_ime_with_hard_keyboard 1" -ForegroundColor Yellow
}

Write-Host "Aplikace: $version"
Write-Host "Vystup:   $OutDir"
Write-Host 'Behem behu nepis na klavesnici PC, kdyz ma fokus okno emulatoru.' -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# ---------- beh ----------
$files = @()
foreach ($s in $Suites) {
    $dir = Join-Path $tests "flows\$s"
    if (-not (Test-Path $dir)) { Stop-Run "sada neexistuje: $dir" }
    $files += Get-ChildItem $dir -Filter *.yaml | Sort-Object Name
}

$results = @()
$i = 0
$total = $files.Count
$runStart = Get-Date
Push-Location $tests
try {
    foreach ($f in $files) {
        $i++
        $id = ($f.BaseName -split '-')[0]
        $suite = $f.Directory.Name
        $dir = Join-Path $OutDir $id
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        $rel = "flows\$suite\$($f.Name)"

        $attempt = 0
        do {
            $attempt++
            $sw = [Diagnostics.Stopwatch]::StartNew()
            $out = & cmd /c "maestro test --test-output-dir `"$dir`" `"$rel`" 2>&1"
            $code = $LASTEXITCODE
            $sw.Stop()
            $envProblem = (($out -join "`n") -match 'device offline|device not found|device .* not found')
            $retry = ($code -ne 0 -and $envProblem -and $attempt -lt 2)
            if ($retry) { Write-Host "   $id : vypadek zarizeni, opakuji" -ForegroundColor DarkYellow }
        } while ($retry)
        $secs = [int]$sw.Elapsed.TotalSeconds
        $out | Set-Content (Join-Path $dir 'maestro.log') -Encoding UTF8

        $passed = ($code -eq 0)
        $bug = $null
        $p = $known.PSObject.Properties[$id]
        if ($p) { $bug = $p.Value }

        $reason = ''
        if (-not $passed) {
            # Krok, ktery selhal ("<nazev kroku>... FAILED"), a prvni radek chyby za nim.
            # Radky "Run flow when ... is not visible... COMPLETED" jsou podminky, ne selhani.
            $lines = @($out | ForEach-Object { [string]$_ })
            $fi = -1
            for ($k = 0; $k -lt $lines.Count; $k++) { if ($lines[$k] -match '\.\.\. FAILED\s*$') { $fi = $k; break } }
            if ($fi -ge 0 -and $fi -lt $lines.Count - 1) {
                $m = ($lines[$fi] -replace '\.\.\. FAILED\s*$', '').Trim()
                $err = $lines[($fi + 1)..([math]::Min($fi + 4, $lines.Count - 1))] | Where-Object { $_.Trim() } | Select-Object -First 1
                if ($err) { $m = "$m : $($err.Trim())" }
            }
            else {
                $m = $lines | Where-Object { $_ -match 'Assertion is false|Element not found|Unable' } | Select-Object -First 1
            }
            if ($m) {
                $reason = ([string]$m).Trim()
                if ($reason.Length -gt 110) { $reason = $reason.Substring(0, 110) }
            }
        }

        if (-not $passed -and ($envProblem -or $secs -lt 8)) {
            $cat = 'prostredi'
            $verdict = 'PROSTREDI: vypadek nebo velmi rychle selhani, pust znovu'
        }
        elseif ($passed -and -not $bug) { $cat = 'ok'; $verdict = 'OK' }
        elseif (-not $passed -and $bug) { $cat = 'ok'; $verdict = "OK (znama chyba $bug)" }
        elseif ($passed -and $bug) { $cat = 'zmena'; $verdict = "ZMENA: prosel, a hlida $bug (opraveno?)" }
        else { $cat = 'zmena'; $verdict = 'ZMENA: selhal a neni znama chyba (regrese, zmena UI nebo dat?)' }

        $color = switch ($cat) { 'ok' { 'Green' } 'zmena' { 'Red' } default { 'Magenta' } }
        Write-Host ('[{0}/{1}] {2,-4} {3,-5} {4,4} s  {5}' -f $i, $total, $id, $(if ($passed) { 'PASS' } else { 'FAIL' }), $secs, $verdict) -ForegroundColor $color

        $results += [pscustomobject]@{
            Id = $id; Sada = $suite
            Vysledek = $(if ($passed) { 'PASS' } else { 'FAIL' })
            Ocekavano = $(if ($bug) { "FAIL ($bug)" } else { 'PASS' })
            Kategorie = $cat; Verdikt = $verdict; Sekund = $secs; Duvod = $reason
        }
    }
}
finally { Pop-Location }

# ---------- souhrn ----------
$ok = @($results | Where-Object Kategorie -eq 'ok').Count
$zm = @($results | Where-Object Kategorie -eq 'zmena').Count
$pr = @($results | Where-Object Kategorie -eq 'prostredi').Count
$mins = [math]::Round(((Get-Date) - $runStart).TotalMinutes, 1)

Write-Host ''
$results | Format-Table Id, Sada, Vysledek, Ocekavano, Verdikt, Sekund -AutoSize
Write-Host ("Hotovo za {0} min: OK {1}, ZMENA {2}, PROSTREDI {3} (z {4})" -f $mins, $ok, $zm, $pr, $total)

if ($Suites.Count -eq 4) {
    $seen = $results | ForEach-Object { $_.Id }
    foreach ($k in $known.PSObject.Properties.Name) {
        if ($seen -notcontains $k) { Write-Host "POZOR: known-bugs.json zna test $k, ale ve flows nebyl nalezen (prejmenovan?)" -ForegroundColor Yellow }
    }
}
if ($pr -gt 0) { Write-Host 'Testy v kategorii PROSTREDI pust znovu jednotlive: maestro test --test-output-dir <slozka> flows\<sada>\<soubor>.yaml' -ForegroundColor Magenta }
if ($zm -gt 0) { Write-Host "U kazde ZMENY otevri $OutDir\<ID>\maestro.log a screenshoty v podslozce. Neupravuj ocekavane hodnoty, dokud nevis, jestli je zmena v aplikaci zamerna." -ForegroundColor Yellow }

$md = @()
$md += "# Trideni vysledku $stamp"
$md += ''
$md += "- Aplikace: $version"
$md += "- Sady: $($Suites -join ', ')"
$md += "- Doba: $mins min"
$md += "- Souhrn: OK $ok, ZMENA $zm, PROSTREDI $pr (z $total)"
if ($tzWarn) { $md += "- Upozorneni: $tzWarn" }
$md += ''
$md += '| Test | Sada | Vysledek | Ocekavano | Verdikt | Sekund | Duvod selhani (odhad z logu) |'
$md += '|---|---|---|---|---|---|---|'
foreach ($r in $results) {
    $d = ($r.Duvod -replace '\|', '/')
    $md += "| $($r.Id) | $($r.Sada) | $($r.Vysledek) | $($r.Ocekavano) | $($r.Verdikt) | $($r.Sekund) | $d |"
}
$md | Set-Content (Join-Path $OutDir 'trideni.md') -Encoding UTF8
$results | Export-Csv (Join-Path $OutDir 'trideni.csv') -NoTypeInformation -Encoding UTF8
Write-Host "Ulozeno: $OutDir\trideni.md"

if ($zm -gt 0 -or $pr -gt 0) { exit 1 } else { exit 0 }
