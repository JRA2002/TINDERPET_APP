from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from .models import Pet, PetImage, Like, Match, Message, Pass
from .serializers import (
    PetSerializer, PetCreateSerializer, LikeSerializer, 
    MatchSerializer, MessageSerializer, PassSerializer
)
from .permissions import IsOwnerOrReadOnly, IsPetOwner

User = get_user_model()

# Pet Views
class PetViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsPetOwner]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PetCreateSerializer
        return PetSerializer
    
    def get_queryset(self):
        # Users can only see their own pets
        return Pet.objects.filter(owner=self.request.user)
    
    @method_decorator(ratelimit(key='user', rate='50/h', method='POST'))
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=request.user)
        
        # Return full pet details
        pet = serializer.instance
        response_serializer = PetSerializer(pet)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @method_decorator(ratelimit(key='user', rate='100/h', method='PUT'))
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def set_active(self, request, pk=None):
        """Set this pet as the active profile"""
        pet = self.get_object()
        
        # Deactivate all other pets for this user
        Pet.objects.filter(owner=request.user).update(is_active=False)
        
        # Activate this pet
        pet.is_active = True
        pet.save()
        
        serializer = self.get_serializer(pet)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def images(self, request, pk=None):
        """Get all images for a pet"""
        pet = self.get_object()
        images = pet.images.all()
        from .serializers import PetImageSerializer
        serializer = PetImageSerializer(images, many=True)
        return Response(serializer.data)

# Discover View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='200/h', method='GET')
def discover_pets(request):
    """
    Get pets to discover based on the active pet's breed
    Filters out: own pets, already liked, already passed, and already matched
    """
    pet_id = request.query_params.get('pet_id')
    
    if not pet_id:
        return Response(
            {'error': 'pet_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        current_pet = Pet.objects.get(id=pet_id, owner=request.user)
    except Pet.DoesNotExist:
        return Response(
            {'error': 'Pet not found or you do not own this pet'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get IDs of pets already interacted with
    liked_ids = Like.objects.filter(from_pet=current_pet).values_list('to_pet_id', flat=True)
    passed_ids = Pass.objects.filter(from_pet=current_pet).values_list('to_pet_id', flat=True)
    
    # Get matched pet IDs
    matched_ids = []
    matches = Match.objects.filter(Q(pet1=current_pet) | Q(pet2=current_pet))
    for match in matches:
        matched_ids.append(match.pet1.id if match.pet2 == current_pet else match.pet2.id)
    
    # Exclude own pets, same breed only, and already interacted pets
    excluded_ids = list(liked_ids) + list(passed_ids) + matched_ids + [current_pet.id]
    
    pets = Pet.objects.filter(
        breed=current_pet.breed,  # Same breed only
        pet_type=current_pet.pet_type,  # Same pet type
        is_active=True
    ).exclude(
        id__in=excluded_ids
    ).exclude(
        owner=request.user  # Exclude own pets
    ).order_by('?')[:20]  # Random order, limit 20
    
    serializer = PetSerializer(pets, many=True)
    return Response(serializer.data)

# Like Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='100/h', method='POST')
def create_like(request):
    """
    Create a like and check for match
    """
    from_pet_id = request.data.get('from_pet')
    to_pet_id = request.data.get('to_pet')
    
    if not from_pet_id or not to_pet_id:
        return Response(
            {'error': 'from_pet and to_pet are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from_pet = Pet.objects.get(id=from_pet_id, owner=request.user)
        to_pet = Pet.objects.get(id=to_pet_id)
    except Pet.DoesNotExist:
        return Response(
            {'error': 'Pet not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if like already exists
    if Like.objects.filter(from_pet=from_pet, to_pet=to_pet).exists():
        return Response(
            {'error': 'Like already exists'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create like
    like = Like.objects.create(from_pet=from_pet, to_pet=to_pet)
    
    # Check for match
    is_match = like.is_match()
    match_obj = None
    
    if is_match:
        # Create match if it doesn't exist
        match_obj, created = Match.objects.get_or_create(
            pet1=min(from_pet, to_pet, key=lambda p: p.id),
            pet2=max(from_pet, to_pet, key=lambda p: p.id)
        )
    
    serializer = LikeSerializer(like)
    response_data = serializer.data
    
    if match_obj:
        response_data['match'] = MatchSerializer(match_obj).data
    
    return Response(response_data, status=status.HTTP_201_CREATED)

# Pass Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='200/h', method='POST')
def create_pass(request):
    """
    Pass on a pet (swipe left)
    """
    from_pet_id = request.data.get('from_pet')
    to_pet_id = request.data.get('to_pet')
    
    if not from_pet_id or not to_pet_id:
        return Response(
            {'error': 'from_pet and to_pet are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from_pet = Pet.objects.get(id=from_pet_id, owner=request.user)
        to_pet = Pet.objects.get(id=to_pet_id)
    except Pet.DoesNotExist:
        return Response(
            {'error': 'Pet not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Create pass if it doesn't exist
    pass_obj, created = Pass.objects.get_or_create(from_pet=from_pet, to_pet=to_pet)
    
    serializer = PassSerializer(pass_obj)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

# Match Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_matches(request):
    """
    List all matches for the user's pets
    """
    user_pets = Pet.objects.filter(owner=request.user)
    
    matches = Match.objects.filter(
        Q(pet1__in=user_pets) | Q(pet2__in=user_pets)
    ).distinct()
    
    serializer = MatchSerializer(matches, many=True)
    return Response(serializer.data)

# Message Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_messages(request, match_id):
    """
    List all messages for a match
    """
    try:
        match = Match.objects.get(id=match_id)
    except Match.DoesNotExist:
        return Response(
            {'error': 'Match not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify user owns one of the pets in the match
    if match.pet1.owner != request.user and match.pet2.owner != request.user:
        return Response(
            {'error': 'You do not have permission to view these messages'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    messages = match.messages.all()
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='500/h', method='POST')
def create_message(request, match_id):
    """
    Send a message in a match
    """
    try:
        match = Match.objects.get(id=match_id)
    except Match.DoesNotExist:
        return Response(
            {'error': 'Match not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    sender_pet_id = request.data.get('sender_pet')
    content = request.data.get('content')
    
    if not sender_pet_id or not content:
        return Response(
            {'error': 'sender_pet and content are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        sender_pet = Pet.objects.get(id=sender_pet_id, owner=request.user)
    except Pet.DoesNotExist:
        return Response(
            {'error': 'Pet not found or you do not own this pet'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify sender pet is part of the match
    if sender_pet not in [match.pet1, match.pet2]:
        return Response(
            {'error': 'This pet is not part of this match'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    message = Message.objects.create(
        match=match,
        sender_pet=sender_pet,
        content=content
    )
    
    serializer = MessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_messages_read(request, match_id):
    """
    Mark all messages in a match as read for the current user
    """
    try:
        match = Match.objects.get(id=match_id)
    except Match.DoesNotExist:
        return Response(
            {'error': 'Match not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get the user's pet in this match
    user_pet = match.pet1 if match.pet1.owner == request.user else match.pet2
    
    # Mark all messages from the other pet as read
    other_pet = match.pet2 if user_pet == match.pet1 else match.pet1
    
    Message.objects.filter(
        match=match,
        sender_pet=other_pet,
        is_read=False
    ).update(is_read=True)
    
    return Response({'status': 'Messages marked as read'})
