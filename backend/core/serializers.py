from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Item, Rtable, Rorder, Detail, Customer, Invoice, 
    Payment, Promotion, Staff, Chef, Cashier, Waiter, Material
)

# ==================== ITEM SERIALIZER ====================
class ItemSerializer(serializers.ModelSerializer):
    """
    Serializer cho Item (Món ăn)
    - Chuyển Item Django Model thành JSON
    - Khi GET /api/items/: Trả về danh sách món dưới dạng JSON
    """
    class Meta:
        model = Item
        fields = ['itemid', 'name', 'price', 'status', 'imageurl', 'superitemid']
        read_only_fields = ['itemid']


# ==================== DETAIL SERIALIZER ====================
class DetailSerializer(serializers.ModelSerializer):
    """
    Serializer cho Detail (Chi tiết món trong đơn hàng)
    - Lưu ý: ditemid là Foreign Key đến Item
    """
    ditemid = ItemSerializer(read_only=True)  # Lấy toàn bộ thông tin Item
    ditemid_id = serializers.CharField(write_only=True)  # Khi POST, gửi ID thôi
    
    class Meta:
        model = Detail
        fields = ['detailid', 'dorderid', 'ditemid', 'ditemid_id', 'dstaffid', 'quantity']
        read_only_fields = ['detailid', 'dorderid']


# ==================== ORDER SERIALIZER ====================
class OrderDetailSerializer(serializers.ModelSerializer):
    """
    Serializer chi tiết cho Order - bao gồm tất cả Detail của order
    """
    details = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Rorder
        fields = ['orderid', 'createdat', 'status', 'quantity', 'otableid', 'details', 'total_price']
    
    def get_details(self, obj):
        """Lấy tất cả Detail liên quan đến Order này"""
        details = Detail.objects.filter(dorderid=obj)
        return DetailSerializer(details, many=True).data
    
    def get_total_price(self, obj):
        """Tính tổng tiền của Order"""
        details = Detail.objects.filter(dorderid=obj)
        total = 0
        for detail in details:
            total += detail.quantity * detail.ditemid.price
        return total


class OrderSerializer(serializers.ModelSerializer):
    """Serializer đơn giản cho Order"""
    class Meta:
        model = Rorder
        fields = ['orderid', 'createdat', 'status', 'quantity', 'otableid']
        read_only_fields = ['orderid']


# ==================== TABLE SERIALIZER ====================
class TableSerializer(serializers.ModelSerializer):
    """
    Serializer cho Rtable (Bàn)
    - Hiển thị thông tin bàn + trạng thái
    """
    current_order = serializers.SerializerMethodField()
    
    class Meta:
        model = Rtable
        fields = ['tableid', 'tablenumber', 'area', 'status', 'current_order']
    
    def get_current_order(self, obj):
        """Lấy order đang phục vụ (nếu có)"""
        order = Rorder.objects.filter(otableid=obj, status='Serving').first()
        if order:
            return OrderDetailSerializer(order).data
        return None


# ==================== CUSTOMER SERIALIZER ====================
class CustomerSerializer(serializers.ModelSerializer):
    """Serializer cho Customer (Khách hàng)"""
    class Meta:
        model = Customer
        fields = ['customerid', 'fullname', 'phone']
        read_only_fields = ['customerid']


# ==================== INVOICE SERIALIZER ====================
class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer cho Invoice (Hóa đơn)"""
    class Meta:
        model = Invoice
        fields = ['invoiceid', 'datecreated', 'tax', 'istaffid', 'customerid']
        read_only_fields = ['invoiceid']


# ==================== PAYMENT SERIALIZER ====================
class PaymentSerializer(serializers.ModelSerializer):
    """Serializer cho Payment (Thanh toán)"""
    class Meta:
        model = Payment
        fields = ['paymentid', 'amount', 'paydate', 'method', 'status', 'pinvoiceid', 'pstaffid']
        read_only_fields = ['paymentid']


# ==================== PROMOTION SERIALIZER ====================
class PromotionSerializer(serializers.ModelSerializer):
    """Serializer cho Promotion (Khuyến mãi)"""
    class Meta:
        model = Promotion
        fields = ['promoid', 'description', 'minvalue', 'expiredate', 'discountpercent']
        read_only_fields = ['promoid']


# ==================== STAFF SERIALIZER ====================
class StaffSerializer(serializers.ModelSerializer):
    """Serializer cho Staff (Nhân viên)"""
    class Meta:
        model = Staff
        fields = ['staffid', 'fullname', 'phone', 'status', 'smanagerid']
        read_only_fields = ['staffid']


# ==================== CHEF SERIALIZER ====================
class ChefSerializer(serializers.ModelSerializer):
    """Serializer cho Chef (Đầu bếp)"""
    staffid = StaffSerializer(read_only=True)
    
    class Meta:
        model = Chef
        fields = ['staffid', 'experience']


# ==================== CASHIER SERIALIZER ====================
class CashierSerializer(serializers.ModelSerializer):
    """Serializer cho Cashier (Thu ngân)"""
    staffid = StaffSerializer(read_only=True)
    
    class Meta:
        model = Cashier
        fields = ['staffid', 'education']


# ==================== WAITER SERIALIZER ====================
class WaiterSerializer(serializers.ModelSerializer):
    """Serializer cho Waiter (Phục vụ)"""
    staffid = StaffSerializer(read_only=True)
    
    class Meta:
        model = Waiter
        fields = ['staffid', 'fluency']

# ==================== MATERIAL SERIALIZER ====================
class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['materialid','name', 'quantity']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add custom claims
        data['username'] = self.user.username
        data['role'] = 'Staff' # Default
        data['fullname'] = '' # Default

        if hasattr(self.user, 'profile'):
            data['role'] = self.user.profile.role
            data['fullname'] = self.user.profile.full_name
        elif self.user.is_superuser:
            data['role'] = 'Manager'
            data['fullname'] = 'Super Admin'
            
        return data

