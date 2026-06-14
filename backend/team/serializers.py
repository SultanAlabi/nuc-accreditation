from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import TeamMember, TeamInvite


class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'user_id', 'role', 'department', 'joined_at']
        read_only_fields = ['joined_at']


class TeamInviteSerializer(serializers.ModelSerializer):
    invited_by = UserSerializer(read_only=True)

    class Meta:
        model = TeamInvite
        fields = ['id', 'email', 'role', 'invited_by', 'status', 'created_at']
        read_only_fields = ['invited_by', 'status', 'created_at']
