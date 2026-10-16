# Use phpMyAdmin MySQL database resort_api — clears PHPUnit/Cursor SQLite env overrides.
Remove-Item Env:DB_CONNECTION -ErrorAction SilentlyContinue
Remove-Item Env:DB_DATABASE -ErrorAction SilentlyContinue
Set-Location $PSScriptRoot
php artisan config:clear | Out-Null
php artisan serve --host=0.0.0.0 --port=8000
