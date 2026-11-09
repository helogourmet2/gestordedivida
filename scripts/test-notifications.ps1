# Script PowerShell para testar notificações push
# Execute: .\scripts\test-notifications.ps1

$PROJECT_REF = "xdskhspqrqeraqnshuey"
$FUNCTION_URL = "https://$PROJECT_REF.supabase.co/functions/v1/send-debt-notifications"
$KEEP_ALIVE_URL = "https://$PROJECT_REF.supabase.co/functions/v1/keep-alive"

Write-Host "🧪 Testando Notificações Push..." -ForegroundColor Cyan
Write-Host ""

# Teste 1: Keep-Alive
Write-Host "1️⃣  Testando keep-alive..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $KEEP_ALIVE_URL -Method Get
    Write-Host "✅ Keep-Alive OK!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Timestamp: $($response.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro no keep-alive: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 2: Send Notifications (requer token válido no Supabase)
Write-Host "2️⃣  Testando send-debt-notifications..." -ForegroundColor Yellow
Write-Host "⚠️  Nota: Esta função requer tokens FCM cadastrados no banco" -ForegroundColor Yellow
Write-Host ""

$body = @{
    user_id = "vfk1471"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Função executada com sucesso!" -ForegroundColor Green
    Write-Host "   Resposta: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao executar função: $_" -ForegroundColor Red
    Write-Host "   Certifique-se de que:" -ForegroundColor Yellow
    Write-Host "   - Os secrets estão configurados no Supabase" -ForegroundColor Yellow
    Write-Host "   - Existem tokens FCM na tabela fcm_tokens" -ForegroundColor Yellow
    Write-Host "   - Existem dívidas vencendo hoje/amanhã" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "📊 Verificações adicionais:" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Verifique no Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "   1. Logs das funções: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
Write-Host "   2. Dados da tabela fcm_tokens: https://supabase.com/dashboard/project/$PROJECT_REF/editor"
Write-Host "   3. Jobs do pg_cron: Execute 'SELECT * FROM cron.job;' no SQL Editor"
Write-Host ""
Write-Host "🔍 Verifique no navegador (DevTools):" -ForegroundColor Yellow
Write-Host "   1. Console → procure por '[FCM]' logs"
Write-Host "   2. Application → Service Workers → verifique se está ativo"
Write-Host "   3. Application → Storage → Local Storage → procure 'fcm_token'"
Write-Host ""
