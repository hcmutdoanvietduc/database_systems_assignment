import random
import string
from datetime import datetime

def generate_id(prefix='ORD'):
    # giới hạn 10 ký tự.
    # Prefix(3) + PhútGiây(4) + 3 ký tự ngẫu nhiên = 10 ký tự
    # Ví dụ: ORD3059ABC
    
    time_part = datetime.now().strftime('%M%S') # Lấy Phút và Giây (4 số)
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=3)) # 3 ký tự ngẫu nhiên
    
    return f"{prefix}{time_part}{random_part}"