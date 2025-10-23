from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PetViewSet, discover_pets, create_like, create_pass,
    list_matches, list_messages, create_message, mark_messages_read
)

router = DefaultRouter()
router.register(r'pets', PetViewSet, basename='pet')

app_name = 'api'

urlpatterns = [
    
    # Router URLs (pets)
    path('', include(router.urls)),
    
    # Discover
    path('discover/', discover_pets, name='discover'),
    
    # Likes and Passes
    path('likes/', create_like, name='create-like'),
    path('passes/', create_pass, name='create-pass'),
    
    # Matches
    path('matches/', list_matches, name='list-matches'),
    
    # Messages
    path('matches/<int:match_id>/messages/', list_messages, name='list-messages'),
    path('matches/<int:match_id>/messages/create/', create_message, name='create-message'),
    path('matches/<int:match_id>/messages/read/', mark_messages_read, name='mark-messages-read'),
]
