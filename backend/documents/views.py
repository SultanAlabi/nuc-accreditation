from rest_framework import generics, permissions, filters
from accounts.permissions import IsHOD, IsAPU, IsAnyRole
from .models import Document
from .serializers import DocumentSerializer


class GlobalDocumentListView(generics.ListAPIView):
    """List all documents across all programmes with filtering support."""
    serializer_class = DocumentSerializer
    permission_classes = [IsAnyRole]

    def get_queryset(self):
        qs = Document.objects.select_related('programme', 'uploaded_by').all()

        # Filter by programme
        programme = self.request.query_params.get('programme')
        if programme:
            qs = qs.filter(programme_id=programme)

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        # Filter by verification status
        verified = self.request.query_params.get('verified')
        if verified is not None:
            if verified.lower() == 'true':
                qs = qs.filter(status='VERIFIED')
            elif verified.lower() == 'false':
                qs = qs.filter(status='PENDING')

        # Search by title/file name
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(title__icontains=search)

        # Ordering
        ordering = self.request.query_params.get('ordering', '-uploaded_at')
        allowed_orderings = ['uploaded_at', '-uploaded_at', 'title', '-title', 'category', '-category']
        if ordering in allowed_orderings:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-uploaded_at')

        return qs


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