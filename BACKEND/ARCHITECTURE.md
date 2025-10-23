# Arquitectura del Backend - TinderPet

## Estructura de Apps

El backend está organizado en dos apps principales siguiendo las mejores prácticas de Django:

### 1. **users** - Gestión de Usuarios y Autenticación

**Responsabilidad**: Todo lo relacionado con usuarios y autenticación.

**Modelos**:
- `User`: Modelo de usuario personalizado que extiende AbstractUser
  - Usa email como identificador principal
  - Campos: email, username, created_at, updated_at

**Endpoints** (`/api/auth/`):
- `POST /register/` - Registro de nuevos usuarios
- `POST /login/` - Autenticación (JWT tokens)
- `POST /token/refresh/` - Refrescar access token
- `GET /me/` - Obtener datos del usuario actual

**Características**:
- Autenticación JWT con refresh tokens
- Rate limiting en registro (5/hora) y login (10/hora)
- Validación de contraseñas seguras
- Admin personalizado para gestión de usuarios

---

### 2. **api** - Mascotas, Matching y Mensajería

**Responsabilidad**: Lógica de negocio principal de la aplicación.

**Modelos**:
- `Pet`: Perfiles de mascotas
- `PetImage`: Imágenes adicionales de mascotas
- `Like`: Likes entre mascotas
- `Match`: Matches mutuos
- `Message`: Mensajes entre matches
- `Pass`: Mascotas rechazadas

**Endpoints** (`/api/`):

**Mascotas**:
- `GET /pets/` - Listar mascotas del usuario
- `POST /pets/` - Crear mascota (con subida a Cloudinary)
- `GET /pets/{id}/` - Detalle de mascota
- `PUT /pets/{id}/` - Actualizar mascota
- `DELETE /pets/{id}/` - Eliminar mascota
- `POST /pets/{id}/set_active/` - Activar perfil

**Discover**:
- `GET /discover/?pet_id={id}` - Obtener mascotas para descubrir
  - Filtra por misma raza y tipo
  - Excluye mascotas ya vistas, likeadas o matcheadas

**Likes y Matches**:
- `POST /likes/` - Dar like (detecta matches automáticamente)
- `POST /passes/` - Pasar mascota
- `GET /matches/` - Listar todos los matches

**Mensajería**:
- `GET /matches/{id}/messages/` - Obtener mensajes
- `POST /matches/{id}/messages/create/` - Enviar mensaje
- `PATCH /matches/{id}/messages/read/` - Marcar como leído

---

## Seguridad Implementada

### Rate Limiting
- **Anónimos**: 100 req/hora
- **Autenticados**: 1000 req/hora
- **Registro**: 5 intentos/hora por IP
- **Login**: 10 intentos/hora por IP
- **Crear mascota**: 50/hora por usuario
- **Mensajes**: 500/hora por usuario

### Permisos
- `IsAuthenticated`: Requerido en todas las rutas (excepto auth)
- `IsPetOwner`: Solo el dueño puede ver/editar sus mascotas
- Validación de ownership en likes, matches y mensajes

### CORS
- Configurado para localhost:3000 (frontend Next.js)
- Credentials permitidos para cookies/tokens

---

## Flujo de Datos

### 1. Registro y Autenticación
\`\`\`
Usuario → POST /api/auth/register/ → User creado
Usuario → POST /api/auth/login/ → JWT tokens (access + refresh)
Frontend → Guarda tokens en localStorage
Requests → Header: Authorization: Bearer {access_token}
\`\`\`

### 2. Gestión de Mascotas
\`\`\`
Usuario → POST /api/pets/ → Crea mascota con imagen en Cloudinary
Usuario → POST /api/pets/{id}/set_active/ → Activa perfil
\`\`\`

### 3. Discover y Matching
\`\`\`
Usuario → GET /api/discover/?pet_id={id} → Lista de mascotas compatibles
Usuario → POST /api/likes/ → Crea like
Backend → Verifica si hay like mutuo → Crea Match automáticamente
\`\`\`

### 4. Mensajería
\`\`\`
Usuario → GET /api/matches/ → Lista de matches
Usuario → GET /api/matches/{id}/messages/ → Mensajes del match
Usuario → POST /api/matches/{id}/messages/create/ → Envía mensaje
\`\`\`

---

## Integración con Cloudinary

Las imágenes se suben directamente a Cloudinary:
- **main_image**: Imagen principal del perfil
- **additional_images**: Galería de imágenes adicionales

Carpetas en Cloudinary:
- `tinderpet/pets/main/` - Imágenes principales
- `tinderpet/pets/gallery/` - Imágenes adicionales

---

## Base de Datos

**SQLite** (desarrollo) - Fácil de cambiar a PostgreSQL en producción.

**Relaciones principales**:
- User → Pet (1:N)
- Pet → PetImage (1:N)
- Pet → Like (N:N a través de Like)
- Pet → Match (N:N a través de Match)
- Match → Message (1:N)

---

## Ventajas de esta Arquitectura

1. **Separación de responsabilidades**: Users vs Business Logic
2. **Escalabilidad**: Fácil agregar nuevas apps (ej: payments, notifications)
3. **Reutilización**: La app users puede usarse en otros proyectos
4. **Mantenibilidad**: Código organizado y fácil de encontrar
5. **Testing**: Cada app puede testearse independientemente
