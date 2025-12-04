import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurantApp.settings')
django.setup()

def load_sql_file(filename):
    print(f"Loading {filename}...")
    with open(filename, 'r') as f:
        sql_content = f.read()
    
    # Split by semicolon, but be careful about semicolons inside strings.
    # For simplicity, let's assume standard SQL dump format.
    # Actually, executing the whole script might work if the driver supports it, 
    # but usually it doesn't.
    # Better approach: use 'mysql' command line if possible, but it failed.
    # Let's try to execute statement by statement.
    
    statements = sql_content.split(';')
    
    with connection.cursor() as cursor:
        for statement in statements:
            if statement.strip():
                try:
                    cursor.execute(statement)
                except Exception as e:
                    print(f"Error executing statement: {statement[:50]}... -> {e}")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    load_sql_file(os.path.join(base_dir, 'backend/mysql_code/table_and_data.sql'))
    load_sql_file(os.path.join(base_dir, 'backend/mysql_code/store_and_funcs.sql'))
    print("Done.")
