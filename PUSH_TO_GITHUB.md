# Cómo subir el proyecto a GitHub

## Paso 1: Crear Token de Acceso Personal

1. Ve a: https://github.com/settings/tokens/new
2. O navega: GitHub → Tu perfil → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)

3. Configura el token:
   - **Note**: "Carpiaso Local" (o el nombre que prefieras)
   - **Expiration**: Elige una duración (90 días recomendado)
   - **Scopes**: Marca `repo` (acceso completo a repositorios)

4. Haz clic en **Generate token**

5. **IMPORTANTE**: Copia el token inmediatamente (empieza por `ghp_...`). Solo se muestra una vez.

## Paso 2: Usar el token para hacer push

Una vez tengas el token, ejecuta estos comandos en la terminal:

```bash
cd /Users/oriolclaramuntpascual/Desktop/Programacion2025/carpitaso

# Cambiar el remote a HTTPS
git remote set-url origin https://github.com/RaymondReddington33/carpiaso.git

# Hacer push (te pedirá usuario y contraseña)
git push -u origin main
```

Cuando te pida:
- **Username**: `RaymondReddington33`
- **Password**: Pega el token que copiaste (NO tu contraseña de GitHub)

## Alternativa: Usar el token directamente en la URL

Si prefieres, puedes usar el token directamente en la URL:

```bash
git remote set-url origin https://TU_TOKEN_AQUI@github.com/RaymondReddington33/carpiaso.git
git push -u origin main
```

Reemplaza `TU_TOKEN_AQUI` con el token que copiaste.

