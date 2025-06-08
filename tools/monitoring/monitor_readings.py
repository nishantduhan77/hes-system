import psycopg2
import time
from datetime import datetime

# Database configuration
DB_CONFIG = {
    "dbname": "hes_db",
    "user": "hes_user",
    "password": "hes_password",
    "host": "localhost",
    "port": "5433"
}

def connect_db():
    try:
        return psycopg2.connect(**DB_CONFIG)
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        return None

def monitor_readings():
    print("Connecting to database...")
    conn = connect_db()
    if not conn:
        print("Could not connect to database. Please check your configuration.")
        return
    
    cursor = conn.cursor()
    last_count = 0
    
    try:
        while True:
            try:
                # Get total count and latest reading
                cursor.execute("""
                    SELECT 
                        (SELECT COUNT(*) FROM meter_readings),
                        m.meter_code,
                        mr.active_power_import,
                        mr.reading_timestamp
                    FROM meter_readings mr
                    JOIN meters m ON m.meter_id = mr.meter_id
                    ORDER BY mr.reading_timestamp DESC
                    LIMIT 1
                """)
                result = cursor.fetchone()
                if result:
                    current_count, meter_code, power, timestamp = result
                    new_readings = current_count - last_count
                    
                    print(f"\nTimestamp: {datetime.now().strftime('%H:%M:%S')}")
                    print(f"Total readings: {current_count}")
                    print(f"New readings in last 5s: {new_readings}")
                    print(f"Latest reading: Meter {meter_code}, Power: {power:.2f}W at {timestamp}")
                    
                    last_count = current_count
                
                conn.commit()
                time.sleep(5)
                
            except psycopg2.Error as e:
                print(f"\nDatabase error: {e}")
                conn = connect_db()
                if conn:
                    cursor = conn.cursor()
                time.sleep(5)
                
    except KeyboardInterrupt:
        print("\nMonitoring stopped.")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    try:
        monitor_readings()
    except Exception as e:
        print(f"Error: {e}") 