#!/bin/bash

# Script para configurar variables de entorno en Vercel
# Ejecuta: bash setup-vercel-env.sh

set -e

echo "🔧 Configurando variables de entorno en Vercel..."
echo ""

# Verificar si está autenticado
echo "🔐 Verificando autenticación..."
if ! vercel whoami &>/dev/null; then
    echo "❌ No estás autenticado en Vercel CLI"
    echo ""
    echo "📝 Por favor, ejecuta primero:"
    echo "   vercel login"
    echo ""
    echo "Luego vuelve a ejecutar este script."
    exit 1
fi

echo "✅ Autenticado como: $(vercel whoami)"
echo ""

# Verificar si el proyecto está vinculado
if ! vercel project ls &>/dev/null 2>&1; then
    echo "🔗 Vinculando proyecto a Vercel..."
    vercel link --yes
    echo ""
fi

# Variables de Supabase
SUPABASE_URL="https://wlzjfnnikyignkmvnsip.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsempmbm5pa3lpZ25rbXZuc2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDc3MDMsImV4cCI6MjA3OTQyMzcwM30.C5rauQFekHn_yHPTBWlGWYM_4VpTsjl0ezkjT7QoVLM"

echo "📦 Configurando NEXT_PUBLIC_SUPABASE_URL para todos los entornos..."
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL development

echo ""
echo "📦 Configurando NEXT_PUBLIC_SUPABASE_ANON_KEY para todos los entornos..."
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

echo ""
echo "✅ ¡Variables de entorno configuradas correctamente!"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard"
echo "   2. Haz clic en 'Redeploy' en el último deployment"
echo "   3. O simplemente haz un nuevo push a GitHub"
echo ""
