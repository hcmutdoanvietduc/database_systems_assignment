import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurantApp.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print("Tables in DB:")
    for table in tables:
        print(table[0])
