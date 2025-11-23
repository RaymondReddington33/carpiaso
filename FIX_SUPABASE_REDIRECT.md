# Solución Definitiva: Magic Link Redirige a Localhost

## Problema
Cuando haces login en `carpiaso.com`, el magic link que recibes por email te redirige a `http://localhost:3000` en lugar de a `https://carpiaso.com`.

## Causa
Supabase está usando la **"Site URL"** configurada en el dashboard en lugar del parámetro `emailRedirectTo` que enviamos desde el código.

## Solución (2 Pasos)

### Paso 1: Configurar Site URL en Supabase (CRÍTICO)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** → **URL Configuration**
4. En **Site URL**, cambia de:
   ```
   http://localhost:3000
   ```
   A:
   ```
   https://carpiaso.com
   ```

5. En **Redirect URLs**, asegúrate de tener estas URLs (una por línea):
   ```
   https://carpiaso.com/auth/callback
   https://www.carpiaso.com/auth/callback
   http://localhost:3000/auth/callback
   ```

6. **Guarda los cambios**

### Paso 2: Verificar que el Código Esté Actualizado

El código ya está actualizado para detectar automáticamente si estás en producción y usar la URL correcta. Si haces un nuevo despliegue, debería funcionar.

## Verificación

Después de cambiar la Site URL en Supabase:

1. **Espera 1-2 minutos** para que los cambios se propaguen
2. Ve a https://carpiaso.com/login
3. Introduce tu email
4. Revisa tu correo - el magic link debería ser:
   ```
   https://carpiaso.com/auth/callback?token=...
   ```
   **NO** debería ser:
   ```
   http://localhost:3000/auth/callback?token=...
   ```

5. Haz clic en el link y deberías ser redirigido a `https://carpiaso.com`

## Notas Importantes

- **La Site URL en Supabase es la configuración más importante**. Si está en `localhost:3000`, todos los magic links usarán esa URL.
- Los cambios en Supabase se aplican inmediatamente, pero puede tardar 1-2 minutos en propagarse.
- No necesitas redesplegar Vercel después de cambiar la configuración en Supabase.
- El código ahora detecta automáticamente si estás en `carpiaso.com` y fuerza la URL correcta.

## Si Sigue Sin Funcionar

1. Verifica que la Site URL en Supabase sea exactamente `https://carpiaso.com` (sin barra al final)
2. Verifica que las Redirect URLs incluyan `https://carpiaso.com/auth/callback`
3. Limpia la caché del navegador
4. Prueba en modo incógnito
5. Revisa la consola del navegador (F12) para ver qué URL se está usando

