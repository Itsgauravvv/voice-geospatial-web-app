# Voice-Geospatial Web Application

Presenting LARYNX, which is our voice-enabled geospatial web app transforms map interactions with hands-free navigation, real-time insights, and AI-powered automation. Along with existing features like real-time traffic updates, multi-modal transport navigation, and AI-powered satellite views, we introduce cutting-edge capabilities: real-time footfall estimation, parking slot availability, weather forecasting, dynamic hotspot detection, hotel availability, and instant accident alerts to emergency helplines. By integrating on-device speech processing and intelligent GIS mapping, we ensure a seamless, secure, and accessible geospatial experience for smart cities and everyday users.

## Features

- **Voice Commands:** Navigate and interact with maps using natural language.
- **Geospatial Data Visualization:** Display interactive maps with various geospatial layers.
- **Real-Time Interaction:** Perform geospatial queries and receive immediate visual feedback.

## Prerequisites
- **npm:** Version 6 or higher.
- **Python:** Version 3.6 or higher.
- **pip:** Python package installer.

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/Itsgauravvv/voice-geospatial-web-app.git
   cd voice-geospatial-web-app
   ```

## Usage

1. **Start the Backend Server:**

   ```bash
   python app.py
   ```

2. **Access the Application:**

   Open your web browser and navigate to `https://localhost:5000` to interact with the application.

## Project Structure

```
voice-geospatial-web-app/
├── static/
│   ├── data/
│   │   └── places_data.js
│   │   └── worldcities.csv       # Stylesheet for the application
│   ├── js/
│       └── main.js
│       └── places-integration.js           # Main JavaScript file for the application
├── templates/
│    ├── index.html          # Main HTML file for the application
├── app.py
```

## Additional Information
- **Backend Server:** The Python-based server manages voice command processing and facilitates communication between the frontend and backend components.

For more details, please refer to the original repository: [https://github.com/Itsgauravvv/voice-geospatial-web-app](https://github.com/Itsgauravvv/voice-geospatial-web-app)
