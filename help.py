import boto3
import pymysql

print("--- Starting Application ---")

# ==========================================
# 1. Connect to DynamoDB (Get User Data)
# ==========================================
# (Note: Boto3 uses your AWS CLI credentials to connect automatically)
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1') # Change to your region
users_table = dynamodb.Table('Users')

# Fetch our test user
user_response = users_table.get_item(Key={'UserId': 'user-001'})
user_data = user_response.get('Item')


# ==========================================
# 2. Connect to RDS MySQL (Get Product Data)
# ==========================================
rds_conn = pymysql.connect(
    host='product-db1.clwa62q2kk6z.ap-south-1.rds.amazonaws.com', # Your endpoint
    user='admin',
    password='admin123', # Put your password here
    database='product-db1'
)

# Fetch our test product
with rds_conn.cursor() as cursor:
    cursor.execute("SELECT name, price FROM products WHERE product_id = 102")
    product_data = cursor.fetchone() # Fetches the Mechanical Keyboard


# ==========================================
# 3. Combine Them (The "Connection")
# ==========================================
print("\n--- Order Receipt ---")
print(f"Customer Email: {user_data['Email']}")
print(f"Item Purchased: {product_data[0]}")
print(f"Total Price:   ${product_data[1]}")
print("---------------------")

rds_conn.close()