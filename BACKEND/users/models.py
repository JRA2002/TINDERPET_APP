from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
   
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    active_pet = models.ForeignKey('api.Pet', on_delete=models.SET_NULL, null=True, blank=True, related_name='active_for_user')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
    
    def __str__(self):
        return self.email