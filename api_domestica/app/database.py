import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "my_sample_db") 
DB_USER = os.getenv("DB_USER", "sample_user")  
DB_PASSWORD = os.getenv("DB_PASSWORD", "sample_password") 

def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    return conn

# Como ainda nao foi implementado o sqlalchemy o banco tem que seguir extritamente esse modelo p funcionar
# criar as seguintes tabelas:
# usuarios (id, nome)
# items (id, nome_item)

def fetch_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome FROM usuarios;")
    users = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    conn.close()
    return [dict(zip(columns, row)) for row in users]

def fetch_items():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome_item FROM items;")
    items = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    conn.close()
    return [dict(zip(columns, row)) for row in items]
