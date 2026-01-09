from flask import Flask, jsonify, request, send_from_directory
import sqlite3
import threading
import time
import random
import os

app = Flask(__name__, static_folder='.')
DB_NAME = 'freshstock.db'

# Helper to get DB connection
def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row # Access columns by name
    return conn

# --- Routes ---

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    return "File not found", 404

# API: Get All Items
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM inventory")
        items = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(items)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API: Add Item
@app.route('/api/inventory', methods=['POST'])
def add_item():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "INSERT INTO inventory (name, category, price, stock, added, img) VALUES (?, ?, ?, ?, ?, ?)"
        # Default image if not provided
        img = data.get('img', 'https://via.placeholder.com/200?text=Product')
        
        cursor.execute(query, (data['name'], data['category'], data['price'], data['stock'], data['added'], img))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': new_id, 'message': 'Item added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API: Update Item
@app.route('/api/inventory/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # We can update price, stock, category
        query = "UPDATE inventory SET price = ?, stock = ?, category = ? WHERE id = ?"
        cursor.execute(query, (data['price'], data['stock'], data['category'], item_id))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Item updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API: Delete Item
@app.route('/api/inventory/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM inventory WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Item deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- Market Simulation Thread ---
def market_simulation():
    """
    Simulates real-time market fluctuations.
    Every 10 seconds, it randomly changes prices of random products by +- 5%.
    """
    print("Market Simulation Started...")
    while True:
        try:
            time.sleep(10) # Update every 10 seconds
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Select random items
            cursor.execute("SELECT id, price, name FROM inventory ORDER BY RANDOM() LIMIT 5")
            items = cursor.fetchall()
            
            for row in items:
                item_id, price, name = row['id'], row['price'], row['name']
                # Fluctuate by -5% to +5%
                change_percent = random.uniform(-0.05, 0.05)
                new_price = float(price) * (1 + change_percent)
                new_price = round(max(10.0, new_price), 2) # Ensure price doesn't go below 10
                
                cursor.execute("UPDATE inventory SET price = ? WHERE id = ?", (new_price, item_id))
                print(f"[Market Update] {name} changed from ₹{price} to ₹{new_price}")
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"Simulation Error: {e}")

# Start background thread
simulation_thread = threading.Thread(target=market_simulation, daemon=True)
simulation_thread.start()

if __name__ == '__main__':
    print("Starting Flask Server with SQLite Integration...")
    app.run(port=5000, debug=True, use_reloader=False) 
    # use_reloader=False prevents double execution of the simulation thread during debug
