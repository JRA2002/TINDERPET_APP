from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Pet, PetImage, Like, Match, Message, Pass
import cloudinary.uploader

User = get_user_model()


class PetImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PetImage
        fields = ['id', 'image', 'image_url', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

class PetSerializer(serializers.ModelSerializer):
    images = PetImageSerializer(many=True, read_only=True)
    main_image_url = serializers.SerializerMethodField()
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    
    class Meta:
        model = Pet
        fields = [
            'id', 'owner', 'owner_email', 'name', 'pet_type', 'breed', 
            'age', 'gender', 'bio', 'main_image', 'main_image_url', 
            'images', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']
    
    def get_main_image_url(self, obj):
        if obj.main_image:
            return obj.main_image.url
        return None

class PetCreateSerializer(serializers.ModelSerializer):
    additional_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Pet
        fields = [
            'name', 'pet_type', 'breed', 'age', 'gender', 
            'bio', 'main_image', 'additional_images'
        ]
    
    def create(self, validated_data):
        additional_images = validated_data.pop('additional_images', [])
        pet = Pet.objects.create(**validated_data)
        
        # Upload additional images
        for image in additional_images:
            PetImage.objects.create(pet=pet, image=image)
        
        return pet

class LikeSerializer(serializers.ModelSerializer):
    from_pet_name = serializers.CharField(source='from_pet.name', read_only=True)
    to_pet_name = serializers.CharField(source='to_pet.name', read_only=True)
    is_match = serializers.SerializerMethodField()
    
    class Meta:
        model = Like
        fields = ['id', 'from_pet', 'to_pet', 'from_pet_name', 'to_pet_name', 'is_match', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_is_match(self, obj):
        return obj.is_match()

class MatchSerializer(serializers.ModelSerializer):
    pet1_details = PetSerializer(source='pet1', read_only=True)
    pet2_details = PetSerializer(source='pet2', read_only=True)
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Match
        fields = ['id', 'pet1', 'pet2', 'pet1_details', 'pet2_details', 'last_message', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'content': last_msg.content,
                'sender_pet_id': last_msg.sender_pet.id,
                'created_at': last_msg.created_at,
                'is_read': last_msg.is_read
            }
        return None

class MessageSerializer(serializers.ModelSerializer):
    sender_pet_name = serializers.CharField(source='sender_pet.name', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'match', 'sender_pet', 'sender_pet_name', 'content', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']

class PassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pass
        fields = ['id', 'from_pet', 'to_pet', 'created_at']
        read_only_fields = ['id', 'created_at']
