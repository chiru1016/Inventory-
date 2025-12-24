import http.server
import socketserver
import os
import sys
import socket

# Configuration
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def check_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def run_server():
    # Change to the directory of the script to ensure we serve the correct files
    os.chdir(DIRECTORY)
    
    # Try PORT, if in use, try next few ports
    target_port = PORT
    while check_port_in_use(target_port):
        print(f"Port {target_port} is already in use.")
        target_port += 1
        if target_port > PORT + 10:
            print("Could not find a free port.")
            return

    # Helper to support older Python versions where 'directory' arg might not exist
    class Handler(http.server.SimpleHTTPRequestHandler):
        pass

    try:
        # standard allow_reuse_address is on the class in standard library
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("", target_port), Handler) as httpd:
            print("="*40)
            print(f"Server started successfully!")
            print(f"Serving directory: {DIRECTORY}")
            print(f"Access the app at: http://localhost:{target_port}")
            print("="*40)
            print("Press Ctrl+C to stop the server.")
            httpd.serve_forever()
    except Exception as e:
        print(f"Error starting server: {e}")
    except KeyboardInterrupt:
        print("\nServer stopped by user.")

if __name__ == "__main__":
    if sys.version_info < (3, 0):
        print("This script requires Python 3.x")
    else:
        run_server()
