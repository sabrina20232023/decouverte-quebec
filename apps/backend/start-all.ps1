$root = "C:\Projets\decouverte-quebec\apps\backend"

$services = @(
    "api-gateway",
    "places-service",
    "regions-service",
    "weather-service",
    "favorites-service",
    "users-service",
    "auth-service"
)

foreach ($service in $services) {
    Start-Process powershell `
        -ArgumentList "-NoExit", "-Command", "cd '$root'; npx nest start $service --watch"
}

Write-Host ""
Write-Host "Tous les services NestJS ont été lancés." -ForegroundColor Green
Write-Host ""
Write-Host "API Gateway       : http://localhost:3001"
Write-Host "Swagger           : http://localhost:3001/api/docs"
Write-Host "Places Service    : 4001"
Write-Host "Regions Service   : 3003"
Write-Host "Users Service     : 4002"
Write-Host "Weather Service   : 4004"
Write-Host "Favorites Service : 4005"
Write-Host "Auth Service      : 4006"