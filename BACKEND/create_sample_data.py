#!/usr/bin/env python
"""
Script para crear datos de prueba en TinderPet
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tinderpet_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Pet, Like, Match, Message

User = get_user_model()

def create_sample_data():
    print("🔄 Creando datos de prueba...\n")
    
    # Crear usuarios de prueba
    users = []
    for i in range(1, 4):
        user, created = User.objects.get_or_create(
            email=f'user{i}@tinderpet.com',
            username=f'user{i}',
            defaults={'password': 'pbkdf2_sha256$600000$test$hash'}
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"✅ Usuario creado: {user.email}")
        users.append(user)
    
    # Crear mascotas de prueba
    pets_data = [
        {
            'owner': users[0],
            'name': 'Max',
            'pet_type': 'dog',
            'breed': 'Golden Retriever',
            'age': 3,
            'gender': 'male',
            'bio': 'Me encanta jugar y hacer nuevos amigos!',
            'is_active': True
        },
        {
            'owner': users[0],
            'name': 'Luna',
            'pet_type': 'dog',
            'breed': 'Labrador',
            'age': 2,
            'gender': 'female',
            'bio': 'Busco compañía para largas caminatas',
            'is_active': False
        },
        {
            'owner': users[1],
            'name': 'Rocky',
            'pet_type': 'dog',
            'breed': 'Golden Retriever',
            'age': 4,
            'gender': 'male',
            'bio': 'Amante de la playa y los juegos',
            'is_active': True
        },
        {
            'owner': users[2],
            'name': 'Bella',
            'pet_type': 'dog',
            'breed': 'Golden Retriever',
            'age': 2,
            'gender': 'female',
            'bio': 'Dulce y cariñosa, busco amor verdadero',
            'is_active': True
        },
    ]
    
    pets = []
    for pet_data in pets_data:
        pet, created = Pet.objects.get_or_create(
            name=pet_data['name'],
            owner=pet_data['owner'],
            defaults=pet_data
        )
        if created:
            print(f"✅ Mascota creada: {pet.name} ({pet.breed})")
        pets.append(pet)
    
    # Crear algunos likes y matches
    if len(pets) >= 3:
        # Max likes Rocky
        like1, created = Like.objects.get_or_create(
            from_pet=pets[0],
            to_pet=pets[2]
        )
        if created:
            print(f"✅ Like creado: {pets[0].name} → {pets[2].name}")
        
        # Rocky likes Max (esto crea un match)
        like2, created = Like.objects.get_or_create(
            from_pet=pets[2],
            to_pet=pets[0]
        )
        if created:
            print(f"✅ Like creado: {pets[2].name} → {pets[0].name}")
            
            # Crear match
            match, created = Match.objects.get_or_create(
                pet1=min(pets[0], pets[2], key=lambda p: p.id),
                pet2=max(pets[0], pets[2], key=lambda p: p.id)
            )
            if created:
                print(f"✅ Match creado: {pets[0].name} ❤️ {pets[2].name}")
                
                # Crear algunos mensajes
                Message.objects.create(
                    match=match,
                    sender_pet=pets[0],
                    content="Hola! Me encantaría conocerte mejor 🐕"
                )
                Message.objects.create(
                    match=match,
                    sender_pet=pets[2],
                    content="Hola Max! También me gustaría. ¿Te gusta ir al parque?"
                )
                print(f"✅ Mensajes creados para el match")
    
    print("\n✨ Datos de prueba creados exitosamente!")
    print("\n📝 Credenciales de prueba:")
    print("   Email: user1@tinderpet.com")
    print("   Password: password123")

if __name__ == '__main__':
    create_sample_data()
