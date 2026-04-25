/** Escape for use inside PowerShell single-quoted string. */
export function escapeForPowerShellSingleQuoted(s) {
  return String(s ?? "").replace(/'/g, "''");
}

/**
 * Windows PowerShell script: polls Downloads for PDFs named sales_print_*, purchase_print_*, etc.
 * and copies newer files to one or two destination folders.
 */
export function buildSalesPrintWatcherScript(dest1, dest2) {
  const d1 = escapeForPowerShellSingleQuoted((dest1 || "").trim());
  const d2 = escapeForPowerShellSingleQuoted((dest2 || "").trim());

  return `# Sahitya — copy bill print PDFs from Downloads to your folders
# Generated from Settings. Web apps cannot write outside Downloads by themselves.
#
# Usage (on each billing PC):
#   powershell -ExecutionPolicy Bypass -File ".\\Copy-SalesPrintFromDownloads.ps1"
#
# PDF names from the app: sales_print_DDMMYY_*.pdf, purchase_print_*, bhet_print_*, excel_print_*

$Dest1 = '${d1}'
$Dest2 = '${d2}'
$Downloads = Join-Path $env:USERPROFILE 'Downloads'

function Ensure-Dir([string]$p) {
  if ([string]::IsNullOrWhiteSpace($p)) { return }
  if (-not (Test-Path -LiteralPath $p)) {
    New-Item -ItemType Directory -Force -Path $p | Out-Null
  }
}

Ensure-Dir $Dest1
Ensure-Dir $Dest2

Write-Host "Polling: $Downloads every 2 seconds"
Write-Host "Destination 1: $(if ($Dest1) { $Dest1 } else { '(none)' })"
Write-Host "Destination 2: $(if ($Dest2) { $Dest2 } else { '(none)' })"
Write-Host "Ctrl+C to stop."

while ($true) {
  try {
    $files = Get-ChildItem -LiteralPath $Downloads -Filter '*.pdf' -File -ErrorAction SilentlyContinue
    foreach ($f in $files) {
      if ($f.Name -notmatch '^(sales_print|purchase_print|bhet_print|excel_print)_') { continue }
      if (-not [string]::IsNullOrWhiteSpace($Dest1)) {
        $t = Join-Path $Dest1 $f.Name
        if (-not (Test-Path -LiteralPath $t) -or $f.LastWriteTimeUtc -gt (Get-Item -LiteralPath $t).LastWriteTimeUtc) {
          Copy-Item -LiteralPath $f.FullName -Destination $t -Force -ErrorAction SilentlyContinue
        }
      }
      if (-not [string]::IsNullOrWhiteSpace($Dest2)) {
        $t2 = Join-Path $Dest2 $f.Name
        if (-not (Test-Path -LiteralPath $t2) -or $f.LastWriteTimeUtc -gt (Get-Item -LiteralPath $t2).LastWriteTimeUtc) {
          Copy-Item -LiteralPath $f.FullName -Destination $t2 -Force -ErrorAction SilentlyContinue
        }
      }
    }
  } catch {}
  Start-Sleep -Seconds 2
}
`;
}
