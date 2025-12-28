# 🔐 Guía de Seguridad - TiendaFacil

## 📋 Índice
1. [Variables de Entorno](#variables-de-entorno)
2. [Archivos Sensibles](#archivos-sensibles)
3. [Mejores Prácticas](#mejores-prácticas)
4. [Checklist de Seguridad](#checklist-de-seguridad)
5. [Qué Hacer en Caso de Exposición](#qué-hacer-en-caso-de-exposición)

---

## 🔑 Variables de Entorno

### ✅ Configuración Correcta

1. **Crea tu archivo `.env.local`** (nunca subas este archivo a Git):
   ```bash
   cp .env.example .env.local
   ```

2. **Completa con tus credenciales reales**:
   - Supabase URL y Keys
   - Firebase credentials (si aplica)
   - API Keys de servicios externos
   - Secrets de autenticación

3. **Verifica que `.env.local` esté en `.gitignore`**:
   ```bash
   git check-ignore .env.local
   # Debe retornar: .env.local
   ```

### ❌ Nunca Hagas Esto

- ❌ NO subas archivos `.env` con credenciales reales a Git
- ❌ NO compartas tus claves en Slack, Discord, o email
- ❌ NO uses las mismas claves en desarrollo y producción
- ❌ NO hardcodees credenciales en el código fuente
- ❌ NO expongas variables sensibles en el lado del cliente

### ✅ Variables Públicas vs Privadas

**Variables PÚBLICAS** (pueden exponerse al cliente):
```env
NEXT_PUBLIC_APP_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
```

**Variables PRIVADAS** (solo servidor):
```env
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
STRIPE_SECRET_KEY=...
NEXTAUTH_SECRET=...
```

---

## 📁 Archivos Sensibles

### 🚫 Archivos que NUNCA deben subirse a Git

```
.env
.env.local
.env.production
*-service-account.json
serviceAccountKey.json
firebase-adminsdk-*.json
credentials.json
secrets.json
*.pem
*.key
*.cert
config.local.js
```

### ✅ Verificar Archivos Ignorados

```bash
# Ver qué archivos están siendo ignorados
git status --ignored

# Verificar si un archivo específico está ignorado
git check-ignore -v .env.local

# Ver todos los archivos trackeados
git ls-files
```

### 🔍 Buscar Credenciales Accidentalmente Commiteadas

```bash
# Buscar archivos .env en el historial
git log --all --full-history -- "*.env"

# Buscar strings sensibles
git grep -i "api_key\|secret\|password\|token" $(git rev-list --all)
```

---

## 🛡️ Mejores Prácticas

### 1. Gestión de Secretos

#### Desarrollo Local
- Usa `.env.local` para desarrollo
- Nunca compartas tu `.env.local`
- Mantén `.env.example` actualizado

#### Producción
- **Vercel**: Usa el dashboard de Environment Variables
- **Railway**: Usa el panel de Variables
- **Netlify**: Usa Environment Variables en Settings
- **AWS**: Usa AWS Secrets Manager o Parameter Store
- **GCP**: Usa Secret Manager

### 2. Rotación de Claves

```bash
# Cada 90 días, rota tus claves:
# 1. Genera nuevas claves en Supabase/Firebase
# 2. Actualiza .env.local
# 3. Actualiza variables en producción
# 4. Revoca las claves antiguas
```

### 3. Niveles de Acceso

```
┌─────────────────────────────────────────┐
│ SUPER ADMIN (SU)                        │
│ - Acceso total a todas las credenciales │
│ - Puede rotar claves                    │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ ADMIN                                   │
│ - Acceso a credenciales de producción  │
│ - No puede rotar claves                │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ DEVELOPER                               │
│ - Solo credenciales de desarrollo      │
│ - No acceso a producción               │
└─────────────────────────────────────────┘
```

### 4. Auditoría de Seguridad

```bash
# Instalar herramientas de auditoría
npm install -g npm-audit
npm install -g snyk

# Auditar dependencias
npm audit
npm audit fix

# Auditar con Snyk
snyk test
snyk monitor
```

---

## ✅ Checklist de Seguridad

### Antes de Cada Commit

- [ ] Verificar que no hay archivos `.env` en staging
- [ ] Revisar que no hay credenciales hardcodeadas
- [ ] Ejecutar `git status --ignored` para verificar
- [ ] Revisar el diff: `git diff --cached`

### Antes de Cada Deploy

- [ ] Variables de entorno configuradas en el servicio
- [ ] Claves de producción diferentes a desarrollo
- [ ] CORS configurado correctamente
- [ ] Rate limiting habilitado
- [ ] HTTPS habilitado
- [ ] Firewall rules configuradas

### Mensualmente

- [ ] Revisar logs de acceso sospechoso
- [ ] Auditar dependencias: `npm audit`
- [ ] Revisar permisos de usuarios
- [ ] Verificar backups de base de datos

### Trimestralmente

- [ ] Rotar claves de API
- [ ] Rotar secrets de autenticación
- [ ] Revisar políticas de seguridad
- [ ] Actualizar documentación de seguridad

---

## 🚨 Qué Hacer en Caso de Exposición

### Si Expusiste Credenciales en Git

#### 1. **Acción Inmediata** (primeros 5 minutos)

```bash
# 1. Revocar INMEDIATAMENTE las claves expuestas
# - Supabase: Dashboard > Settings > API > Revoke keys
# - Firebase: Console > Settings > Service accounts > Delete key
# - Stripe: Dashboard > Developers > API keys > Roll key

# 2. Generar nuevas claves

# 3. Actualizar .env.local con las nuevas claves

# 4. Actualizar variables en producción
```

#### 2. **Limpiar el Historial de Git** (si es necesario)

```bash
# ADVERTENCIA: Esto reescribe el historial de Git
# Solo hazlo si es absolutamente necesario

# Opción 1: Usar BFG Repo-Cleaner (recomendado)
git clone --mirror https://github.com/tu-usuario/tiendafacil.git
java -jar bfg.jar --delete-files .env tiendafacil.git
cd tiendafacil.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# Opción 2: Usar git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

git push --force --all
```

#### 3. **Notificar al Equipo**

```markdown
🚨 ALERTA DE SEGURIDAD

Se expusieron credenciales en el commit [hash].

Acciones tomadas:
- ✅ Claves revocadas
- ✅ Nuevas claves generadas
- ✅ Variables actualizadas en producción
- ✅ Historial de Git limpiado

Próximos pasos:
- Monitorear logs por 48 horas
- Revisar accesos sospechosos
- Actualizar documentación
```

#### 4. **Monitoreo Post-Incidente**

```bash
# Monitorear logs de Supabase/Firebase
# Buscar:
# - Accesos desde IPs desconocidas
# - Picos de uso inusuales
# - Operaciones no autorizadas

# Revisar durante 48-72 horas
```

---

## 🔗 Recursos Adicionales

### Herramientas Útiles

- [git-secrets](https://github.com/awslabs/git-secrets) - Previene commits con secretos
- [truffleHog](https://github.com/trufflesecurity/truffleHog) - Encuentra secretos en Git
- [GitGuardian](https://www.gitguardian.com/) - Monitoreo de secretos
- [Snyk](https://snyk.io/) - Seguridad de dependencias

### Documentación

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📞 Contacto de Seguridad

Si descubres una vulnerabilidad de seguridad, por favor:

1. **NO** la publiques en issues públicos
2. Contacta directamente al equipo de seguridad
3. Proporciona detalles completos del problema
4. Espera confirmación antes de divulgar

---

**Última actualización**: 2025-12-28  
**Versión**: 1.0.0
