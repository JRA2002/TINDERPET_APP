from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Pet(models.Model):
    PET_TYPES = [
        ('dog', 'Perro'),
        ('cat', 'Gato'),
        ('bird', 'Ave'),
        ('rabbit', 'Conejo'),
        ('other', 'Otro'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Macho'),
        ('female', 'Hembra'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pets')
    name = models.CharField(max_length=100)
    pet_type = models.CharField(max_length=20, choices=PET_TYPES)
    breed = models.CharField(max_length=100)
    age = models.IntegerField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    bio = models.TextField(max_length=500)
    main_image = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.pet_type})"

class PetImage(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='images')
    image = models.URLField(max_length=500)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"Image for {self.pet.name}"

class Like(models.Model):
    from_pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='likes_given')
    to_pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='likes_received')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('from_pet', 'to_pet')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.from_pet.name} likes {self.to_pet.name}"
    
    def is_match(self):
        """Check if there's a mutual like (match)"""
        return Like.objects.filter(
            from_pet=self.to_pet,
            to_pet=self.from_pet
        ).exists()

class Match(models.Model):
    pet1 = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='matches_as_pet1')
    pet2 = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='matches_as_pet2')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('pet1', 'pet2')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Match: {self.pet1.name} & {self.pet2.name}"

class Message(models.Model):
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='messages')
    sender_pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message from {self.sender_pet.name} at {self.created_at}"

class Pass(models.Model):
    from_pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='passes_given')
    to_pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='passes_received')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('from_pet', 'to_pet')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.from_pet.name} passed {self.to_pet.name}"