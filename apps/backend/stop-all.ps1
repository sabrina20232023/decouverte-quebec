$ports = @(
    3001, # API Gateway
    3003, # Regions Service
    4001, # Places Service
    4002, # Users Service
    4004, # Weather Service
    4005, # Favorites Service
    4006  # Auth Service
)

Write-Host ""
Write-Host "Arret des microservices..." -ForegroundColor Yellow
Write-Host ""

foreach ($port in $ports) {

    $connections = Get-NetTCPConnection `
        -LocalPort $port `
        -State Listen `
        -ErrorAction SilentlyContinue

    if ($connections) {

        $processIds = $connections |
            Select-Object -ExpandProperty OwningProcess -Unique

        foreach ($processId in $processIds) {

            Write-Host "Arret du service sur le port $port (PID $processId)"

            Stop-Process `
                -Id $processId `
                -Force `
                -ErrorAction SilentlyContinue
        }

    }
    else {
        Write-Host "Aucun service actif sur le port $port"
    }
}

Write-Host ""
Write-Host "Tous les microservices ont ete arretes." -ForegroundColor Green