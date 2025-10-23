#!/usr/bin/env python
"""
Script de configuración inicial para TinderPet Backend
Ejecuta migraciones y crea un superusuario si no existe
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tinderpet_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.core.management import call_command

User = get_user_model()

def setup_database():
    """Ejecutar migraciones"""
    print("🔄 Ejecutando migraciones...")
    call_command('makemigrations', 'users')
    call_command('makemigrations', 'api')
    call_command('makemigrations')
    call_command('migrate')
    print("✅ Migraciones completadas")

def create_superuser():
    """Crear superusuario si no existe"""
    if not User.objects.filter(is_superuser=True).exists():
        print("\n👤 Creando superusuario...")
        email = input("Email del superusuario: ")
        username = input("Username: ")
        password = input("Password: ")
        
        User.objects.create_superuser(
            email=email,
            username=username,
            password=password
        )
        print("✅ Superusuario creado exitosamente")
    else:
        print("ℹ️  Ya existe un superusuario")

def main():
    print("🚀 Configuración inicial de TinderPet Backend\n")
    
    try:
        setup_database()
        create_superuser()
        
        print("\n✨ Configuración completada exitosamente!")
        print("\n📝 Próximos pasos:")
        print("   1. Configura tus credenciales de Cloudinary en .env")
        print("   2. Ejecuta: python manage.py runserver")
        print("   3. Accede al admin en: http://localhost:8000/admin")
        
    except Exception as e:
        print(f"\n❌ Error durante la configuración: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
