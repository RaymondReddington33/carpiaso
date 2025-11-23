# Configurar Tabla para Video de Acuario en Supabase

## Paso 1: Crear la Tabla en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Ejecuta el siguiente SQL:

```sql
-- Create app_config table to store application configuration
CREATE TABLE IF NOT EXISTS app_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);

-- Enable Row Level Security
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read app_config"
  ON app_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated users to manage app_config"
  ON app_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous access for reading (for login page)
CREATE POLICY "Allow anonymous users to read app_config"
  ON app_config
  FOR SELECT
  TO anon
  USING (true);
```

5. Haz clic en **Run** para ejecutar el SQL

## Paso 2: Guardar el Video Automáticamente

Una vez creada la tabla, el video se guardará automáticamente cuando:

1. Configures la API key de Pexels en Settings
2. El sistema buscará un video de acuario en Pexels
3. Lo guardará en Supabase en la tabla `app_config` con la clave `aquarium_video_url`

## Paso 3: Verificar

Después de configurar la API key de Pexels en Settings:

1. Ve a **Table Editor** en Supabase
2. Selecciona la tabla `app_config`
3. Deberías ver una fila con:
   - `key`: `aquarium_video_url`
   - `value`: URL del video de Pexels
   - `description`: Descripción del video

## Notas

- El video se carga automáticamente desde Supabase en la página de login
- Si no hay video en Supabase, intentará buscarlo en Pexels (requiere API key)
- Una vez guardado en Supabase, no necesitarás la API key de Pexels para mostrar el video
- Puedes actualizar el video ejecutando el endpoint `/api/save-aquarium-video` con una API key de Pexels

