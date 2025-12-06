from django.urls import path, include
from . import views

urlpatterns = [
    # API URLs
    path('api/', include('backend.core.api_urls')),
]