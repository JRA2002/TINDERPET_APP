# TinderPet Backend - Django REST API

Backend API para TinderPet, una aplicación de citas para mascotas.

## Características

- 🔐 Autenticación JWT con refresh tokens
- 🐕 Gestión de perfiles de mascotas múltiples por usuario
- 📸 Subida de imágenes a Cloudinary
- ❤️ Sistema de likes y matches
- 💬 Sistema de mensajería entre matches
- 🛡️ Rate limiting por IP y usuario
- 🔒 Permisos y autorizaciones robustas

## Instalación

1. Crear entorno virtual:
\`\`\`bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
\`\`\`

2. Instalar dependencias:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

3. Configurar variables de entorno:
\`\`\`bash
cp .env.example .env
# Editar .env con tus credenciales de Cloudinary
\`\`\`

4. Ejecutar migraciones:
\`\`\`bash
python manage.py makemigrations
python manage.py migrate
\`\`\`

5. Crear superusuario:
\`\`\`bash
python manage.py createsuperuser
\`\`\`

6. Ejecutar servidor:
\`\`\`bash
python manage.py runserver
\`\`\`

## Endpoints Principales

### Autenticación
- `POST /api/auth/register/` - Registro de usuario
- `POST /api/auth/login/` - Login (obtener tokens)
- `POST /api/auth/refresh/` - Refrescar access token
- `GET /api/auth/me/` - Obtener usuario actual

### Mascotas
- `GET /api/pets/` - Listar mascotas del usuario
- `POST /api/pets/` - Crear nueva mascota
- `GET /api/pets/{id}/` - Detalle de mascota
- `PUT /api/pets/{id}/` - Actualizar mascota
- `DELETE /api/pets/{id}/` - Eliminar mascota

### Discover
- `GET /api/discover/?pet_id={id}` - Obtener mascotas para descubrir (filtradas por raza)

### Likes y Matches
- `POST /api/likes/` - Dar like a una mascota
- `GET /api/matches/` - Listar matches del usuario

### Mensajes
- `GET /api/matches/{id}/messages/` - Mensajes de un match
- `POST /api/matches/{id}/messages/` - Enviar mensaje

## Seguridad

- Rate limiting: 100 req/hora para anónimos, 1000 req/hora para autenticados
- Autenticación JWT requerida para todas las rutas (excepto registro/login)
- Validación de permisos: usuarios solo pueden ver/editar sus propias mascotas
- CORS configurado para localhost:3000

## Modelos

- **User**: Usuario extendido de Django
- **Pet**: Perfil de mascota
- **PetImage**: Imágenes adicionales de mascotas
- **Like**: Likes entre mascotas
- **Match**: Matches mutuos
- **Message**: Mensajes entre matches
- **Pass**: Mascotas rechazadas
