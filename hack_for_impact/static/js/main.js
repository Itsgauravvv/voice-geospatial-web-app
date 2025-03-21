// Global variables
let map;
let directionsService;
let directionsRenderer;
let placesService;
let geocoder;
let markers = [];
let userMarker = null;
let startMarker = null;
let endMarker = null;
let currentCommand = null;
let awaitingResponse = false;
let userLocation = null;
let worldCities = [];

// Initialize locations database
let locationsDatabase = {
    'delhi': { lat: 28.7041, lng: 77.1025 },
    'new delhi': { lat: 28.6139, lng: 77.2090 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'karol bagh': { lat: 28.6519, lng: 77.1909 },
    'connaught place': { lat: 28.6304, lng: 77.2167 },
    'india gate': { lat: 28.6129, lng: 77.2295 },
    'faridabad': { lat: 28.4089, lng: 77.3152 },
    'gurgaon': { lat: 28.4595, lng: 77.0266 },
    'noida': { lat: 28.5355, lng: 77.3910 },
    'badarpur': { lat: 28.5039, lng: 77.3008 }
};

function loadWorldCitiesData() {
    try {
        debug("Loading world cities dataset...");
        
        // Use fetch to load the CSV file
        fetch('/static/data/worldcities.csv')
            .then(response => response.text())
            .then(csvData => {
                // Parse the CSV data
                const lines = csvData.split('\n');
                const headers = lines[0].split(',');
                
                // Find the indices of important columns
                const cityIndex = headers.indexOf('city');
                const cityAsciiIndex = headers.indexOf('city_ascii');
                const latIndex = headers.indexOf('lat');
                const lngIndex = headers.indexOf('lng');
                const countryIndex = headers.indexOf('country');
                const adminNameIndex = headers.indexOf('admin_name');
                const populationIndex = headers.indexOf('population');
                
                // Process each line (skipping the header)
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue; // Skip empty lines
                    
                    // Parse the CSV line, handling quoted values properly
                    const values = parseCSVLine(lines[i]);
                    
                    // Add to our cities database if we have valid coordinates
                    if (values[latIndex] && values[lngIndex]) {
                        worldCities.push({
                            city: values[cityIndex],
                            cityAscii: values[cityAsciiIndex],
                            lat: parseFloat(values[latIndex]),
                            lng: parseFloat(values[lngIndex]),
                            country: values[countryIndex],
                            adminName: values[adminNameIndex],
                            population: values[populationIndex] ? parseFloat(values[populationIndex]) : 0
                        });
                    }
                }
                
                debug(`Loaded ${worldCities.length} cities from dataset`);
                
                // Create a searchable index for important cities
                worldCities.forEach(city => {
                    // Add major cities (population > 100,000) to our locations database
                    if (city.population > 100000) {
                        locationsDatabase[city.city.toLowerCase()] = {
                            lat: city.lat,
                            lng: city.lng
                        };
                        
                        // Also index by city_ascii for better matching
                        if (city.cityAscii && city.cityAscii.toLowerCase() !== city.city.toLowerCase()) {
                            locationsDatabase[city.cityAscii.toLowerCase()] = {
                                lat: city.lat,
                                lng: city.lng
                            };
                        }
                    }
                });
                
                debug("Cities dataset integrated into search system");
            })
            .catch(error => {
                debug(`Error loading cities dataset: ${error.message}`);
            });
    } catch (e) {
        debug(`Error in loadWorldCitiesData: ${e.message}`);
    }
}

// Helper function to parse CSV lines correctly (handling quotes)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // Don't forget to add the last field
    result.push(current);
    
    return result;
}

// Update the searchLocation function to use the world cities dataset
function searchLocation(query, callback) {
    try {
        debug(`Searching for location: ${query}`);
        
        // First check our database of already known locations
        const lowerQuery = query.toLowerCase();
        for (const locName in locationsDatabase) {
            if (lowerQuery.includes(locName)) {
                debug(`Found location in database: ${locName}`);
                callback({
                    name: locName,
                    coords: locationsDatabase[locName],
                    source: 'database'
                });
                return;
            }
        }
        
        // Next, try a more flexible search in our world cities dataset
        const searchWords = lowerQuery.split(/\s+/);
        let bestMatch = null;
        let bestScore = 0;
        
        for (const city of worldCities) {
            // Skip cities with no population data
            if (!city.population) continue;
            
            // Calculate a score based on how many words match
            let score = 0;
            const cityName = city.city.toLowerCase();
            const cityAscii = city.cityAscii ? city.cityAscii.toLowerCase() : '';
            const adminName = city.adminName ? city.adminName.toLowerCase() : '';
            const country = city.country ? city.country.toLowerCase() : '';
            
            for (const word of searchWords) {
                if (word.length < 3) continue; // Skip short words
                
                if (cityName.includes(word) || cityAscii.includes(word)) {
                    score += 3; // City name matches are highly valuable
                } else if (adminName.includes(word)) {
                    score += 2; // Admin name matches are valuable
                } else if (country.includes(word)) {
                    score += 1; // Country matches are somewhat valuable
                }
            }
            
            // Boost score for population size (favor bigger cities)
            if (city.population > 1000000) score *= 1.5;
            else if (city.population > 500000) score *= 1.3;
            else if (city.population > 100000) score *= 1.1;
            
            // Keep track of the best match
            if (score > bestScore) {
                bestScore = score;
                bestMatch = city;
            }
        }
        
        // If we found a good match in the dataset, return it
        if (bestMatch && bestScore >= 3) {
            const name = bestMatch.city;
            const coords = { lat: bestMatch.lat, lng: bestMatch.lng };
            
            // Add to local database for future use
            locationsDatabase[name.toLowerCase()] = coords;
            
            debug(`Found location in world cities dataset: ${name}`);
            callback({
                name: name,
                coords: coords,
                source: 'worldcities'
            });
            return;
        }
        
        // If we still haven't found it, use Google Places API
        const request = {
            query: query,
            fields: ['name', 'geometry']
        };
        
        placesService.findPlaceFromQuery(request, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
                const result = results[0];
                const coords = {
                    lat: result.geometry.location.lat(),
                    lng: result.geometry.location.lng()
                };
                
                // Add to local database for future use
                locationsDatabase[result.name.toLowerCase()] = coords;
                
                callback({
                    name: result.name,
                    coords: coords,
                    source: 'places'
                });
            } else {
                // Try geocoding as a backup
                geocoder.geocode({ 'address': query }, function(results, status) {
                    if (status === 'OK' && results[0]) {
                        const coords = {
                            lat: results[0].geometry.location.lat(),
                            lng: results[0].geometry.location.lng()
                        };
                        
                        // Get a readable name
                        let name = query;
                        if (results[0].address_components && results[0].address_components[0]) {
                            name = results[0].address_components[0].long_name;
                        }
                        
                        // Add to local database for future use
                        locationsDatabase[name.toLowerCase()] = coords;
                        
                        callback({
                            name: name,
                            coords: coords,
                            source: 'geocoding'
                        });
                    } else {
                        debug(`Geocoding failed: ${status}`);
                        callback(null);
                    }
                });
            }
        });
    } catch (e) {
        debug(`Error searching for location: ${e.message}`);
        callback(null);
    }
}

// Debug function
function debug(message) {
    const debugDiv = document.getElementById('debug');
    debugDiv.innerHTML += '<br>' + message;
    console.log(message);
    
    // Scroll to bottom of debug panel
    debugDiv.scrollTop = debugDiv.scrollHeight;
}

// Create dialog functions
function showDialog(title, content, onConfirm, onCancel) {
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-content').textContent = content;
    
    const overlay = document.getElementById('dialog-overlay');
    const confirmBtn = document.getElementById('dialog-confirm');
    const cancelBtn = document.getElementById('dialog-cancel');
    
    // Set up event listeners
    const confirmHandler = () => {
        overlay.style.display = 'none';
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
        if (onConfirm) onConfirm();
    };
    
    const cancelHandler = () => {
        overlay.style.display = 'none';
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
        if (onCancel) onCancel();
    };
    
    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    
    // Show the dialog
    overlay.style.display = 'flex';
}

// Initialize the map
function initMap() {
    try {
        debug("Initializing map...");
        
        // Create Google Map centered on Delhi
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 28.5459, lng: 77.2732 }, // IIIT Delhi
            zoom: 11,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            fullscreenControl: true,
            streetViewControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_LEFT
            }
        });
        
        // Create Google Maps services
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: true  
        });
        directionsRenderer.setMap(map);
        placesService = new google.maps.places.PlacesService(map);
        geocoder = new google.maps.Geocoder();
        
        debug("Map initialized successfully!");
        
        // Try to get user's current location
        if (navigator.geolocation) {
            document.getElementById('status').textContent = "Detecting your location...";
            
            // Try to get a more accurate position with a longer timeout
            navigator.geolocation.getCurrentPosition(
                // Success callback
                function(position) {
                    const userCoords = { 
                        lat: position.coords.latitude, 
                        lng: position.coords.longitude 
                    };
                    debug("Auto-detected user location: " + JSON.stringify(userCoords));
                    
                    // Add more robust validation for the coordinates
                    if (!isValidCoordinate(userCoords.lat, userCoords.lng)) {
                        debug("Invalid coordinates detected, trying again with higher accuracy");
                        requestHighAccuracyLocation();
                        return;
                    }
                    
                    // Get location name using reverse geocoding
                    reverseGeocode(userCoords, function(locationName) {
                        setUserLocation(userCoords, locationName || "Current Location");
                    });
                },
                // Error callback
                function(error) {
                    debug("Geolocation error: " + error.message);
                    // Use IIIT Delhi as the default location
                    const iiitDelhiCoords = { lat: 28.5459, lng: 77.2732 };
                    setUserLocation(iiitDelhiCoords, "Indraprastha Institute of Information Technology");
                    speak("Could not detect your location. Using IIIT Delhi as default location.");
                },
                // Options
                {
                    enableHighAccuracy: true,
                    timeout: 20000,  // Increased timeout
                    maximumAge: 0
                }
            );
        } else {
            debug("Geolocation not supported by this browser");
            // Use IIIT Delhi as the default location
            const iiitDelhiCoords = { lat: 28.5459, lng: 77.2732 };
            setUserLocation(iiitDelhiCoords, "Indraprastha Institute of Information Technology");
            speak("Your browser doesn't support location services. Using IIIT Delhi as default location.");
        }
        
        // Function to validate coordinates
        function isValidCoordinate(lat, lng) {
            // Check if coordinates are valid numbers
            if (isNaN(lat) || isNaN(lng)) return false;
            
            // Check if coordinates are in valid ranges
            if (lat < -90 || lat > 90) return false;
            if (lng < -180 || lng > 180) return false;
            
            // Check if coordinates are not near (0,0) which is often an error
            if (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) return false;
            
            return true;
        }
        
        // Function to request high accuracy location
        function requestHighAccuracyLocation() {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const userCoords = { 
                        lat: position.coords.latitude, 
                        lng: position.coords.longitude 
                    };
                    debug("High accuracy location detected: " + JSON.stringify(userCoords));
                    
                    if (!isValidCoordinate(userCoords.lat, userCoords.lng)) {
                        debug("Still unable to get valid coordinates. Prompting user for manual location");
                        speak("I couldn't detect your precise location. Please click on your location on the map.");
                        promptUserToSelectLocation();
                        return;
                    }
                    
                    reverseGeocode(userCoords, function(locationName) {
                        setUserLocation(userCoords, locationName || "Current Location");
                    });
                },
                function(error) {
                    debug("High accuracy geolocation error: " + error.message);
                    speak("I couldn't detect your location. Please click on your location on the map.");
                    promptUserToSelectLocation();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 0
                }
            );
        }
        
        // Function to prompt user to select their location
        function promptUserToSelectLocation() {
            // Show instructions to the user
            document.getElementById('status').textContent = "Please click on your location on the map";
            
            // Create a listener for map clicks
            currentCommand = 'set_location';
            
            // Optionally, show a dialog
            showDialog(
                "Location Detection Failed",
                "Please click on your current location on the map.",
                null,
                function() {
                    // If user cancels, don't do anything special
                }
            );
        }
        
        // Add map click handler for setting location manually if needed
        map.addListener('click', function(evt) {
            // Only set location on specific clicks, not general map interaction
            if (currentCommand === 'set_location') {
                setUserLocation(evt.latLng.toJSON());
                currentCommand = null;
            }
        });
        
        // Announce that the map is ready
        setTimeout(() => {
            speak('Voice map interface ready');
        }, 1000);
    } catch (e) {
        debug("Error initializing map: " + e.message);
    }
}

// Reverse geocode coordinates to get location name
function reverseGeocode(coords, callback) {
    try {
        geocoder.geocode({ 'location': coords }, function(results, status) {
            if (status === 'OK' && results[0]) {
                let locationName = "Unknown Location";
                
                // Try to get a meaningful name from address components
                for (let i = 0; i < results.length; i++) {
                    const result = results[i];
                    
                    // Look for neighborhood, locality, or administrative area
                    if (result.types.includes('sublocality') || 
                        result.types.includes('neighborhood') || 
                        result.types.includes('locality')) {
                        locationName = result.address_components[0].long_name;
                        break;
                    }
                }
                
                callback(locationName);
            } else {
                debug("Reverse geocoding failed: " + status);
                callback(null);
            }
        });
    } catch (e) {
        debug("Error in reverse geocoding: " + e.message);
        callback(null);
    }
}

// Set user location with a marker
function setUserLocation(coords, locationName) {
    try {
        debug(`Setting user location to: ${JSON.stringify(coords)}`);
        
        // If no location name provided, reverse geocode
        if (!locationName) {
            reverseGeocode(coords, function(name) {
                setUserLocationWithName(coords, name || "Current Location");
            });
        } else {
            setUserLocationWithName(coords, locationName);
        }
    } catch (e) {
        debug(`Error setting user location: ${e.message}`);
    }
}

// Helper function to set user location with name
function setUserLocationWithName(coords, locationName) {
    // Remove previous user marker if exists
    if (userMarker) {
        userMarker.setMap(null);
    }
    
    // Center map on user location
    map.setCenter(coords);
    map.setZoom(13);
    
    // Create marker for user location
    userMarker = new google.maps.Marker({
        position: coords,
        map: map,
        title: locationName,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#1a73e8',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
        },
        label: {
            text: 'You',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 'bold'
        }
    });
    
    // Store the user's location for later use
    userLocation = {
        coords: coords,
        name: locationName
    };
    
    document.getElementById('status').textContent = `Location: ${locationName}`;
    debug(`User location set to: ${locationName} at ${JSON.stringify(coords)}`);
}

// Search for a location
function searchLocation(query, callback) {
    try {
        debug(`Searching for location: ${query}`);
        
        // First check our database of already known locations
        const lowerQuery = query.toLowerCase();
        for (const locName in locationsDatabase) {
            if (lowerQuery.includes(locName)) {
                debug(`Found location in database: ${locName}`);
                callback({
                    name: locName,
                    coords: locationsDatabase[locName],
                    source: 'database'
                });
                return;
            }
        }
        
        // Use Google Places API for geocoding
        const request = {
            query: query,
            fields: ['name', 'geometry']
        };
        
        placesService.findPlaceFromQuery(request, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
                const result = results[0];
                const coords = {
                    lat: result.geometry.location.lat(),
                    lng: result.geometry.location.lng()
                };
                
                // Add to local database for future use
                locationsDatabase[result.name.toLowerCase()] = coords;
                
                callback({
                    name: result.name,
                    coords: coords,
                    source: 'places'
                });
            } else {
                // Try geocoding as a backup
                geocoder.geocode({ 'address': query }, function(results, status) {
                    if (status === 'OK' && results[0]) {
                        const coords = {
                            lat: results[0].geometry.location.lat(),
                            lng: results[0].geometry.location.lng()
                        };
                        
                        // Get a readable name
                        let name = query;
                        if (results[0].address_components && results[0].address_components[0]) {
                            name = results[0].address_components[0].long_name;
                        }
                        
                        // Add to local database for future use
                        locationsDatabase[name.toLowerCase()] = coords;
                        
                        callback({
                            name: name,
                            coords: coords,
                            source: 'geocoding'
                        });
                    } else {
                        debug(`Geocoding failed: ${status}`);
                        callback(null);
                    }
                });
            }
        });
    } catch (e) {
        debug(`Error searching for location: ${e.message}`);
        callback(null);
    }
}

// Initialize speech recognition

// Modify the initSpeechRecognition function in main.js

function initSpeechRecognition() {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1; // Limit alternatives to reduce errors
            
            const voiceBtn = document.getElementById('voice-btn');
            const statusDiv = document.getElementById('status');
            let isListening = false;
            
            voiceBtn.addEventListener('click', () => {
                try {
                    if (!isListening) {
                        // First, check if microphone permission is granted
                        navigator.mediaDevices.getUserMedia({ audio: true })
                            .then(function(stream) {
                                // Permission granted, stop the stream and start recognition
                                stream.getTracks().forEach(track => track.stop());
                                
                                // Start listening
                                recognition.start();
                                voiceBtn.classList.add('listening');
                                if (awaitingResponse) {
                                    statusDiv.textContent = 'Listening for your response...';
                                } else {
                                    statusDiv.textContent = 'Listening for a command...';
                                }
                                isListening = true;
                                debug('Started listening');
                            })
                            .catch(function(err) {
                                debug('Microphone permission error: ' + err);
                                statusDiv.textContent = 'Please allow microphone access to use voice commands';
                                alert('This application requires microphone access to enable voice commands. Please allow microphone access in your browser settings.');
                            });
                    } else {
                        // Stop listening
                        recognition.stop();
                        voiceBtn.classList.remove('listening');
                        statusDiv.textContent = 'Click the microphone and speak a command';
                        isListening = false;
                        debug('Stopped listening');
                    }
                } catch (e) {
                    debug('Error toggling speech recognition: ' + e.message);
                    // Force reset
                    voiceBtn.classList.remove('listening');
                    statusDiv.textContent = 'Click the microphone to try again';
                    isListening = false;
                }
            });
            
            recognition.onresult = (event) => {
                try {
                    const transcript = event.results[0][0].transcript.toLowerCase();
                    statusDiv.textContent = `Recognized: "${transcript}"`;
                    debug('Recognized: ' + transcript);
                    
                    // Process the voice input
                    if (awaitingResponse) {
                        handleDialogResponse(transcript);
                    } else {
                        processVoiceCommand(transcript);
                    }
                    
                    // Automatically stop listening after getting a result
                    recognition.stop();
                    voiceBtn.classList.remove('listening');
                    isListening = false;
                } catch (e) {
                    debug('Error processing speech result: ' + e.message);
                    statusDiv.textContent = 'Error processing command';
                }
            };
            
            recognition.onend = () => {
                // Handle end of speech recognition
                voiceBtn.classList.remove('listening');
                if (isListening) {
                    statusDiv.textContent = 'Listening timed out. Click again to speak.';
                    isListening = false;
                    debug('Listening timed out');
                }
            };
            
            recognition.onerror = (event) => {
                debug('Speech recognition error: ' + event.error);
                
                // Handle specific error types
                if (event.error === 'network') {
                    statusDiv.textContent = 'Network error. Please check your internet connection.';
                    debug('Network error occurred with speech recognition');
                    
                    // Try to restart recognition after a delay
                    setTimeout(() => {
                        if (isListening) {
                            try {
                                recognition.stop();
                                setTimeout(() => {
                                    recognition.start();
                                    debug('Restarted recognition after network error');
                                }, 1000);
                            } catch (e) {
                                debug('Failed to restart recognition: ' + e.message);
                            }
                        }
                    }, 3000);
                } else if (event.error === 'not-allowed') {
                    statusDiv.textContent = 'Microphone access denied. Please check browser permissions.';
                } else if (event.error === 'aborted') {
                    statusDiv.textContent = 'Speech input was aborted.';
                } else if (event.error === 'audio-capture') {
                    statusDiv.textContent = 'No microphone detected. Please check your device settings.';
                } else if (event.error === 'no-speech') {
                    statusDiv.textContent = 'No speech detected. Please try again.';
                } else {
                    statusDiv.textContent = `Error occurred: ${event.error}`;
                }
                
                voiceBtn.classList.remove('listening');
                isListening = false;
            };
            
            debug('Speech recognition initialized');
        } else {
            debug('Speech recognition not supported in this browser');
            document.getElementById('voice-control').innerHTML = '<div id="status">Voice recognition not supported in this browser. Please try Chrome.</div>';
        }
    } catch (e) {
        debug('Error setting up speech recognition: ' + e.message);
    }
}
// Handle dialog responses for multi-step commands
function handleDialogResponse(response) {
    try {
        debug(`Handling response for ${currentCommand}: ${response}`);
        
        if (currentCommand === 'path_start') {
            // Check for "current location" or similar phrases
            if (response.includes('current') && response.includes('location') || 
                response.includes('my') && response.includes('location') ||
                response.includes('where') && response.includes('am') ||
                response.includes('here')) {
                
                if (userLocation) {
                    setStartLocation(userLocation.name, userLocation.coords);
                    speak(`Start location set to your current location. Where would you like to go?`);
                    currentCommand = 'path_destination';
                    document.getElementById('status').textContent = 'Please provide a destination';
                } else {
                    speak(`I don't have your current location. Please specify a place name.`);
                    // Keep the same command state to try again
                }
            } else {
                // Use Google Places for start location
                searchLocation(response, function(location) {
                    if (location) {
                        setStartLocation(location.name, location.coords);
                        speak(`Start location set to ${location.name}. Where would you like to go?`);
                        currentCommand = 'path_destination';
                        document.getElementById('status').textContent = 'Please provide a destination';
                    } else {
                        speak(`I couldn't find ${response}. Please try again with a different location.`);
                        // Keep the same command state to try again
                    }
                });
            }
        }
        else if (currentCommand === 'path_destination') {
            // Check for "current location" or similar phrases
            if (response.includes('current') && response.includes('location') || 
                response.includes('my') && response.includes('location') ||
                response.includes('where') && response.includes('am') ||
                response.includes('here')) {
                
                if (userLocation) {
                    setEndLocation(userLocation.name, userLocation.coords);
                    calculateAndShowRoute();
                    // Reset the command state
                    currentCommand = null;
                    awaitingResponse = false;
                } else {
                    speak(`I don't have your current location. Please specify a place name.`);
                    // Keep the same command state to try again
                }
            } else {
                // Use Google Places for destination
                searchLocation(response, function(location) {
                    if (location) {
                        setEndLocation(location.name, location.coords);
                        calculateAndShowRoute();
                        // Reset the command state
                        currentCommand = null;
                        awaitingResponse = false;
                    } else {
                        speak(`I couldn't find ${response}. Please try again with a different location.`);
                        // Keep the same command state to try again
                    }
                });
            }
        }
        else {
            // Unknown command state
            speak("I'm not sure what to do next. Let's start over.");
            resetCommandState();
        }
    } catch (e) {
        debug('Error handling dialog response: ' + e.message);
        resetCommandState();
    }
}

// Reset command state
function resetCommandState() {
    currentCommand = null;
    awaitingResponse = false;
    document.getElementById('status').textContent = 'Click the microphone and speak a command';
}

// Set the start location for route finding
function setStartLocation(name, coords) {
    // Remove previous start marker if exists
    if (startMarker) {
        startMarker.setMap(null);
    }
    
    // Create the start marker
    startMarker = new google.maps.Marker({
        position: coords,
        map: map,
        title: name,
        label: {
            text: 'A',
            color: '#ffffff',
            fontWeight: 'bold'
        },
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#0f9d58',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
        }
    });
    
    // Pan to the start location
    map.panTo(coords);
    
    debug(`Start location set to: ${name}`);
}

// Set the end location for route finding
function setEndLocation(name, coords) {
    // Remove previous end marker if exists
    if (endMarker) {
        endMarker.setMap(null);
    }
    
    // Create the end marker
    endMarker = new google.maps.Marker({
        position: coords,
        map: map,
        title: name,
        label: {
            text: 'B',
            color: '#ffffff',
            fontWeight: 'bold'
        },
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#ea4335',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
        }
    });
    
    // Pan to the end location
    map.panTo(coords);
    
    debug(`End location set to: ${name}`);
}

// Calculate and show route between start and end points
// Calculate and show route between start and end points
// Calculate and show route between start and end points
function calculateAndShowRoute() {
    try {
        // Ensure we have both start and end points
        if (!startMarker || !endMarker) {
            speak("I need both a start and end location to show a path.");
            return;
        }
        
        // Show distance info box with loading message
        const distanceInfo = document.getElementById('distance-info');
        distanceInfo.innerHTML = 'Calculating route...';
        distanceInfo.style.display = 'block';
        
        // Reset the directions renderer to ensure clean state
        if (directionsRenderer) {
            directionsRenderer.setMap(null);
        }
        
        // Create a new directions renderer
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true,  // We'll keep our custom markers
            polylineOptions: {
                strokeColor: '#1a73e8',
                strokeWeight: 5,
                strokeOpacity: 0.8
            }
        });
        
        // Get start and end positions
        const origin = startMarker.getPosition();
        const destination = endMarker.getPosition();
        
        // Set up route request with all required parameters
        const request = {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
            avoidFerries: false,
            avoidHighways: false,
            avoidTolls: false,
            unitSystem: google.maps.UnitSystem.METRIC
        };
        
        debug(`Requesting directions from ${origin.toString()} to ${destination.toString()}`);
        
        // Use Google's Direction Service to calculate the route
        directionsService.route(request, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                // Display the route
                directionsRenderer.setDirections(response);
                
                // Extract route information
                const route = response.routes[0];
                const leg = route.legs[0];
                
                // Format distance and duration
                const distance = leg.distance.text;
                const duration = leg.duration.text;
                
                // Show distance and time information
                distanceInfo.innerHTML = `
                    <strong>Distance:</strong> ${distance}<br>
                    <strong>Est. travel time:</strong> ${duration}
                `;
                
                // Announce the route
                speak(`Route calculated. The distance is approximately ${distance}, with an estimated travel time of ${duration}.`);
                
                debug(`Route calculated: ${distance}, ${duration}`);
            } else {
                debug(`Directions request failed: ${status}. Falling back to straight line.`);
                
                // Fall back to a straight line if the directions service fails
                fallbackStraightLineRoute(origin, destination);
            }
        });
    } catch (e) {
        debug('Error calculating route: ' + e.message);
        speak('There was an error calculating the route. Showing direct path instead.');
        
        // If we have markers, show a straight line as fallback
        if (startMarker && endMarker) {
            fallbackStraightLineRoute(startMarker.getPosition(), endMarker.getPosition());
        }
    }
}
function fallbackStraightLineRoute(origin, destination) {
    try {
        // Create a polyline for the route
        const straightLineRoute = new google.maps.Polyline({
            path: [
                { lat: origin.lat(), lng: origin.lng() },
                { lat: destination.lat(), lng: destination.lng() }
            ],
            geodesic: true,
            strokeColor: '#1a73e8',
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map: map
        });
        
        // Store polyline for later cleanup
        markers.push(straightLineRoute);
        
        // Calculate distance (Haversine formula)
        const R = 6371; // Earth's radius in km
        const dLat = (destination.lat() - origin.lat()) * Math.PI / 180;
        const dLng = (destination.lng() - origin.lng()) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(origin.lat() * Math.PI / 180) * Math.cos(destination.lat() * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Estimate duration (assuming average speed of 50 km/h)
        const durationHours = distance / 50;
        const durationMinutes = Math.round(durationHours * 60);
        const durationStr = durationMinutes < 60 ? 
            `${durationMinutes} minutes` : 
            `${Math.floor(durationHours)} hour${Math.floor(durationHours) !== 1 ? 's' : ''} and ${Math.round((durationHours % 1) * 60)} minutes`;
        
        // Update distance info
        const distanceInfo = document.getElementById('distance-info');
        distanceInfo.innerHTML = `
            <strong>Distance (direct):</strong> ${distance.toFixed(1)} km<br>
            <strong>Est. travel time:</strong> ${durationStr}<br>
            <small>Note: This is a direct route. Road distance may be longer.</small>
        `;
        distanceInfo.style.display = 'block';
        
        // Fit the bounds to show the route
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        map.fitBounds(bounds);
        
        speak(`Showing direct route. The straight-line distance is approximately ${distance.toFixed(1)} kilometers.`);
        debug(`Straight line route calculated: ${distance.toFixed(1)} km`);
    } catch (e) {
        debug('Error creating straight line route: ' + e.message);
        speak('There was an error displaying the route.');
        
        // Hide the distance info
        document.getElementById('distance-info').style.display = 'none';
    }
}
// Create a simple straight-line route between points when the API fails
function createSimpleRoute(startCoord, endCoord) {
    try {
        // Clear any existing directions
        if (directionsRenderer) {
            directionsRenderer.setMap(null);
        }
        
        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (endCoord.lat - startCoord.lat) * Math.PI / 180;
        const dLng = (endCoord.lng - startCoord.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(startCoord.lat * Math.PI / 180) * Math.cos(endCoord.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceKm = R * c;
        
        // Create a polyline for the route
        const routePath = new google.maps.Polyline({
            path: [startCoord, endCoord],
            geodesic: true,
            strokeColor: '#1a73e8',
            strokeOpacity: 1.0,
            strokeWeight: 4
        });
        
        routePath.setMap(map);
        markers.push(routePath); // Add to markers for later cleanup
        
        // Calculate estimated travel time (assuming 60 km/h average speed)
        const timeHours = distanceKm / 60;
        let timeStr = "";
        
        if (timeHours < 1) {
            // Less than 1 hour
            const timeMinutes = Math.round(timeHours * 60);
            timeStr = `${timeMinutes} minutes`;
        } else {
            // More than 1 hour
            const hours = Math.floor(timeHours);
            const minutes = Math.round((timeHours - hours) * 60);
            timeStr = `${hours} hour${hours > 1 ? 's' : ''}`;
            if (minutes > 0) {
                timeStr += ` and ${minutes} minute${minutes > 1 ? 's' : ''}`;
            }
        }
        
        // Show distance and time information
        const distanceInfo = document.getElementById('distance-info');
        distanceInfo.innerHTML = `
            <strong>Distance:</strong> ${distanceKm.toFixed(1)} km<br>
            <strong>Est. travel time:</strong> ${timeStr}
        `;
        distanceInfo.style.display = 'block';
        
        // Fit the map to show the route
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(new google.maps.LatLng(startCoord.lat, startCoord.lng));
        bounds.extend(new google.maps.LatLng(endCoord.lat, endCoord.lng));
        map.fitBounds(bounds);
        
        // Announce the route
        speak(`Route calculated. The distance is approximately ${distanceKm.toFixed(1)} kilometers, with an estimated travel time of ${timeStr}.`);
        
        debug(`Simple route calculated: ${distanceKm.toFixed(1)} km, ${timeStr}`);
    } catch (e) {
        debug('Error creating simple route: ' + e.message);
        speak('There was an error displaying the route.');
    }
}
// Process voice commands
function processVoiceCommand(command) {
    try {
        debug('Processing command: ' + command);
        
        // Zoom commands
        if (command.includes('zoom in')) {
            map.setZoom(map.getZoom() + 1);
            speak('Zooming in');
        } 
        else if (command.includes('zoom out')) {
            map.setZoom(map.getZoom() - 1);
            speak('Zooming out');
        }
        
        // Map style commands
        else if (command.includes('satellite') || command.includes('satellite view')) {
            map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
            speak('Switching to satellite view');
        } 
        else if (command.includes('streets') || command.includes('street view')) {
            map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
            speak('Switching to streets view');
        }
        
        // Pan commands
        else if (command.includes('pan north')) {
            panMap('north');
            speak('Panning north');
        } 
        else if (command.includes('pan south')) {
            panMap('south');
            speak('Panning south');
        } 
        else if (command.includes('pan east')) {
            panMap('east');
            speak('Panning east');
        } 
        else if (command.includes('pan west')) {
            panMap('west');
            speak('Panning west');
        }
        
        // Location commands
        else if (command.includes('go to')) {
            const location = command.replace('go to', '').trim();
            if (location) {
                searchLocation(location, function(locationData) {
                    if (locationData) {
                        goToLocation(locationData.name, locationData.coords);
                    } else {
                        speak(`Sorry, I don't know where ${location} is`);
                    }
                });
            }
        }

        else if (command.includes('set') && command.includes('location')) {
            currentCommand = 'set_location';
            speak("Click on the map to set your location");
        }
        
        // Find points of interest
        else if (command.includes('find') && command.includes('nearby')) {
            const poi = command.replace('find', '').replace('nearby', '').trim();
            if (poi) {
                findNearbyPlaces(poi);
            }
        }
        
        // Show path command
        else if (command.includes('show path') || command.includes('find path') || command.includes('show route') || command.includes('find route')) {
            startPathFinding();
        }
        
        // Clear map command
        else if (command.includes('clear map') || command.includes('reset map')) {
            clearMap();
            speak('Map cleared');
        }
        
        // Center map command
        else if (command.includes('center map') || command.includes('centre map')) {
            centerMap();
            speak('Map centered');
        }
        
        // Unknown command
        else {
            speak('Sorry, I did not understand that command');
            debug('Unknown command');
        }
    } catch (e) {
        debug('Error processing command: ' + e.message);
        speak('Error processing command');
    }
}

// Pan the map in a direction
function panMap(direction) {
    try {
        const center = map.getCenter().toJSON();
        const zoom = map.getZoom();
        const panStep = 100 * Math.pow(2, 15 - zoom); // Dynamic step size based on zoom level
        
        switch (direction) {
            case 'north':
                center.lat += panStep * 0.0001;
                break;
            case 'south':
                center.lat -= panStep * 0.0001;
                break;
            case 'east':
                center.lng += panStep * 0.0001;
                break;
            case 'west':
                center.lng -= panStep * 0.0001;
                break;
        }
        
        map.panTo(center);
        debug(`Panned ${direction} to ${JSON.stringify(center)}`);
    } catch (e) {
        debug(`Error panning map: ${e.message}`);
    }
}

// Go to a location
function goToLocation(name, coords) {
    try {
        // Pan to location and zoom in
        map.panTo(coords);
        map.setZoom(14);
        
        // Remove existing POI markers
        clearPointsOfInterest();
        
        // Add marker for this location
        const marker = new google.maps.Marker({
            position: coords,
            map: map,
            title: name,
            animation: google.maps.Animation.DROP
        });
        
        // Store marker for later removal
        markers.push(marker);
        
        // Add info window with location name
        const infowindow = new google.maps.InfoWindow({
            content: `<div style="font-weight:bold;">${name}</div>`
        });
        
        infowindow.open(map, marker);
        
        speak(`Going to ${name}`);
        debug(`Going to: ${name} at ${JSON.stringify(coords)}`);
    } catch (e) {
        debug(`Error going to location: ${e.message}`);
    }
}

// Find nearby places
// Helper function to find nearby places
// Helper function to find nearby places
function findNearbyPlaces(placeType) {
    try {
        speak(`Searching for ${placeType} nearby`);
        debug(`Searching for ${placeType} nearby`);
        
        // Clear existing POI markers
        clearPointsOfInterest();
        
        // Map common voice commands to place types Google understands
        const placeTypeMap = {
            'restaurants': 'restaurant',
            'restaurant': 'restaurant',
            'food': 'restaurant',
            'hotels': 'lodging',
            'hotel': 'lodging',
            'stay': 'lodging',
            'hospital': 'hospital',
            'hospitals': 'hospital',
            'medical': 'hospital',
            'gas': 'gas_station',
            'gas station': 'gas_station',
            'petrol': 'gas_station',
            'school': 'school',
            'schools': 'school',
            'education': 'school',
            'college': 'university',
            'university': 'university',
            'institute': 'university',
            'bank': 'bank',
            'banks': 'bank',
            'atm': 'atm',
            'parking': 'parking',
            'car park': 'parking',
            'mall': 'shopping_mall',
            'shopping': 'shopping_mall',
            'shopping mall': 'shopping_mall',
            'cafe': 'cafe',
            'coffee': 'cafe',
            'pharmacy': 'pharmacy',
            'chemist': 'pharmacy',
            'drugstore': 'pharmacy',
            'park': 'park',
            'parks': 'park',
            'cinema': 'movie_theater',
            'movie': 'movie_theater',
            'theater': 'movie_theater',
            'grocery': 'grocery_or_supermarket',
            'supermarket': 'grocery_or_supermarket',
            'store': 'store',
            'shop': 'store',
            'gym': 'gym',
            'fitness': 'gym'
        };
        
        // Try to map the user's query to a known place type
        const mappedType = placeTypeMap[placeType.toLowerCase()];
        
        // Get current map center
        const center = map.getCenter();
        
        // Set up the search request
        const request = {
            location: center,
            radius: 5000, // 5km radius
            type: mappedType || null,
            keyword: placeType, // Always include the original query as keyword
            rankBy: mappedType ? google.maps.places.RankBy.PROMINENCE : google.maps.places.RankBy.DISTANCE
        };
        
        // Use Google Places nearby search
        placesService.nearbySearch(request, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                // Get detailed information for each place
                getDetailedPlacesInfo(results, placeType);
            } else {
                // Fall back to text search if nearby search fails
                const textRequest = {
                    location: center,
                    radius: 5000,
                    query: placeType
                };
                
                placesService.textSearch(textRequest, function(results, status) {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                        getDetailedPlacesInfo(results, placeType);
                    } else {
                        speak(`Sorry, I couldn't find any ${placeType} nearby.`);
                        debug(`Places search failed: ${status}`);
                    }
                });
            }
        });
    } catch (e) {
        debug(`Error finding nearby places: ${e.message}`);
        speak(`Error finding nearby places.`);
    }
}

// Get detailed information for places including parking and popularity
function getDetailedPlacesInfo(places, placeType) {
    // Limit to 5 places for display
    const placesToProcess = Math.min(places.length, 5);
    let processedCount = 0;
    
    for (let i = 0; i < placesToProcess; i++) {
        const place = places[i];
        
        // Request additional details for each place
        placesService.getDetails({
            placeId: place.place_id,
            fields: ['name', 'geometry', 'formatted_address', 'vicinity', 'rating', 
                     'user_ratings_total', 'opening_hours', 'price_level', 
                     'website', 'photos', 'formatted_phone_number']
        }, function(detailedPlace, detailStatus) {
            processedCount++;
            
            if (detailStatus === google.maps.places.PlacesServiceStatus.OK) {
                // Create a more detailed marker
                createEnhancedMarker(detailedPlace, i);
            } else {
                // Use basic place data if details aren't available
                createEnhancedMarker(place, i);
            }
            
            // When all places are processed, adjust map view and announce results
            if (processedCount === placesToProcess) {
                // Adjust map bounds to show all markers
                const bounds = new google.maps.LatLngBounds();
                markers.forEach(marker => bounds.extend(marker.getPosition()));
                map.fitBounds(bounds);
                
                speak(`Found ${placesToProcess} ${placeType} locations nearby`);
                debug(`Found ${placesToProcess} ${placeType} locations nearby`);
            }
        });
    }
}

// Create enhanced markers with more detailed info
function createEnhancedMarker(place, index) {
    // Estimate parking availability based on time of day and place type
    const now = new Date();
    const hour = now.getHours();
    const isBusinessHour = hour >= 9 && hour <= 17;
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    let parkingStatus;
    let crowdEstimate;
    
    // Basic crowd and parking estimation based on time and ratings
    if (place.user_ratings_total > 500) {
        // Popular place
        if (isWeekend) {
            parkingStatus = "Limited parking available";
            crowdEstimate = "Likely crowded";
        } else if (isBusinessHour) {
            parkingStatus = "Moderate parking available";
            crowdEstimate = "Moderately busy";
        } else {
            parkingStatus = "Parking available";
            crowdEstimate = "Likely not crowded";
        }
    } else {
        // Less popular place
        parkingStatus = "Parking available";
        crowdEstimate = isBusinessHour ? "Moderately busy" : "Likely not crowded";
    }
    
    // Determine if place is currently open
    let openStatus = "Unknown hours";
    if (place.opening_hours) {
        openStatus = place.opening_hours.isOpen() ? 
            "<span style='color:green'>Open now</span>" : 
            "<span style='color:red'>Closed now</span>";
    }
    
    // Create marker for this place
    const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name,
        animation: google.maps.Animation.DROP,
        label: {
            text: (index + 1).toString(),
            color: '#FFFFFF',
            fontWeight: 'bold'
        },
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#fbbc04',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 7
        }
    });
    
    // Store marker for later removal
    markers.push(marker);
    
    // Format price level
    let priceLevel = "";
    if (place.price_level) {
        for (let i = 0; i < place.price_level; i++) {
            priceLevel += "₹";
        }
    }
    
    // Create enhanced info window with detailed information
    const infoContent = `
        <div style="max-width: 300px;">
            <div style="font-weight:bold; font-size: 14px;">${place.name}</div>
            <div style="font-size: 12px;">${place.vicinity || place.formatted_address || ''}</div>
            ${place.rating ? 
                `<div style="margin-top: 5px;">
                    <span style="color: #FFD700;">★</span> ${place.rating.toFixed(1)}/5 
                    (${place.user_ratings_total || 'No'} reviews)
                </div>` : ''}
            ${priceLevel ? `<div>Price level: ${priceLevel}</div>` : ''}
            <div>${openStatus}</div>
            <hr style="margin: 5px 0;">
            <div style="color: ${crowdEstimate.includes('not') ? 'green' : (crowdEstimate.includes('Moderately') ? 'orange' : 'red')};">
                <strong>Crowd estimate:</strong> ${crowdEstimate}
            </div>
            <div style="color: ${parkingStatus.includes('Limited') ? 'red' : (parkingStatus.includes('Moderate') ? 'orange' : 'green')};">
                <strong>Parking:</strong> ${parkingStatus}
            </div>
            ${place.formatted_phone_number ? 
                `<div style="margin-top: 5px;">📞 ${place.formatted_phone_number}</div>` : ''}
            ${place.website ? 
                `<div style="margin-top: 5px; word-break: break-all;">
                    <a href="${place.website}" target="_blank">Website</a>
                </div>` : ''}
        </div>
    `;
    
    const infowindow = new google.maps.InfoWindow({
        content: infoContent
    });
    
    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });
}
// Helper function to display places results
function displayPlacesResults(results, placeType) {
    // Limit to a reasonable number
    const placesToShow = Math.min(results.length, 5);
    
    for (let i = 0; i < placesToShow; i++) {
        const place = results[i];
        
        // Create marker for this place
        const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            label: {
                text: (i + 1).toString(),
                color: '#FFFFFF',
                fontWeight: 'bold'
            },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#fbbc04',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 7
            }
        });
        
        // Store marker for later removal
        markers.push(marker);
        
        // Add info window with place details
        const infowindow = new google.maps.InfoWindow({
            content: `
                <div style="font-weight:bold;">${place.name}</div>
                <div>${place.vicinity || place.formatted_address || ''}</div>
                <div>Rating: ${place.rating ? place.rating + '/5' : 'N/A'}</div>
            `
        });
        
        marker.addListener('click', function() {
            infowindow.open(map, marker);
        });
    }
    
    // Adjust map bounds to show all markers
    const bounds = new google.maps.LatLngBounds();
    for (let i = 0; i < placesToShow; i++) {
        bounds.extend(results[i].geometry.location);
    }
    map.fitBounds(bounds);
    
    speak(`Found ${placesToShow} ${placeType} locations nearby`);
    debug(`Found ${placesToShow} ${placeType} locations nearby`);
}
// Clear points of interest markers
function clearPointsOfInterest() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

// Start the path finding process
function startPathFinding() {
    try {
        // Check if we have the user's current location
        if (userLocation) {
            // Ask if user wants to use current location as starting point
            showDialog(
                "Use Current Location?",
                "Would you like to use your current location as the starting point?",
                // Yes callback
                function() {
                    setStartLocation(userLocation.name, userLocation.coords);
                    speak("Starting from your current location. Where would you like to go?");
                    currentCommand = 'path_destination';
                    awaitingResponse = true;
                    document.getElementById('status').textContent = 'Please provide a destination';
                },
                // No callback
                function() {
                    speak("Let's find a path. What's your starting location?");
                    currentCommand = 'path_start';
                    awaitingResponse = true;
                    document.getElementById('status').textContent = 'Please provide a starting location';
                }
            );
        } else {
            // No user location available, just ask for starting point
            speak("Let's find a path. What's your starting location?");
            currentCommand = 'path_start';
            awaitingResponse = true;
            document.getElementById('status').textContent = 'Please provide a starting location';
        }
        debug('Started path finding process');
    } catch (e) {
        debug('Error starting path finding: ' + e.message);
        resetCommandState();
    }
}

// Clear the map
function clearMap() {
    try {
        // Clear markers
        clearPointsOfInterest();
        
        // Clear route
        directionsRenderer.setDirections({routes: []});
        
        // Clear start and end markers
        if (startMarker) {
            startMarker.setMap(null);
            startMarker = null;
        }
        
        if (endMarker) {
            endMarker.setMap(null);
            endMarker = null;
        }
        
        // Hide distance info
        document.getElementById('distance-info').style.display = 'none';
        
        debug('Map cleared');
    } catch (e) {
        debug('Error clearing map: ' + e.message);
    }
}

// Center the map
function centerMap() {
    try {
        // Center on Delhi or user location if available
        if (userLocation) {
            map.setCenter(userLocation.coords);
        } else {
            map.setCenter({ lat: 28.7041, lng: 77.1025 }); // Delhi
        }
        map.setZoom(11);
        debug('Map centered');
    } catch (e) {
        debug('Error centering map: ' + e.message);
    }
}

// Text-to-speech function for feedback
function speak(text) {
    try {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = 1;
            utterance.rate = 1;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
            debug('Speaking: ' + text);
            
            // Update status
            document.getElementById('status').textContent = text;
        } else {
            debug('Speech synthesis not supported in this browser');
            // Update status anyway
            document.getElementById('status').textContent = text;
        }
    } catch (e) {
        debug('Error with speech synthesis: ' + e.message);
        // Fallback to just updating status
        document.getElementById('status').textContent = text;
    }
}
// Initialize on window load
window.onload = function() {
    initMap();
    loadWorldCitiesData(); // Load the cities dataset
    setTimeout(initSpeechRecognition, 2000); // Delay speech init to ensure map loads first
    setTimeout(initPlacesDatabase, 2500); // Delay places init to ensure map loads first
};
                    
                    