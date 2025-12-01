from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('menu/', views.menu_list, name='menu'),
    path('tables/', views.table_list, name='table_list'),
    path('tables/<int:table_id>/', views.table_detail, name='table_detail'),
    path('tables/<int:table_id>/add/<str:item_id>/', views.add_item, name='add_item'),
]