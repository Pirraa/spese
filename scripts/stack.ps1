param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("setup", "up", "down", "restart", "status", "logs", "backup", "monitor")]
  [string]$Action,
  [string]$Tail = "200"
)

$root = Resolve-Path "$PSScriptRoot\.."
$composeFile = "$root\docker-compose.yml"
$compose = "docker compose -f `"$composeFile`""

function Ensure-PostgresImage {
  $image = "postgres:15-alpine"
  $exists = docker image inspect $image 2>$null
  if (-not $?) {
    Write-Host "Pulling $image..."
    docker pull $image | Out-Host
  }
}

switch ($Action) {
  "setup" {
    Ensure-PostgresImage
    Invoke-Expression "$compose build"
  }
  "up" {
    Invoke-Expression "$compose up -d"
  }
  "down" {
    Invoke-Expression "$compose down"
  }
  "restart" {
    Invoke-Expression "$compose down"
    Invoke-Expression "$compose up -d"
  }
  "status" {
    Invoke-Expression "$compose ps"
  }
  "logs" {
    Invoke-Expression "$compose logs -f --tail $Tail"
  }
  "backup" {
    $backupDir = "$root\backups"
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $output = "$backupDir\spese_db_$timestamp.sql"
    docker exec spese-db pg_dump -U spese_user -d spese_db > $output
    Write-Host "Backup scritto in $output"
  }
  "monitor" {
    docker stats --no-stream
  }
}
