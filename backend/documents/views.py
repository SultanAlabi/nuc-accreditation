from rest_framework import generics, permissions
from accounts.permissions import IsHOD, IsAPU, IsAnyRole
from .models import Document
from .serializers import DocumentSerializer

class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsHOD()]
        return [IsAnyRole()]

    def get_queryset(self):
        return Document.objects.filter(programme_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        serializer.save(
            uploaded_by=self.request.user,
            programme_id=self.kwargs['pk']
        )

class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsHOD()]
        return [IsAnyRole()]

class VerifyDocumentView(generics.UpdateAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def get_permissions(self):
        return [IsAPU()]

    def perform_update(self, serializer):
        serializer.save(status='VERIFIED')