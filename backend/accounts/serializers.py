from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email',
            'role', 'staff_id', 'university', 'department', 'faculty'
        ]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'password',
            'role', 'staff_id', 'university', 'department', 'faculty'
        ]

    def create(self, validated_data):
        # Generate username from email
        validated_data['username'] = validated_data['email'].split('@')[0]
        user = User.objects.create_user(**validated_data)
        return user