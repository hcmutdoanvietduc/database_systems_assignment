from django.db import models

class Admin(models.Model):
    adminid = models.CharField(db_column='AdminID', primary_key=True, max_length=10)
    fullname = models.CharField(db_column='FullName', max_length=100)
    phone = models.CharField(db_column='Phone', unique=True, max_length=15, blank=True, null=True)
    email = models.CharField(db_column='Email', unique=True, max_length=100, blank=True, null=True)
    permission = models.CharField(db_column='Permission', max_length=50)

    class Meta:
        managed = False
        db_table = 'admin'


class Cashier(models.Model):
    staffid = models.OneToOneField('Staff', models.DO_NOTHING, db_column='StaffID', primary_key=True)
    education = models.CharField(db_column='Education', max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'cashier'


class Chef(models.Model):
    staffid = models.OneToOneField('Staff', models.DO_NOTHING, db_column='StaffID', primary_key=True)
    experience = models.IntegerField(db_column='Experience', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'chef'


class Customer(models.Model):
    customerid = models.CharField(db_column='CustomerID', primary_key=True, max_length=10)
    fullname = models.CharField(db_column='FullName', max_length=100)
    phone = models.CharField(db_column='Phone', unique=True, max_length=15, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'customer'


class Customerbill(models.Model):
    # Đã sửa: Xóa dòng CompositePrimaryKey, thêm primary_key=True vào ID
    customerbillid = models.AutoField(db_column='CustomerBillID', primary_key=True)
    hcustomerid = models.ForeignKey(Customer, models.DO_NOTHING, db_column='HCustomerID')

    class Meta:
        managed = False
        db_table = 'customerbill'


class Detail(models.Model):
    # Đã sửa: Xóa dòng CompositePrimaryKey, thêm primary_key=True vào ID
    detailid = models.AutoField(db_column='DetailID', primary_key=True)
    dorderid = models.ForeignKey('Rorder', models.DO_NOTHING, db_column='DOrderID')
    ditemid = models.ForeignKey('Item', models.DO_NOTHING, db_column='DItemID')
    dstaffid = models.ForeignKey(Chef, models.DO_NOTHING, db_column='DStaffID')
    quantity = models.IntegerField(db_column='Quantity', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'detail'


class Invoice(models.Model):
    invoiceid = models.CharField(db_column='InvoiceID', primary_key=True, max_length=10)
    datecreated = models.DateTimeField(db_column='DateCreated', blank=True, null=True)
    tax = models.DecimalField(db_column='Tax', max_digits=10, decimal_places=2, blank=True, null=True)
    istaffid = models.ForeignKey(Cashier, models.DO_NOTHING, db_column='IStaffID')
    customerid = models.ForeignKey(Customer, models.DO_NOTHING, db_column='CustomerID')

    class Meta:
        managed = False
        db_table = 'invoice'


class Item(models.Model):
    itemid = models.CharField(db_column='ItemID', primary_key=True, max_length=10)
    name = models.CharField(db_column='Name', max_length=100)
    price = models.DecimalField(db_column='Price', max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(db_column='Status', max_length=11, blank=True, null=True)
    superitemid = models.ForeignKey('self', models.DO_NOTHING, db_column='SuperItemID', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'item'


class Manager(models.Model):
    managerid = models.CharField(db_column='ManagerID', primary_key=True, max_length=10)
    fullname = models.CharField(db_column='FullName', max_length=100)
    phone = models.CharField(db_column='Phone', unique=True, max_length=15, blank=True, null=True)
    email = models.CharField(db_column='Email', unique=True, max_length=100, blank=True, null=True)
    madminid = models.ForeignKey(Admin, models.DO_NOTHING, db_column='MAdminID')
    permission = models.CharField(db_column='Permission', max_length=50)

    class Meta:
        managed = False
        db_table = 'manager'


class Material(models.Model):
    materialid = models.CharField(db_column='MaterialID', primary_key=True, max_length=10)
    quantity = models.IntegerField(db_column='Quantity', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'material'


class Payment(models.Model):
    paymentid = models.CharField(db_column='PaymentID', primary_key=True, max_length=10)
    amount = models.DecimalField(db_column='Amount', max_digits=10, decimal_places=2, blank=True, null=True)
    paydate = models.DateTimeField(db_column='PayDate', blank=True, null=True)
    method = models.CharField(db_column='Method', max_length=8, blank=True, null=True)
    status = models.CharField(db_column='Status', max_length=7, blank=True, null=True)
    pinvoiceid = models.OneToOneField(Invoice, models.DO_NOTHING, db_column='PInvoiceID', blank=True, null=True)
    pstaffid = models.ForeignKey(Cashier, models.DO_NOTHING, db_column='PStaffID')

    class Meta:
        managed = False
        db_table = 'payment'


class Promotion(models.Model):
    promoid = models.CharField(db_column='PromoID', primary_key=True, max_length=10)
    description = models.CharField(db_column='Description', max_length=255, blank=True, null=True)
    minvalue = models.DecimalField(db_column='MinValue', max_digits=10, decimal_places=2, blank=True, null=True)
    expiredate = models.DateField(db_column='ExpireDate', blank=True, null=True)
    discountpercent = models.DecimalField(db_column='DiscountPercent', max_digits=5, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'promotion'


class Ptorder(models.Model):
    ptorderid = models.OneToOneField('Rorder', models.DO_NOTHING, db_column='PTOrderID', primary_key=True)
    ptstaffid = models.ForeignKey('Staff', models.DO_NOTHING, db_column='PTStaffID')
    ptcustomerid = models.ForeignKey(Customer, models.DO_NOTHING, db_column='PTCustomerID')

    class Meta:
        managed = False
        db_table = 'ptorder'


class Qdmaterial(models.Model):
    # Đã sửa: Xóa CompositePrimaryKey, chọn qdmaterialid làm khóa chính giả
    qdmaterialid = models.ForeignKey(Material, models.DO_NOTHING, db_column='QDMaterialID', primary_key=True)
    qditemid = models.ForeignKey(Item, models.DO_NOTHING, db_column='QDItemID')
    qdmanagerid = models.ForeignKey(Manager, models.DO_NOTHING, db_column='QDManagerID')

    class Meta:
        managed = False
        db_table = 'qdmaterial'


class Rorder(models.Model):
    orderid = models.CharField(db_column='OrderID', primary_key=True, max_length=10)
    createdat = models.DateTimeField(db_column='CreatedAt', blank=True, null=True)
    status = models.CharField(db_column='Status', max_length=9, blank=True, null=True)
    quantity = models.IntegerField(db_column='Quantity', blank=True, null=True)
    otableid = models.ForeignKey('Rtable', models.DO_NOTHING, db_column='OTableID')

    class Meta:
        managed = False
        db_table = 'rorder'


class Rtable(models.Model):
    tableid = models.IntegerField(db_column='TableID', primary_key=True)
    tablenumber = models.IntegerField(db_column='TableNumber')
    area = models.CharField(db_column='Area', max_length=50, blank=True, null=True)
    status = models.CharField(db_column='Status', max_length=9, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'rtable'


class Staff(models.Model):
    staffid = models.CharField(db_column='StaffID', primary_key=True, max_length=10)
    fullname = models.CharField(db_column='FullName', max_length=100)
    phone = models.CharField(db_column='Phone', unique=True, max_length=15, blank=True, null=True)
    status = models.CharField(db_column='Status', max_length=8, blank=True, null=True)
    smanagerid = models.ForeignKey(Manager, models.DO_NOTHING, db_column='SManagerID')

    class Meta:
        managed = False
        db_table = 'staff'


class Supervision(models.Model):
    # Đã sửa: Xóa CompositePrimaryKey, chọn minor_staffid làm khóa chính giả
    minor_staffid = models.ForeignKey(Staff, models.DO_NOTHING, db_column='minor_StaffID', primary_key=True)
    major_staffid = models.ForeignKey(Staff, models.DO_NOTHING, db_column='major_StaffID', related_name='supervision_major_staffid_set')

    class Meta:
        managed = False
        db_table = 'supervision'


class Waiter(models.Model):
    staffid = models.OneToOneField(Staff, models.DO_NOTHING, db_column='StaffID', primary_key=True)
    fluency = models.CharField(db_column='Fluency', max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'waiter'


class Ypromo(models.Model):
    # Đã sửa: Xóa CompositePrimaryKey, chọn ypromoid làm khóa chính giả
    ypromoid = models.ForeignKey(Promotion, models.DO_NOTHING, db_column='YPromoID', primary_key=True)
    yinvoiceid = models.ForeignKey(Invoice, models.DO_NOTHING, db_column='YInvoiceID')
    yorderid = models.ForeignKey(Rorder, models.DO_NOTHING, db_column='YOrderID')

    class Meta:
        managed = False
        db_table = 'ypromo'