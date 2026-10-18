$studioRoot = $PSScriptRoot
$electronPath = Join-Path $studioRoot 'node_modules\electron\dist\electron.exe'
$mainPath = Join-Path $studioRoot 'dist\desktop\main.cjs'
if (-not (Test-Path -LiteralPath $electronPath) -or -not (Test-Path -LiteralPath $mainPath)) {
    throw 'Run pnpm install and pnpm build in the AlertStudio folder first.'
}
$launcherPath = Join-Path $studioRoot 'Launch.exe'
if (Test-Path -LiteralPath $launcherPath) {
    Start-Process -FilePath $launcherPath -WorkingDirectory $studioRoot -WindowStyle Hidden
} else {
    Start-Process -FilePath $electronPath -ArgumentList ('"' + $studioRoot + '"') -WorkingDirectory $studioRoot -WindowStyle Hidden
}
