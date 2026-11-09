# Script PowerShell para deploy das Edge Functions no Supabase
# Execute: .\scripts\deploy-supabase.ps1

$PROJECT_REF = "xdskhspqrqeraqnshuey"

Write-Host "Deploy das Edge Functions no Supabase..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o Supabase CLI esta instalado
Write-Host "Verificando Supabase CLI..." -ForegroundColor Yellow
$supabaseVersion = supabase --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Supabase CLI nao encontrado!" -ForegroundColor Red
    Write-Host "Instale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}
Write-Host "Supabase CLI instalado: $supabaseVersion" -ForegroundColor Green
Write-Host ""

# Deploy keep-alive
Write-Host "Deploying keep-alive function..." -ForegroundColor Cyan
supabase functions deploy keep-alive --project-ref $PROJECT_REF
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao fazer deploy da funcao keep-alive" -ForegroundColor Red
    exit 1
}
Write-Host "keep-alive deployada com sucesso!" -ForegroundColor Green
Write-Host ""

# Deploy send-debt-notifications
Write-Host "Deploying send-debt-notifications function..." -ForegroundColor Cyan
supabase functions deploy send-debt-notifications --project-ref $PROJECT_REF
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao fazer deploy da funcao send-debt-notifications" -ForegroundColor Red
    exit 1
}
Write-Host "send-debt-notifications deployada com sucesso!" -ForegroundColor Green
Write-Host ""

Write-Host "Deploy concluido!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure os secrets no Supabase Dashboard"
Write-Host "2. Execute as migrations SQL no SQL Editor"
Write-Host "3. Teste as funcoes no dashboard"
Write-Host ""
Write-Host "URLs uteis:" -ForegroundColor Cyan
Write-Host "   Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
Write-Host "   Functions: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
Write-Host "   SQL Editor: https://supabase.com/dashboard/project/$PROJECT_REF/sql"
Write-Host ""
