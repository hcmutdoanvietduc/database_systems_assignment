from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from .models import Rtable, Rorder, Detail, Item, Staff, Chef
from .utils import generate_id

# --- 1. Trang Chủ ---
def home(request):
    return render(request, 'core/home.html')

# --- 2. Trang Thực Đơn (Chỉ xem) ---
def menu_list(request):
    # Lấy các món ăn (loại bỏ danh mục cha có giá 0)
    items = Item.objects.filter(status='Available', superitemid__isnull=False)
    return render(request, 'core/menu.html', {'mon_an': items})

# --- 3. Danh sách bàn ---
def table_list(request):
    tables = Rtable.objects.all().order_by('tablenumber')
    return render(request, 'core/table_list.html', {'tables': tables})

# --- 4. Chi tiết bàn & Gọi món ---
def table_detail(request, table_id):
    table = get_object_or_404(Rtable, tableid=table_id)
    
    # Tìm đơn hàng đang phục vụ
    current_order = Rorder.objects.filter(otableid=table, status='Serving').first()
    
    order_details = []
    total_price = 0
    
    if current_order:
        details = Detail.objects.filter(dorderid=current_order)
        for d in details:
            item = d.ditemid 
            
            # --- QUAY VỀ LOGIC CŨ: Lấy giá hiện tại của món ăn ---
            price = item.price 
            
            subtotal = d.quantity * price
            total_price += subtotal
            
            order_details.append({
                'item_name': item.name,
                'quantity': d.quantity,
                'price': price,
                'subtotal': subtotal
            })
            
    # Lấy danh sách món để gọi (Lọc bỏ danh mục 0đ)
    menu_items = Item.objects.filter(status='Available', superitemid__isnull=False)
    
    context = {
        'table': table,
        'order': current_order,
        'order_details': order_details,
        'total_price': total_price,
        'menu_items': menu_items,
    }
    return render(request, 'core/table_detail.html', context)

# --- 5. Xử lý thêm món ---
def add_item(request, table_id, item_id):
    table = get_object_or_404(Rtable, tableid=table_id)
    item = get_object_or_404(Item, itemid=item_id)
    
    # 1. Kiểm tra đơn hàng
    order = Rorder.objects.filter(otableid=table, status='Serving').first()
    
    if not order:
        table.status = 'Occupied'
        table.save()
        
        order = Rorder.objects.create(
            orderid=generate_id('ORD'), # Đã fix lỗi độ dài ID trong utils.py
            createdat=timezone.now(),
            status='Serving',
            quantity=0,
            otableid=table
        )
    
    # 2. Lấy đầu bếp (Demo)
    default_chef = Chef.objects.first() 
    
    # 3. Thêm/Cập nhật món vào Detail
    existing_detail = Detail.objects.filter(dorderid=order, ditemid=item).first()
    
    if existing_detail:
        existing_detail.quantity += 1
        existing_detail.save()
    else:
        # --- ĐÃ XÓA 'unitprice' ĐỂ KHÔNG BỊ LỖI ---
        Detail.objects.create(
            dorderid=order,
            ditemid=item,
            dstaffid=default_chef, 
            quantity=1
        )
    
    # Cập nhật tổng số lượng
    order.quantity = (order.quantity or 0) + 1
    order.save()
    
    return redirect('table_detail', table_id=table.tableid)