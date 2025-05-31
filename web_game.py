import http.server
import socketserver
import webbrowser
import os
import sys
import threading
import subprocess

# Set the port for the web server
PORT = 8000

# Get the directory of the script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# HTML template for the web page
HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RETRO TYPER</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: monospace;
            color: #55ffff;
        }
        
        #game-container {
            width: 640px;
            height: 480px;
            position: relative;
            border: 2px solid #55ffff;
            box-shadow: 0 0 20px rgba(85, 255, 255, 0.5);
            background-color: #14142a;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
        }
        
        h1 {
            margin-top: 100px;
        }
        
        button {
            background-color: #14142a;
            border: 2px solid #55ffff;
            color: #55ffff;
            padding: 10px 20px;
            font-family: monospace;
            font-size: 18px;
            cursor: pointer;
            margin-top: 40px;
        }
        
        button:hover {
            background-color: #55ffff;
            color: #14142a;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <h1>RETRO TYPER</h1>
        <p>Play the retro typing game in your browser!</p>
        <button id="play-button">PLAY GAME</button>
    </div>

    <script>
        document.getElementById('play-button').addEventListener('click', function() {
            fetch('/start-game')
                .then(response => {
                    if (response.ok) {
                        this.textContent = 'GAME STARTED';
                        this.disabled = true;
                    }
                })
                .catch(error => {
                    console.error('Error starting game:', error);
                });
        });
    </script>
</body>
</html>
"""

# Create a simple HTTP request handler
class GameHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SCRIPT_DIR, **kwargs)
    
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML_TEMPLATE.encode())
        elif self.path == '/start-game':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Game started')
            
            # Start the game in a separate process
            game_path = os.path.join(SCRIPT_DIR, 'main.py')
            if os.path.exists(game_path):
                subprocess.Popen([sys.executable, game_path])
        else:
            super().do_GET()
    
    def log_message(self, format, *args):
        # Suppress log messages
        pass

def start_server():
    with socketserver.TCPServer(("", PORT), GameHandler) as httpd:
        print(f"Web server started at http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever()

if __name__ == "__main__":
    # Start the server in a separate thread
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()
    
    # Open the web browser
    webbrowser.open(f"http://localhost:{PORT}")
    
    # Keep the main thread running
    try:
        while True:
            input()
    except KeyboardInterrupt:
        print("\nServer stopped")
        sys.exit(0)