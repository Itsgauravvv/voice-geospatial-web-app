from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/static/data/<path:filename>')
def serve_data(filename):
    """Serve data files"""
    return send_from_directory(os.path.join(app.static_folder, 'data'), filename)

if __name__ == '__main__':
    app.run(host = 'localhost' , port = 5000 , debug=True , ssl_context='adhoc')