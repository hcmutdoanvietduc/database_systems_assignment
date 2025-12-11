from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.db import models, connection
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from datetime import timedelta
from django.db.models import Sum
from django.db.models.functions import TruncDate

from .models import Rtable, Rorder, Detail, Item, Staff, Chef, Customer, Invoice, Payment, Promotion, Cashier, Waiter, Material, Ptorder
from .serializers import (
    ItemSerializer, TableSerializer, OrderSerializer, OrderDetailSerializer,
    DetailSerializer, CustomerSerializer, InvoiceSerializer, PaymentSerializer,
    PromotionSerializer, StaffSerializer, ChefSerializer, CashierSerializer, WaiterSerializer,
    CustomTokenObtainPairSerializer, MaterialSerializer
)
from .utils import generate_id

# REST API 

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
        Body: {"customer_name": "Tên KH", "customer_phone": "0123456789"}
        """
        order = self.get_object()
        customer_name = request.data.get('customer_name', '').strip()
        customer_phone = request.data.get('customer_phone', '').strip()
        
        if not customer_name or not customer_phone:
            return Response(
                {'error': 'Vui lòng nhập đầy đủ tên và số điện thoại khách hàng!'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Tìm hoặc tạo khách hàng bằng stored procedure
            with connection.cursor() as cursor:
                cursor.execute(
                    "CALL sp_GetOrCreateCustomer(%s, %s)",
                    [customer_phone, customer_name]
                )
                # Lấy CustomerID từ kết quả SELECT
                result = cursor.fetchone()
                customer_id = result[0] if result else None
            
            if not customer_id:
                return Response(
                    {'error': 'Không thể tạo thông tin khách hàng!'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Lấy object Customer từ database
            customer = Customer.objects.get(customerid=customer_id)
            
            # Lấy nhân viên phục vụ (lấy staff từ Detail - Chef)
            staff_obj = None
            detail = Detail.objects.filter(dorderid=order).first()
            if detail:
                # detail.dstaffid là Chef object, cần lấy Staff từ Chef.staffid
                chef = detail.dstaffid
                staff_obj = Staff.objects.get(staffid=chef.staffid.staffid)
            else:
                # Nếu không có detail, lấy staff đầu tiên trong hệ thống
                staff_obj = Staff.objects.first()
            
            if not staff_obj:
                return Response(
                    {'error': 'Không tìm thấy nhân viên phục vụ!'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Tạo PTOrder để liên kết Customer với Order
            Ptorder.objects.get_or_create(
                ptorderid=order,
                defaults={
                    'ptstaffid': staff_obj,
                    'ptcustomerid': customer
                }
            )
            
            # Cập nhật trạng thái đơn hàng
            order.status = 'Paid'
            order.save()
            
            # Cập nhật trạng thái bàn về Available
            order.otableid.status = 'Available'
            order.otableid.save()
            
            serializer = self.get_serializer(order)
            return Response({
                'order': serializer.data,
                'customer': {
                    'id': customer.customerid,
                    'name': customer.fullname,
                    'phone': customer.phone
                },
                'message': 'Hoàn thành đơn hàng và lưu thông tin khách hàng thành công!'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            print(f"Error completing order: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': f'Lỗi khi hoàn thành đơn hàng: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'])
    def delete_order(self, request, pk=None):
        """
        DELETE /api/orders/{id}/delete_order/
        Xóa đơn hàng và hóa đơn liên quan bằng stored procedure
        """
        order = self.get_object()
        order_id = order.orderid
        table_id = order.otableid
        
        try:
            with connection.cursor() as cursor:
                # Gọi stored procedure sp_DeleteOrder
                cursor.execute("CALL sp_DeleteOrder(%s)", [order_id])
            
            # Cập nhật trạng thái bàn về Available
            if table_id:
                table_id.status = 'Available'
                table_id.save()
            
            return Response({
                'message': f'Đã xóa đơn hàng {order_id} và hóa đơn liên quan',
                'order_id': order_id
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Lỗi khi xóa đơn hàng: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    
    def get_queryset(self):
        """
        Lọc invoices theo customer_id nếu có query param
        """
        queryset = Invoice.objects.all()
        customer_id = self.request.query_params.get('customer_id', None)
        
        if customer_id:
            queryset = queryset.filter(customerid=customer_id)
        
        return queryset


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
    """
    API ViewSet cho Staff (Nhân viên)
    Hỗ trợ lọc theo chức vụ bằng Raw SQL Query:
    - GET /api/staff/?role=all (tất cả)
    - GET /api/staff/?role=chef (đầu bếp)
    - GET /api/staff/?role=cashier (thu ngân)
    - GET /api/staff/?role=waiter (phục vụ)
    """
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """
        Override list method để sử dụng Raw SQL Query cho filtering theo role
        Trả về thông tin staff kèm theo role và details
        """
        role = request.query_params.get('role', 'all')
        
        # Build raw SQL query based on role with LEFT JOIN để lấy thông tin chi tiết
        if role == 'chef':
            sql = """
                SELECT 
                    s.StaffID, s.FullName, s.Phone, s.Status, s.SManagerID,
                    'Đầu Bếp' as RoleName,
                    CAST(IFNULL(c.Experience, 0) AS CHAR) as DetailInfo
                FROM staff s
                INNER JOIN chef c ON s.StaffID = c.StaffID
            """
        elif role == 'cashier':
            sql = """
                SELECT 
                    s.StaffID, s.FullName, s.Phone, s.Status, s.SManagerID,
                    'Thu Ngân' as RoleName,
                    IFNULL(ca.Education, '') as DetailInfo
                FROM staff s
                INNER JOIN cashier ca ON s.StaffID = ca.StaffID
            """
        elif role == 'waiter':
            sql = """
                SELECT 
                    s.StaffID, s.FullName, s.Phone, s.Status, s.SManagerID,
                    'Phục Vụ' as RoleName,
                    IFNULL(w.Fluency, '') as DetailInfo
                FROM staff s
                INNER JOIN waiter w ON s.StaffID = w.StaffID
            """
        else:  # all - LEFT JOIN để lấy tất cả staff với role của họ
            sql = """
                SELECT 
                    s.StaffID, 
                    s.FullName, 
                    s.Phone, 
                    s.Status, 
                    s.SManagerID,
                    CASE
                        WHEN c.StaffID IS NOT NULL THEN 'Đầu Bếp'
                        WHEN ca.StaffID IS NOT NULL THEN 'Thu Ngân'
                        WHEN w.StaffID IS NOT NULL THEN 'Phục Vụ'
                        ELSE 'Nhân Viên'
                    END as RoleName,
                    CASE
                        WHEN c.StaffID IS NOT NULL THEN CAST(IFNULL(c.Experience, 0) AS CHAR)
                        WHEN ca.StaffID IS NOT NULL THEN IFNULL(ca.Education, '')
                        WHEN w.StaffID IS NOT NULL THEN IFNULL(w.Fluency, '')
                        ELSE ''
                    END as DetailInfo
                FROM staff s
                LEFT JOIN chef c ON s.StaffID = c.StaffID
                LEFT JOIN cashier ca ON s.StaffID = ca.StaffID
                LEFT JOIN waiter w ON s.StaffID = w.StaffID
            """
        
        # Execute raw query
        with connection.cursor() as cursor:
            cursor.execute(sql)
            columns = [col[0] for col in cursor.description]
            results = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]
        
        # Convert to serializer format
        staff_data = []
        for row in results:
            staff_data.append({
                'staffid': row.get('StaffID'),
                'fullname': row.get('FullName'),
                'phone': row.get('Phone'),
                'status': row.get('Status'),
                'smanagerid': row.get('SManagerID'),
                'role': row.get('RoleName'),
                'detail': row.get('DetailInfo')
            })
        
        return Response(staff_data)
    
    @action(detail=False, methods=['post'])
    def add_staff(self, request):
        """
        POST /api/staff/add_staff/
        Thêm nhân viên mới bằng stored procedure sp_AddStaff
        
        Body: {
            "name": "Nguyễn Văn A",
            "phone": "0901234567",
            "manager_id": "MGR01",
            "role": "Chef",  // Chef, Cashier, hoặc Waiter
            "role_detail": "5"  // Experience (năm) cho Chef, Education cho Cashier, Fluency cho Waiter
        }
        """
        data = request.data
        
        try:
            with connection.cursor() as cursor:
                # Gọi stored procedure sp_AddStaff
                # INOUT parameter cho StaffID
                cursor.execute("""
                    SET @staff_id = NULL;
                """)
                
                cursor.execute("""
                    CALL sp_AddStaff(
                        @staff_id,
                        %s, %s, %s, %s, %s
                    )
                """, [
                    data.get('name'),
                    data.get('phone'),
                    data.get('manager_id', 'MGR01'),  # Mặc định MGR01
                    data.get('role'),
                    data.get('role_detail', '')
                ])
                
                # Lấy StaffID vừa tạo
                cursor.execute("SELECT @staff_id")
                staff_id = cursor.fetchone()[0]
            
            return Response({
                'message': 'Thêm nhân viên thành công!',
                'staff_id': staff_id,
                'name': data.get('name'),
                'role': data.get('role')
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': f'Lỗi khi thêm nhân viên: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['put', 'patch'])
    def update_staff(self, request, pk=None):
        """
        PUT /api/staff/{id}/update_staff/
        Cập nhật thông tin nhân viên bằng stored procedure sp_UpdateStaff
        
        Body: {
            "name": "Nguyễn Văn A",
            "phone": "0901234567",
            "status": "Working",  // Working, Retired, On Leave
            "role_detail": "10"  // Experience cho Chef, Education cho Cashier, Fluency cho Waiter
        }
        """
        staff = self.get_object()
        data = request.data
        
        try:
            with connection.cursor() as cursor:
                # Gọi stored procedure sp_UpdateStaff
                cursor.execute("""
                    CALL sp_UpdateStaff(
                        %s, %s, %s, %s, %s
                    )
                """, [
                    staff.staffid,
                    data.get('name', staff.fullname),
                    data.get('phone', staff.phone),
                    data.get('status', staff.status),
                    data.get('role_detail', '')
                ])
            
            return Response({
                'message': 'Cập nhật nhân viên thành công!',
                'staff_id': staff.staffid,
                'name': data.get('name', staff.fullname)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Lỗi khi cập nhật nhân viên: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        """
        DELETE /api/staff/{id}/
        Xóa nhân viên (kiểm tra ràng buộc trước)
        """
        staff = self.get_object()
        staff_id = staff.staffid
        
        try:
            # Kiểm tra ràng buộc với các bảng khác
            from django.db import connection
            
            with connection.cursor() as cursor:
                # Kiểm tra PTOrder
                cursor.execute("SELECT COUNT(*) FROM PTOrder WHERE PTStaffID = %s", [staff_id])
                if cursor.fetchone()[0] > 0:
                    return Response({
                        'error': 'Không thể xóa nhân viên đã tham gia xử lý đơn hàng!'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Kiểm tra Detail (Chef)
                cursor.execute("SELECT COUNT(*) FROM Detail WHERE DStaffID = %s", [staff_id])
                if cursor.fetchone()[0] > 0:
                    return Response({
                        'error': 'Không thể xóa đầu bếp đã tham gia chế biến món ăn!'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Kiểm tra Invoice (Cashier)
                cursor.execute("SELECT COUNT(*) FROM Invoice WHERE IStaffID = %s", [staff_id])
                if cursor.fetchone()[0] > 0:
                    return Response({
                        'error': 'Không thể xóa thu ngân đã tạo hóa đơn!'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Kiểm tra Payment (Cashier)
                cursor.execute("SELECT COUNT(*) FROM Payment WHERE PStaffID = %s", [staff_id])
                if cursor.fetchone()[0] > 0:
                    return Response({
                        'error': 'Không thể xóa thu ngân đã xử lý thanh toán!'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Nếu không có ràng buộc, xóa an toàn
            # Xóa từ Supervision trước
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM Supervision WHERE minor_StaffID = %s OR major_StaffID = %s", [staff_id, staff_id])
            
            # Xóa từ bảng con (Chef/Cashier/Waiter)
            Chef.objects.filter(staffid=staff_id).delete()
            Cashier.objects.filter(staffid=staff_id).delete()
            Waiter.objects.filter(staffid=staff_id).delete()
            
            # Xóa từ Staff
            staff.delete()
            
            return Response({
                'message': f'Đã xóa nhân viên {staff_id}'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            print(f"Error deleting staff: {str(e)}")
            print(traceback.format_exc())
            
            return Response({
                'error': f'Lỗi khi xóa nhân viên: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

class MaterialViewSet(viewsets.ModelViewSet):
    """
    API ViewSet cho Material (Nguyên liệu)
    Hỗ trợ sắp xếp bằng Raw SQL Query:
    - GET /api/materials/?sort_by=materialid&order=asc
    - GET /api/materials/?sort_by=quantity&order=desc
    """
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [AllowAny] # Should be IsManager in prod
    
    def list(self, request, *args, **kwargs):
        """
        Override list method để sử dụng Raw SQL Query cho sorting
        JOIN với QDMaterial và Item để hiển thị món ăn tương ứng
        """
        sort_by = request.query_params.get('sort_by', None)
        order = request.query_params.get('order', 'asc')
        
        # Validate sort_by parameter
        valid_sort_fields = ['materialid', 'quantity']
        if sort_by and sort_by not in valid_sort_fields:
            return Response(
                {'error': f'Invalid sort_by. Must be one of: {valid_sort_fields}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate order parameter
        if order.lower() not in ['asc', 'desc']:
            return Response(
                {'error': 'Invalid order. Must be asc or desc'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build raw SQL query with JOIN
        # JOIN 3 bảng: Material, QDMaterial, Item
        base_sql = """
            SELECT 
                m.MaterialID,
                m.name AS material_name,
                m.Quantity,
                GROUP_CONCAT(DISTINCT i.ItemID ORDER BY i.ItemID SEPARATOR ', ') AS item_ids,
                GROUP_CONCAT(DISTINCT i.Name ORDER BY i.ItemID SEPARATOR ', ') AS item_names
            FROM material m
            LEFT JOIN qdmaterial q ON m.MaterialID = q.QDMaterialID
            LEFT JOIN item i ON q.QDItemID = i.ItemID
            GROUP BY m.MaterialID, m.name, m.Quantity
        """
        
        if sort_by:
            # Thêm ORDER BY
            order_field = 'm.MaterialID' if sort_by == 'materialid' else 'm.Quantity'
            sql = base_sql + f" ORDER BY {order_field} {order.upper()}"
        else:
            sql = base_sql
        
        # Execute raw query
        with connection.cursor() as cursor:
            cursor.execute(sql)
            columns = [col[0] for col in cursor.description]
            results = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]
        
        # Convert to serializer format
        materials_data = []
        for row in results:
            materials_data.append({
                'materialid': row.get('MaterialID'),
                'name': row.get('material_name'),
                'quantity': row.get('Quantity'),
                'item_ids': row.get('item_ids') or '--',
                'item_names': row.get('item_names') or '--'
            })
        
        # Paginate if needed
        page = self.paginate_queryset(materials_data)
        if page is not None:
            return self.get_paginated_response(page)
        
        return Response(materials_data)

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login API: Trả về Access Token + Refresh Token + Role
    """
    serializer_class = CustomTokenObtainPairSerializer

class RevenueStatsView(viewsets.ViewSet):
    """
    API trả về doanh thu 7 ngày gần nhất
    GET /api/revenue/
    """
    permission_classes = [AllowAny]

    def list(self, request):
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=6)
        
        # Initialize revenue map for the last 7 days
        revenue_map = {}
        current = start_date
        while current <= end_date:
            revenue_map[current] = 0
            current += timedelta(days=1)

        # Get all paid orders in range
        # Note: Using Rorder instead of Payment because Payment records might not exist yet
        orders = Rorder.objects.filter(
            status='Paid',
            createdat__date__range=[start_date, end_date]
        )
        
        for order in orders:
            order_date = order.createdat.date()
            # Calculate total for this order from its details
            details = Detail.objects.filter(dorderid=order)
            order_total = 0
            for detail in details:
                if detail.ditemid and detail.ditemid.price:
                    order_total += (detail.quantity or 0) * detail.ditemid.price
            
            if order_date in revenue_map:
                revenue_map[order_date] += order_total
        
        # Format result
        result = []
        for date_key in sorted(revenue_map.keys()):
            result.append({
                'date': date_key.strftime('%d/%m'),
                'revenue': revenue_map[date_key]
            })
            
        return Response(result)