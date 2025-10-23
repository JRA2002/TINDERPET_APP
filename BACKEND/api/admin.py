from django.contrib import admin
from .models import Pet, PetImage, Like, Match, Message, Pass


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ['name', 'pet_type', 'breed', 'owner', 'is_active', 'created_at']
    list_filter = ['pet_type', 'is_active', 'gender', 'created_at']
    search_fields = ['name', 'breed', 'owner__email', 'owner__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('owner', 'name', 'pet_type', 'breed', 'age', 'gender')
        }),
        ('Detalles', {
            'fields': ('bio', 'main_image', 'is_active')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(PetImage)
class PetImageAdmin(admin.ModelAdmin):
    list_display = ['pet', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['pet__name']
    ordering = ['-uploaded_at']
    readonly_fields = ['uploaded_at']

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['from_pet', 'to_pet', 'created_at', 'is_match']
    list_filter = ['created_at']
    search_fields = ['from_pet__name', 'to_pet__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    def is_match(self, obj):
        return obj.is_match()
    is_match.boolean = True
    is_match.short_description = 'Es Match'

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ['pet1', 'pet2', 'created_at', 'message_count']
    list_filter = ['created_at']
    search_fields = ['pet1__name', 'pet2__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Mensajes'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender_pet', 'match', 'content_preview', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['sender_pet__name', 'content']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Contenido'

@admin.register(Pass)
class PassAdmin(admin.ModelAdmin):
    list_display = ['from_pet', 'to_pet', 'created_at']
    list_filter = ['created_at']
    search_fields = ['from_pet__name', 'to_pet__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
