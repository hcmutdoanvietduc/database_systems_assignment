from django.urls import path, include
from . import views

# Template URLs (Django Templates - giữ lại cho demo)
urlpatterns = [
    path('', views.home, name='home'),
    path('menu/', views.menu_list, name='menu'),
    path('tables/', views.table_list, name='table_list'),
    path('tables/<int:table_id>/', views.table_detail, name='table_detail'),
    path('tables/<int:table_id>/add/<str:item_id>/', views.add_item, name='add_item'),
    
    # API URLs
    path('api/', include('backend.core.api_urls')),
]