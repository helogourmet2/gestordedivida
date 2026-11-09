# Script PowerShell para verificar o status completo do sistema
# Execute: .\scripts\check-status.ps1

$PROJECT_REF = "xdskhspqrqeraqnshuey"
$KEEP_ALIVE_URL = "https://$PROJECT_REF.supabase.co/functions/v1/keep-alive"

Write-Host "🔍 Verificando Status do Sistema..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# ─── 1. Verificar arquivo .env ────────────────────────────────────────────────
Write-Host "📄 1. Arquivo .env" -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ .env existe" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    
    $requiredVars = @(
        "VITE_FIREBASE_API_KEY",
        "VITE_FIREBASE_AUTH_DOMAIN",
        "VITE_FIREBASE_PROJECT_ID",
        "VITE_FIREBASE_VAPID_KEY",
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=.+") {
            Write-Host "   ✅ $var configurado" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var NÃO configurado ou vazio" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ❌ .env NÃO encontrado!" -ForegroundColor Red
    Write-Host "      Execute: cp .env.example .env" -ForegroundColor Yellow
}
Write-Host ""

# ─── 2. Verificar Supabase Keep-Alive ─────────────────────────────────────────
Write-Host "🔄 2. Supabase Keep-Alive" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $KEEP_ALIVE_URL -Method Get -TimeoutSec 10
    Write-Host "   ✅ Supabase está ATIVO" -ForegroundColor Green
    Write-Host "      Status: $($response.status)" -ForegroundColor Gray
    Write-Host "      Timestamp: $($response.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Supabase NÃO está respondendo" -ForegroundColor Red
    Write-Host "      Erro: $_" -ForegroundColor Red
    Write-Host "      Verifique se a função keep-alive foi deployada" -ForegroundColor Yellow
}
Write-Host ""

# ─── 3. Verificar node_modules ────────────────────────────────────────────────
Write-Host "📦 3. Dependências" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules existe" -ForegroundColor Green
    
    # Verificar dependências críticas
    $criticalDeps = @("firebase", "react", "dexie", "@supabase/supabase-js")
    foreach ($dep in $criticalDeps) {
        if (Test-Path "node_modules/$dep") {
            Write-Host "   ✅ $dep instalado" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $dep NÃO instalado" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ❌ node_modules NÃO encontrado!" -ForegroundColor Red
    Write-Host "      Execute: npm install" -ForegroundColor Yellow
}
Write-Host ""

# ─── 4. Verificar arquivos críticos ───────────────────────────────────────────
Write-Host "📂 4. Arquivos Críticos" -ForegroundColor Yellow
$criticalFiles = @(
    "public/firebase-messaging-sw.js",
    "src/lib/firebase.js",
    "src/lib/supabase.js",
    "supabase/functions/keep-alive/index.ts",
    "supabase/functions/send-debt-notifications/index.ts",
    "supabase/migrations/001_initial_schema.sql",
    "supabase/migrations/002_keep_alive_cron.sql"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file NÃO encontrado" -ForegroundColor Red
    }
}
Write-Host ""

# ─── 5. Verificar CLI tools ───────────────────────────────────────────────────
Write-Host "🛠️  5. Ferramentas CLI" -ForegroundColor Yellow

# Firebase CLI
$firebaseVersion = firebase --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Firebase CLI instalado ($firebaseVersion)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Firebase CLI NÃO instalado" -ForegroundColor Red
    Write-Host "      Execute: npm install -g firebase-tools" -ForegroundColor Yellow
}

# Supabase CLI
$supabaseVersion = supabase --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Supabase CLI instalado ($supabaseVersion)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Supabase CLI NÃO instalado" -ForegroundColor Red
    Write-Host "      Execute: npm install -g supabase" -ForegroundColor Yellow
}
Write-Host ""

# ─── Resumo Final ─────────────────────────────────────────────────────────────
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "📊 Resumo" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Links Úteis:" -ForegroundColor Yellow
Write-Host "   Firebase Console:  https://console.firebase.google.com/project/gestor-dedividas" -ForegroundColor Gray
Write-Host "   Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF" -ForegroundColor Gray
Write-Host "   GitHub Repo:       https://github.com/helogourmet2/gestordedivida" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Próximos Passos:" -ForegroundColor Yellow
Write-Host "   1. Configure o .env (se necessário)" -ForegroundColor Gray
Write-Host "   2. Execute: npm install (se necessário)" -ForegroundColor Gray
Write-Host "   3. Deploy Supabase: .\scripts\deploy-supabase.ps1" -ForegroundColor Gray
Write-Host "   4. Configure os secrets no Supabase Dashboard" -ForegroundColor Gray
Write-Host "   5. Execute as migrations SQL" -ForegroundColor Gray
Write-Host "   6. Teste: .\scripts\test-notifications.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentação:" -ForegroundColor Yellow
Write-Host "   • RESUMO_CONTAS.md - Resumo executivo" -ForegroundColor Gray
Write-Host "   • CONTAS_E_SERVICOS.md - Documentação completa" -ForegroundColor Gray
Write-Host "   • test-push-notifications.md - Guia de testes" -ForegroundColor Gray
Write-Host ""
