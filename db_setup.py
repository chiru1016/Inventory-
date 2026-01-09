import sqlite3

DB_NAME = 'freshstock.db'

def create_database():
    try:
        # Connect to SQLite (creates file if not exists)
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        # Create Table
        table_query = """
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            added TEXT NOT NULL,
            img TEXT
        )
        """
        cursor.execute(table_query)
        print("Table 'inventory' created or already exists.")

        # Check if empty
        cursor.execute("SELECT COUNT(*) FROM inventory")
        count = cursor.fetchone()[0]
        
        if count == 0:
            print("Populating initial data...")
            initial_data = [
                ('Apple', 'Fruits', 120.50, 50, '2023-10-01', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200'),
                ('Milk', 'Dairy', 65.00, 20, '2023-10-02', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200'),
                ('Carrot', 'Vegetables', 40.00, 100, '2023-10-03', 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=200')
            ]
            cursor.executemany("""
                INSERT INTO inventory (name, category, price, stock, added, img)
                VALUES (?, ?, ?, ?, ?, ?)
            """, initial_data)
            conn.commit()
            print("Initial data added.")

        conn.close()
        print(f"Database '{DB_NAME}' setup completed successfully!")

    except Exception as err:
        print(f"Error: {err}")

if __name__ == "__main__":
    create_database()
