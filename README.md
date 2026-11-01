# CLIPCLAPS

Plataforma responsive de videos cortos y recompensas en modo demostración.

## Estado actual
- Feed de videos vertical y responsive.
- Interacciones de demostración: likes, navegación y saldo de monedas ficticias.
- Billetera de prueba con aviso de que los puntos no tienen valor monetario.
- Endpoint de salud: `/api/health`.
- Blueprint de Render con servicio web y PostgreSQL.

## Desarrollo local
```bash
npm install
npm run dev
```

## Despliegue
El archivo `render.yaml` define un servicio web Node y una base PostgreSQL en Render. El despliegue requiere aplicar el Blueprint desde el panel de Render.

## Próximas fases
1. Autenticación real y perfiles.
2. Persistencia de usuarios, videos, puntos e historial en PostgreSQL.
3. Panel administrativo, moderación y gestión de contenido.
4. Reglas antifraude, términos, privacidad y revisión legal antes de habilitar canjes o dinero real.

**Importante:** las monedas actuales son únicamente demostrativas. No son dinero, no se canjean ni se retiran.
