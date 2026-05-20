from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email',
            'role', 'phone', 'staff_id', 'university', 'department', 'faculty',
            'email_notifications', 'sms_notifications'
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


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class PreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email_notifications', 'sms_notifications']