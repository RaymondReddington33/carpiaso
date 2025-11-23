# Configurar Variables de Entorno en Vercel (Automático)

## Opción 1: Usar el Script Automático (Recomendado)

He creado un script que configura automáticamente las variables de entorno en Vercel.

### Paso 1: Autenticarse en Vercel CLI

```bash
vercel login
```

Esto abrirá tu navegador para autenticarte. Selecciona "Continue with GitHub" y autoriza la aplicación.

### Paso 2: Ejecutar el Script

```bash
bash setup-vercel-env.sh
```

El script configurará automáticamente:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Para todos los entornos (Production, Preview, Development).

### Paso 3: Redesplegar

Después de ejecutar el script, ve a Vercel y redesplega tu proyecto, o simplemente haz un nuevo push a GitHub.

---

## Opción 2: Configuración Manual en Vercel Dashboard

Si prefieres hacerlo manualmente:

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto `carpiaso`
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://wlzjfnnikyignkmvnsip.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsempmbm5pa3lpZ25rbXZuc2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDc3MDMsImV4cCI6MjA3OTQyMzcwM30.C5rauQFekHn_yHPTBWlGWYM_4VpTsjl0ezkjT7QoVLM
```

5. Asegúrate de seleccionar todos los entornos (Production, Preview, Development)
6. Haz clic en **Save**
7. Redesplega el proyecto

---

## Verificar que Funciona

Después de configurar las variables y redesplegar:

1. ✅ El build debería completarse sin errores
2. ✅ La aplicación debería cargar correctamente
3. ✅ El login con magic link debería funcionar

