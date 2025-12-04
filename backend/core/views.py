from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.db import models
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Rtable, Rorder, Detail, Item, Staff, Chef, Customer, Invoice, Payment, Promotion, Cashier, Waiter
from .serializers import (
    ItemSerializer, TableSerializer, OrderSerializer, OrderDetailSerializer,
    DetailSerializer, CustomerSerializer, InvoiceSerializer, PaymentSerializer,
    PromotionSerializer, StaffSerializer, ChefSerializer, CashierSerializer, WaiterSerializer
)
from .utils import generate_id

# ============================================================
# TEMPLATE VIEWS (Django Templates - giữ lại cho demo)
# ============================================================
# def home(request):
#     return render(request, 'core/home.html')

# def menu_list(request):
#     items = Item.objects.filter(status='Available', superitemid__isnull=False)
#     return render(request, 'core/menu.html', {'mon_an': items})

# def table_list(request):
#     tables = Rtable.objects.all().order_by('tablenumber')
#     return render(request, 'core/table_list.html', {'tables': tables})

# def table_detail(request, table_id):
#     table = get_object_or_404(Rtable, tableid=table_id)
#     current_order = Rorder.objects.filter(otableid=table, status='Serving').first()
    
#     order_details = []
#     total_price = 0
    
#     if current_order:
#         details = Detail.objects.filter(dorderid=current_order)
#         for d in details:
#             item = d.ditemid 
#             price = item.price 
#             subtotal = d.quantity * price
#             total_price += subtotal
            
#             order_details.append({
#                 'item_name': item.name,
#                 'quantity': d.quantity,
#                 'price': price,
#                 'subtotal': subtotal
#             })
            
#     menu_items = Item.objects.filter(status='Available', superitemid__isnull=False)
    
#     context = {
#         'table': table,
#         'order': current_order,
#         'order_details': order_details,
#         'total_price': total_price,
#         'menu_items': menu_items,
#     }
#     return render(request, 'core/table_detail.html', context)

# def add_item(request, table_id, item_id):
#     table = get_object_or_404(Rtable, tableid=table_id)
#     item = get_object_or_404(Item, itemid=item_id)
    
#     order = Rorder.objects.filter(otableid=table, status='Serving').first()
    
#     if not order:
#         table.status = 'Occupied'
#         table.save()
        
#         order = Rorder.objects.create(
#             orderid=generate_id('ORD'),
#             createdat=timezone.now(),
#             status='Serving',
#             quantity=0,
#             otableid=table
#         )
    
#     default_chef = Chef.objects.first() 
#     existing_detail = Detail.objects.filter(dorderid=order, ditemid=item).first()
    
#     if existing_detail:
#         existing_detail.quantity += 1
#         existing_detail.save()
#     else:
#         Detail.objects.create(
#             dorderid=order,
#             ditemid=item,
#             dstaffid=default_chef, 
#             quantity=1
#         )
    
#     order.quantity = (order.quantity or 0) + 1
#     order.save()
    
#     return redirect('table_detail', table_id=table.tableid)


# ============================================================
# REST API VIEWSETS (Django REST Framework)
# ============================================================

class ItemViewSet(viewsets.ModelViewSet):
    """
    API ViewSet cho Item (Món ăn)
    
    Endpoints:
    - GET /api/items/              → Danh sách toàn bộ món
    - GET /api/items/?status=Available    → Lọc món có sẵn
    - GET /api/items/available/    → Custom action: Lấy món Available (không phải danh mục)
    - POST /api/items/             → Tạo món mới (Admin only)
    """
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [AllowAny]  # Lúc này mở cho mọi người (sau thêm JWT)
    search_fields = ['name', 'itemid']
    filter_backends = [filters.SearchFilter]
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """
        Custom action: Lấy danh sách món ăn có sẵn (không phải danh mục)
        GET /api/items/available/
        """
        items = Item.objects.filter(status='Available', superitemid__isnull=False)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)


class TableViewSet(viewsets.ModelViewSet):
    """
    API ViewSet cho Rtable (Bàn)
    
    Endpoints:
    - GET /api/tables/             → Danh sách toàn bộ bàn (kèm order đang phục vụ)
    - GET /api/tables/{id}/        → Chi tiết bàn
    - PUT /api/tables/{id}/        → Cập nhật trạng thái bàn
    """
    queryset = Rtable.objects.all()
    serializer_class = TableSerializer
    permission_classes = [AllowAny]


class OrderViewSet(viewsets.ModelViewSet):
    """
    API ViewSet cho Rorder (Đơn hàng)
    
    Endpoints:
    - GET /api/orders/             → Danh sách toàn bộ đơn hàng
    - GET /api/orders/{id}/        → Chi tiết đơn hàng (bao gồm món)
    - POST /api/orders/            → Tạo đơn hàng mới
    - POST /api/orders/{id}/add_item/   → Thêm món vào đơn
    - POST /api/orders/{id}/complete/   → Hoàn thành đơn hàng
    """
    queryset = Rorder.objects.all()
    serializer_class = OrderDetailSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        """Dùng serializer khác nhau tùy action"""
        if self.action == 'add_item':
            return DetailSerializer
        return self.serializer_class
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/orders/
        Tạo đơn hàng mới
        Body: {"otableid": 101}
        """
        table_id = request.data.get('otableid')
        try:
            table = Rtable.objects.get(tableid=table_id)
        except Rtable.DoesNotExist:
            return Response({'error': 'Table not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Kiểm tra có đơn đang phục vụ không
        existing_order = Rorder.objects.filter(otableid=table, status='Serving').first()
        if existing_order:
            return Response({'error': 'Table already has an active order'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Tạo đơn hàng mới
        new_order = Rorder.objects.create(
            orderid=generate_id('ORD'),
            createdat=timezone.now(),
            status='Serving',
            quantity=0,
            otableid=table
        )
        
        # Cập nhật trạng thái bàn
        table.status = 'Occupied'
        table.save()
        
        serializer = self.get_serializer(new_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """
        POST /api/orders/{id}/add_item/
        Thêm món ăn vào đơn hàng
        Body: {"ditemid": "F001", "quantity": 1}
        """
        order = self.get_object()
        
        # Lấy thông tin từ request
        item_id = request.data.get('ditemid')
        quantity = request.data.get('quantity', 1)
        
        try:
            item = Item.objects.get(itemid=item_id)
        except Item.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Lấy đầu bếp mặc định
        default_chef = Chef.objects.first()
        if not default_chef:
            return Response({'error': 'No chef available'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Kiểm tra đã có detail này chưa
        existing_detail = Detail.objects.filter(dorderid=order, ditemid=item, dstaffid=default_chef).first()
        
        if existing_detail:
            existing_detail.quantity += quantity
            existing_detail.save()
        else:
            Detail.objects.create(
                dorderid=order,
                ditemid=item,
                dstaffid=default_chef,
                quantity=quantity
            )
        
        # Cập nhật tổng số lượng order
        order.quantity = Detail.objects.filter(dorderid=order).aggregate(total=models.Sum('quantity'))['total'] or 0
        order.save()
        
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        POST /api/orders/{id}/complete/
        Hoàn thành đơn hàng (đổi status thành 'Paid')
        """
        order = self.get_object()
        order.status = 'Paid'
        order.save()
        
        # Cập nhật trạng thái bàn về Available
        order.otableid.status = 'Available'
        order.otableid.save()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DetailViewSet(viewsets.ModelViewSet):
    """API ViewSet cho Detail (Chi tiết món trong đơn)"""
    queryset = Detail.objects.all()
    serializer_class = DetailSerializer
    permission_classes = [AllowAny]


class CustomerViewSet(viewsets.ModelViewSet):
    """API ViewSet cho Customer (Khách hàng)"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [AllowAny]


class InvoiceViewSet(viewsets.ModelViewSet):
    """API ViewSet cho Invoice (Hóa đơn)"""
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [AllowAny]


class PaymentViewSet(viewsets.ModelViewSet):
    """API ViewSet cho Payment (Thanh toán)"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [AllowAny]


class PromotionViewSet(viewsets.ModelViewSet):
    """API ViewSet cho Promotion (Khuyến mãi)"""
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [AllowAny]


class StaffViewSet(viewsets.ModelViewSet):
    """API ViewSet cho Staff (Nhân viên)"""
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    permission_classes = [AllowAny]


class ChefViewSet(viewsets.ModelViewSet):
    """API ViewSet cho Chef (Đầu bếp)"""
    queryset = Chef.objects.all()
    serializer_class = ChefSerializer
    permission_classes = [AllowAny]


class CashierViewSet(viewsets.ModelViewSet):
    """API ViewSet cho Cashier (Thu ngân)"""
    queryset = Cashier.objects.all()
    serializer_class = CashierSerializer
    permission_classes = [AllowAny]


class WaiterViewSet(viewsets.ModelViewSet):
    """API ViewSet cho Waiter (Phục vụ)"""
    queryset = Waiter.objects.all()
    serializer_class = WaiterSerializer
    permission_classes = [AllowAny]