import psycopg2
from tabulate import tabulate

# Database configuration
DB_CONFIG = {
    "dbname": "hes_db",
    "user": "hes_user",
    "password": "hes_password",
    "host": "localhost",
    "port": "5433"
}

def check_table_structure(table_name):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Get column information
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position;
        """, (table_name,))
        
        columns = cursor.fetchall()
        
        print(f"\nStructure of {table_name} table:")
        print(tabulate(columns, headers=['Column Name', 'Data Type', 'Nullable'], tablefmt='grid'))
        
        # Get a sample of data
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 1")
        sample = cursor.fetchone()
        if sample:
            print(f"\nSample data from {table_name}:")
            column_names = [desc[0] for desc in cursor.description]
            print(tabulate([sample], headers=column_names, tablefmt='grid'))
        
    except psycopg2.Error as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("Checking table structures...")
    check_table_structure('meters')
    check_table_structure('meter_readings') 