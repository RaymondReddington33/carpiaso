# Supabase Authentication Setup

## Paso 1: Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta o inicia sesión
2. Crea un nuevo proyecto
3. Espera a que el proyecto se inicialice (puede tardar unos minutos)

## Paso 2: Obtener las credenciales

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon public** key (la clave pública anónima)

## Paso 3: Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

## Paso 4: Configurar Email Auth en Supabase

1. Ve a **Authentication** → **Providers** en tu proyecto de Supabase
2. Asegúrate de que **Email** esté habilitado
3. En **Email Auth**, configura:
   - **Enable email provider**: Activado
   - **Confirm email**: Opcional (recomendado desactivarlo para magic links más rápidos)
   - **Secure email change**: Opcional

## Paso 5: Configurar Redirect URLs

1. Ve a **Authentication** → **URL Configuration**
2. Añade tu URL de desarrollo a **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
3. Añade tu URL de producción cuando despliegues:
   - `https://tu-dominio.com/auth/callback`

## Paso 6: Probar el login

1. Inicia el servidor de desarrollo: `pnpm dev`
2. Ve a `http://localhost:3000/login`
3. Introduce tu email
4. Revisa tu bandeja de entrada para el magic link
5. Haz clic en el link para iniciar sesión

## Notas

- El middleware protege todas las rutas excepto `/login` y `/auth/callback`
- Los usuarios no autenticados serán redirigidos automáticamente a `/login`
- Los usuarios autenticados que intenten acceder a `/login` serán redirigidos a `/`

