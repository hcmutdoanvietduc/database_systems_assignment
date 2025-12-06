"""
API URL Configuration
Cấu hình tất cả các endpoint API cho DRF
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# Tạo router để tự động sinh URL cho ViewSets
router = DefaultRouter()
router.register(r'items', views.ItemViewSet, basename='item')
router.register(r'tables', views.TableViewSet, basename='table')
router.register(r'orders', views.OrderViewSet, basename='order')
router.register(r'details', views.DetailViewSet, basename='detail')
router.register(r'customers', views.CustomerViewSet, basename='customer')
router.register(r'invoices', views.InvoiceViewSet, basename='invoice')
router.register(r'payments', views.PaymentViewSet, basename='payment')
router.register(r'promotions', views.PromotionViewSet, basename='promotion')
router.register(r'staff', views.StaffViewSet, basename='staff')
router.register(r'chefs', views.ChefViewSet, basename='chef')
router.register(r'cashiers', views.CashierViewSet, basename='cashier')
router.register(r'waiters', views.WaiterViewSet, basename='waiter')
router.register(r'materials', views.MaterialViewSet, basename='material')
router.register(r'revenue', views.RevenueStatsView, basename='revenue')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
