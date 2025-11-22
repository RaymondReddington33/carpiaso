# Guía de Despliegue en Vercel

## Configurar Variables de Entorno en Vercel

Para que el proyecto funcione correctamente en Vercel, necesitas configurar las siguientes variables de entorno:

### Paso 1: Ir a la Configuración del Proyecto en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto `carpiaso`
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Agregar Variables de Entorno

Agrega las siguientes variables de entorno:

#### Variables Requeridas (Supabase)

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

**Cómo obtener estos valores:**
1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Variables Opcionales (pueden configurarse en la app)

```
OPENAI_API_KEY=tu_clave_de_openai
PEXELS_API_KEY=tu_clave_de_pexels
```

**Nota:** Estas variables también se pueden configurar desde la página de Settings dentro de la aplicación, pero es recomendable configurarlas en Vercel para que funcionen desde el inicio.

### Paso 3: Configurar para Todos los Entornos

Asegúrate de que las variables estén configuradas para:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

### Paso 4: Redesplegar

Después de agregar las variables de entorno:

1. Ve a la pestaña **Deployments**
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo push a GitHub para que se despliegue automáticamente

## Verificar el Despliegue

Una vez desplegado, verifica que:

1. ✅ El build se completa sin errores
2. ✅ La página de login carga correctamente
3. ✅ Puedes iniciar sesión con magic link
4. ✅ Las páginas protegidas redirigen correctamente

## Solución de Problemas

### Error: "Missing Supabase environment variables"

- Verifica que las variables estén configuradas en Vercel
- Asegúrate de que los nombres sean exactos (con `NEXT_PUBLIC_` para variables públicas)
- Redesplega después de agregar las variables

### Error durante el build

- Revisa los logs del build en Vercel
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que no haya errores de TypeScript

### La autenticación no funciona

- Verifica que las URLs de Supabase sean correctas
- Asegúrate de que el redirect URL en Supabase incluya tu dominio de Vercel
- Revisa la configuración de autenticación en Supabase Dashboard

