from rest_framework import serializers
from .models import Programme, Milestone

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = '__all__'

class ProgrammeSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = Programme
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']