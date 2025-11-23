# Configurar URLs de Redirección en Supabase

## Problema
Cuando te logueas en producción (carpiaso.com), Supabase te redirige a localhost en lugar de a tu dominio de producción.

## Solución

Necesitas configurar las URLs permitidas en Supabase:

### Paso 1: Ir a la Configuración de Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** → **URL Configuration**

### Paso 2: Configurar Redirect URLs

En la sección **Redirect URLs**, agrega estas URLs:

```
https://carpiaso.com/auth/callback
https://www.carpiaso.com/auth/callback
http://localhost:3000/auth/callback
```

**Importante:** 
- Agrega ambas versiones (con y sin www) si usas ambas
- Agrega también localhost para desarrollo local
- Asegúrate de incluir el protocolo (`https://` o `http://`)

### Paso 3: Configurar Site URL (Opcional pero Recomendado)

En la misma página, en **Site URL**, configura:

```
https://carpiaso.com
```

Esto es la URL base de tu aplicación en producción.

### Paso 4: Configurar Variable de Entorno en Vercel (Opcional)

Para mayor control, puedes agregar una variable de entorno en Vercel:

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. **Settings** → **Environment Variables**
3. Agrega:

```
NEXT_PUBLIC_SITE_URL=https://carpiaso.com
```

4. Asegúrate de seleccionar todos los entornos (Production, Preview, Development)
5. Para desarrollo local, puedes crear un `.env.local` con:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Paso 5: Verificar

Después de configurar:

1. Ve a https://carpiaso.com/login
2. Introduce tu email
3. Revisa tu correo y haz clic en el magic link
4. Deberías ser redirigido a `https://carpiaso.com` (no a localhost)

## Notas

- Los cambios en Supabase se aplican inmediatamente
- No necesitas redesplegar Vercel después de cambiar la configuración en Supabase
- Si sigues teniendo problemas, verifica que la URL en el email del magic link sea `https://carpiaso.com/auth/callback` y no `http://localhost:3000/auth/callback`

