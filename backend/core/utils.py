import random
import string
from datetime import datetime

def generate_id(prefix='ORD'):
    # giới hạn 10 ký tự.
    
    time_part = datetime.now().strftime('%M%S') 
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=3)) 
    
    return f"{prefix}{time_part}{random_part}"