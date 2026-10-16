@echo off
pushd "%~dp0"
if not exist "node_modules\electron\dist\electron.exe" (
  echo Install dependencies with pnpm install first.
  pause
  popd
  exit /b 1
)
if not exist "dist\desktop\main.cjs" (
  echo Build the application with pnpm build first.
  pause
  popd
  exit /b 1
)
"node_modules\electron\dist\electron.exe" .
popd
