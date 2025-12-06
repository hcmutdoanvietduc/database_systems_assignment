from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from backend.core.models import UserProfile, Admin, Manager, Staff

class Command(BaseCommand):
    help = 'Initialize authentication data and sync with legacy tables'

    def handle(self, *args, **kwargs):
        self.sync_super_manager()
        self.sync_staff()
        self.sync_managers()

    def sync_super_manager(self):
        # 1. Special Case: sManager -> Admin(AD01)
        try:
            super_admin = Admin.objects.get(adminid='AD01')
            # Check if user exists
            if not User.objects.filter(username='sManager').exists():
                user = User(username='sManager', is_superuser=True, is_staff=True, last_login=timezone.now())
                user.set_password('123456')
                user.save()
                self.stdout.write(self.style.SUCCESS('Created superuser: sManager'))
            else:
                user = User.objects.get(username='sManager')
            
            # Link Profile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = 'Manager'
            profile.admin_profile = super_admin
            profile.save()
            self.stdout.write(self.style.SUCCESS(f"Linked sManager to Admin {super_admin.fullname} (AD01)"))

        except Admin.DoesNotExist:
            self.stdout.write(self.style.WARNING("Admin AD01 not found! Skipping sManager link."))

    def sync_staff(self):
        # 2. Sync Staff -> User (username = StaffID)
        staffs = Staff.objects.all()
        for staff in staffs:
            if not User.objects.filter(username=staff.staffid).exists():
                user = User(username=staff.staffid, last_login=timezone.now())
                user.set_password('123456')
                user.save()
                profile = UserProfile.objects.create(user=user, role='Staff', staff_profile=staff)
                self.stdout.write(f"Created User for Staff: {staff.fullname} ({staff.staffid})")

    def sync_managers(self):
        # 3. Sync Managers -> User (username = ManagerID)
        managers = Manager.objects.all()
        for mgr in managers:
            if not User.objects.filter(username=mgr.managerid).exists():
                user = User(username=mgr.managerid, last_login=timezone.now())
                user.set_password('123456')
                user.save()
                profile = UserProfile.objects.create(user=user, role='Manager', manager_profile=mgr)
                self.stdout.write(f"Created User for Manager: {mgr.fullname} ({mgr.managerid})")
