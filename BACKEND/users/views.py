from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from .serializers import UserSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration
    Rate limited to 5 registrations per hour per IP
    """
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    @method_decorator(ratelimit(key='ip', rate='5000/h', method='POST'))
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class LoginView(TokenObtainPairView):
    """
    API endpoint for user login (JWT token generation)
    Rate limited to 10 login attempts per hour per IP
    """
    permission_classes = [AllowAny]
    
    @method_decorator(ratelimit(key='ip', rate='10000/h', method='POST'))
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class RefreshTokenView(TokenRefreshView):
    """API endpoint for refreshing JWT tokens"""
    permission_classes = [AllowAny]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user details"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
