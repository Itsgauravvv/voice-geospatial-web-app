// Global variable to hold loaded places data
let placesData = null;
let placesMarkers = [];
let placesInfoWindows = [];
let currentInfoWindow = null;

// Initialize the places data system
function initPlacesDatabase() {
    try {
        debug("Initializing enhanced places database...");
        
        // Load the places data
        fetch('/static/data/places_data.js')
            .then(response => response.text())
            .then(jsCode => {
                // Execute the JavaScript to get the placesDatabase object
                const scriptElement = document.createElement('script');
                scriptElement.textContent = jsCode;
                document.head.appendChild(scriptElement);
                
                // Access the global placesDatabase which was defined in the script
                setTimeout(() => {
                    if (window.placesDatabase) {
                        placesData = window.placesDatabase;
                        debug(`Places database loaded successfully with ${Object.keys(placesData).length} categories`);
                        debug(`Categories: ${Object.keys(placesData).join(', ')}`);
                        
                        // Add voice commands for the new categories
                        enhanceVoiceCommands();
                    } else {
                        debug("Error: Places database not found after loading");
                    }
                }, 500);
            })
            .catch(error => {
                debug(`Error loading places database: ${error.message}`);
            });
    } catch (e) {
        debug(`Error in initPlacesDatabase: ${e.message}`);
    }
}

// Add category-specific voice commands
function enhanceVoiceCommands() {
    // Update the command list in the UI
    const commandList = document.getElementById('command-list').querySelector('ul');
    
    // Add new commands for each category
    Object.keys(placesData).forEach(category => {
        const formattedCategory = category.replace('_', ' ');
        const newCommand = document.createElement('li');
        newCommand.textContent = `"Show ${formattedCategory} nearby"`;
        commandList.appendChild(newCommand);
    });
    
    // Add specific command for detailed info
    const detailCommand = document.createElement('li');
    detailCommand.textContent = `"Tell me about [place name]"`;
    commandList.appendChild(detailCommand);
    
    debug("Voice commands enhanced with places database categories");
}

// Enhance the existing processVoiceCommand function
// This should be merged into the existing function in main.js
function enhancedProcessVoiceCommand(command) {
    try {
        // Check if places data is loaded
        if (!placesData) {
            debug("Places data not loaded yet. Using default command processing.");
            return false; // Let the original function handle it
        }
        
        // Handle "show [category] nearby" commands
        const showPattern = /show\s+(\w+)(?:\s+nearby)?/i;
        const showMatch = command.match(showPattern);
        
        if (showMatch) {
            const category = showMatch[1].toLowerCase();
            debug(`Detected 'show ${category}' command`);
            
            // Map common variations to our categories
            const categoryMap = {
                'restaurants': 'restaurants',
                'restaurant': 'restaurants',
                'food': 'restaurants',
                'dining': 'restaurants',
                
                'hotels': 'hotels',
                'hotel': 'hotels',
                'accommodation': 'hotels',
                'stay': 'hotels',
                'lodging': 'hotels',
                
                'schools': 'educational_institutions',
                'college': 'educational_institutions',
                'university': 'educational_institutions',
                'institute': 'educational_institutions',
                'educational': 'educational_institutions',
                'education': 'educational_institutions',
                
                'attractions': 'attractions',
                'sights': 'attractions',
                'monuments': 'attractions',
                'tourist': 'attractions',
                'sightseeing': 'attractions',
                
                'shopping': 'shopping',
                'shops': 'shopping',
                'malls': 'shopping',
                'mall': 'shopping',
                'markets': 'shopping',
                'market': 'shopping',
                
                'hospitals': 'healthcare',
                'hospital': 'healthcare',
                'medical': 'healthcare',
                'clinic': 'healthcare',
                'pharmacy': 'healthcare',
                'healthcare': 'healthcare',
                'health': 'healthcare',
                
                'transport': 'transportation',
                'transportation': 'transportation',
                'transit': 'transportation',
                'stations': 'transportation',
                'airport': 'transportation',
                'travel': 'transportation'
            };
            
            const mappedCategory = categoryMap[category];
            
            if (mappedCategory && placesData[mappedCategory]) {
                showNearbyPlaces(mappedCategory);
                return true; // Command handled
            }
        }
        
        // Handle "tell me about [place]" commands
        const tellPattern = /tell\s+(?:me\s+)?about\s+(.+)/i;
        const tellMatch = command.match(tellPattern);
        
        if (tellMatch) {
            const placeName = tellMatch[1].toLowerCase();
            debug(`Detected 'tell me about ${placeName}' command`);
            
            // Search for the place in our database
            if (findAndDescribePlace(placeName)) {
                return true; // Command handled
            }
        }
        
        return false; // Command not handled, let the original function process it
    } catch (e) {
        debug(`Error in enhancedProcessVoiceCommand: ${e.message}`);
        return false;
    }
}

// Function to display nearby places from our enhanced database
function showNearbyPlaces(category) {
    try {
        // Clear existing markers
        clearCustomMarkers();
        
        speak(`Showing ${category.replace('_', ' ')} nearby`);
        debug(`Showing ${category} from the places database`);
        
        // Current map center
        const center = map.getCenter();
        const centerLat = center.lat();
        const centerLng = center.lng();
        
        // Get places from the category
        const places = placesData[category];
        
        if (!places || places.length === 0) {
            speak(`Sorry, I couldn't find any ${category.replace('_', ' ')} in the database.`);
            return;
        }
        
        // Calculate distances and sort by proximity
        const placesWithDistance = places.map(place => {
            const distance = calculateDistance(
                centerLat, 
                centerLng, 
                place.location.lat, 
                place.location.lng
            );
            return { ...place, distance };
        });
        
        // Sort by distance and take top 5
        const nearbyPlaces = placesWithDistance
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);
        
        // Create bounds to adjust the map view
        const bounds = new google.maps.LatLngBounds();
        
        // Create markers for each place
        nearbyPlaces.forEach((place, index) => {
            createEnhancedPlaceMarker(place, index, category);
            bounds.extend(new google.maps.LatLng(place.location.lat, place.location.lng));
        });
        
        // Include current center in bounds
        bounds.extend(center);
        
        // Adjust map to show all markers
        map.fitBounds(bounds);
        
        // Build and speak a summary
        const placeNames = nearbyPlaces.map(place => place.name).join(', ');
        speak(`Found ${nearbyPlaces.length} ${category.replace('_', ' ')} nearby: ${placeNames}`);
        
        // Show a panel with brief information
        showPlacesSummaryPanel(nearbyPlaces, category);
        
    } catch (e) {
        debug(`Error in showNearbyPlaces: ${e.message}`);
        speak(`There was an error showing nearby ${category.replace('_', ' ')}.`);
    }
}

// Function to create an enhanced marker for places from our database
function createEnhancedPlaceMarker(place, index, category) {
    // Choose marker color based on category
    const markerColors = {
        'restaurants': '#FF5722',      // Orange
        'hotels': '#2196F3',           // Blue
        'educational_institutions': '#4CAF50', // Green
        'attractions': '#9C27B0',      // Purple
        'shopping': '#FFC107',         // Amber
        'healthcare': '#F44336',       // Red
        'transportation': '#607D8B'    // Blue Grey
    };
    
    const markerColor = markerColors[category] || '#FF5722';
    
    // Create marker
    const marker = new google.maps.Marker({
        position: place.location,
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
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 7
        }
    });
    
    // Store marker for later removal
    placesMarkers.push(marker);
    
    // Create info window with enhanced content
    const infoContent = createInfoWindowContent(place, category);
    
    const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
        maxWidth: 320
    });
    
    // Store info window
    placesInfoWindows.push(infoWindow);
    
    // Add click listener
    marker.addListener('click', function() {
        // Close currently open info window
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        
        // Open this info window
        infoWindow.open(map, marker);
        currentInfoWindow = infoWindow;
        
        // Speak brief description
        speakPlaceSummary(place);
    });
}

// Create rich HTML content for info windows
function createInfoWindowContent(place, category) {
    try {
        // Base info for all places
        let content = `
            <div style="max-width: 300px; font-family: Arial, sans-serif;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${place.name}</div>
                <div style="font-size: 12px;">${place.address}</div>
        `;
        
        // Add rating stars if available
        if (place.rating) {
            const stars = '★'.repeat(Math.floor(place.rating)) + 
                          (place.rating % 1 >= 0.5 ? '½' : '');
            
            content += `
                <div style="margin: 8px 0;">
                    <span style="color: #FFC107; font-size: 14px;">${stars}</span>
                    <span style="margin-left: 5px; font-size: 14px;">${place.rating.toFixed(1)}</span>
                    <span style="font-size: 12px; color: #757575;"> (${place.user_ratings_total.toLocaleString()} reviews)</span>
                </div>
            `;
        }
        
        // Add category
        content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Category:</strong> ${place.category}</div>`;
        
        // Add description
        if (place.description) {
            content += `<div style="margin: 8px 0; font-size: 12px;">${place.description}</div>`;
        }
        
        // Add category-specific information
        switch (category) {
            case 'restaurants':
                if (place.popular_dishes) {
                    content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Popular dishes:</strong> ${place.popular_dishes.join(', ')}</div>`;
                }
                if (place.price_level) {
                    const priceSymbol = '₹'.repeat(place.price_level);
                    content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Price range:</strong> ${priceSymbol}</div>`;
                }
                break;
                
            case 'hotels':
                if (place.price_level) {
                    const priceSymbol = '₹'.repeat(place.price_level);
                    content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Price range:</strong> ${priceSymbol}</div>`;
                }
                if (place.check_in && place.check_out) {
                    content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Check-in:</strong> ${place.check_in} | <strong>Check-out:</strong> ${place.check_out}</div>`;
                }
                break;
                
            case 'attractions':
                if (place.timings) {
                    content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Timings:</strong> ${place.timings}</div>`;
                }
                if (place.entry_fee) {
                    content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Entry fee:</strong> ${place.entry_fee}</div>`;
                }
                break;
                
            case 'healthcare':
                if (place.emergency) {
                    content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Emergency:</strong> ${place.emergency}</div>`;
                }
                if (place.specialties) {
                    content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Specialties:</strong> ${place.specialties.join(', ')}</div>`;
                }
                break;
                
            case 'educational_institutions':
                if (place.founded) {
                    content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Founded:</strong> ${place.founded}</div>`;
                }
                if (place.programs) {
                    content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Programs:</strong> ${place.programs.join(', ')}</div>`;
                }
                break;
        }
        
        // Add contact info
        if (place.phone) {
            content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Phone:</strong> ${place.phone}</div>`;
        }
        
        // Add website link
        if (place.website) {
            content += `<div style="margin: 8px 0; font-size: 12px;">
                <strong>Website:</strong> <a href="${place.website}" target="_blank" style="color: #1A73E8;">Visit website</a>
            </div>`;
        }
        
        // Add facilities
        if (place.facilities && place.facilities.length > 0) {
            content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Facilities:</strong> ${place.facilities.join(', ')}</div>`;
        }
        
        // Add parking info
        if (place.parking_available) {
            content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Parking:</strong> ${place.parking_available}</div>`;
        }
        
        // Add accessibility info
        if (place.accessibility) {
            content += `<div style="margin: 8px 0; font-size: 12px;"><strong>Accessibility:</strong> ${place.accessibility}</div>`;
        }
        
        // Add directions button
        content += `
            <div style="margin: 12px 0 5px;">
                <button onclick="setDestinationToPlace('${place.name}', ${place.location.lat}, ${place.location.lng})" 
                        style="background-color: #1A73E8; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                    Get Directions
                </button>
            </div>
        `;
        
        content += `</div>`;
        
        return content;
    } catch (e) {
        debug(`Error creating info window content: ${e.message}`);
        return `<div>${place.name}</div>`;
    }
}

// Function to set a place as destination for navigation
function setDestinationToPlace(name, lat, lng) {
    try {
        const coords = { lat: lat, lng: lng };
        
        // If we already have a start location (likely the user's current location)
        if (startMarker) {
            setEndLocation(name, coords);
            calculateAndShowRoute();
            speak(`Setting destination to ${name} and calculating route`);
        } else {
            // If no start location is set, ask if user wants to use current location
            if (userLocation) {
                showDialog(
                    "Use Current Location?",
                    `Would you like to get directions from your current location to ${name}?`,
                    // Yes callback
                    function() {
                        setStartLocation(userLocation.name, userLocation.coords);
                        setEndLocation(name, coords);
                        calculateAndShowRoute();
                        speak(`Calculating route from your location to ${name}`);
                    },
                    // No callback
                    function() {
                        // Just focus on the destination without routing
                        goToLocation(name, coords);
                        speak(`Showing location of ${name} on the map`);
                    }
                );
            } else {
                // No user location available, just focus on the destination
                goToLocation(name, coords);
                speak(`Showing location of ${name} on the map`);
            }
        }
    } catch (e) {
        debug(`Error setting destination: ${e.message}`);
    }
}

// Function to speak a brief summary of a place
function speakPlaceSummary(place) {
    const summary = `${place.name}. ${place.description ? place.description.split('.')[0] + '.' : ''}`;
    speak(summary);
}

// Find a place by name and describe it
function findAndDescribePlace(placeName) {
    try {
        let foundPlace = null;
        let category = null;
        
        // Search through all categories
        for (const cat in placesData) {
            const places = placesData[cat];
            const found = places.find(p => 
                p.name.toLowerCase().includes(placeName) || 
                placeName.includes(p.name.toLowerCase())
            );
            
            if (found) {
                foundPlace = found;
                category = cat;
                break;
            }
        }
        
        if (foundPlace) {
            // Clear existing markers and add this one
            clearCustomMarkers();
            
            // Create a marker for this place
            createEnhancedPlaceMarker(foundPlace, 0, category);
            
            // Center map on the place
            map.setCenter(foundPlace.location);
            map.setZoom(15);
            
            // Speak detailed description
            let description = `${foundPlace.name} is located at ${foundPlace.address}. `;
            description += foundPlace.description || '';
            
            if (foundPlace.rating) {
                description += ` It has a rating of ${foundPlace.rating.toFixed(1)} out of 5 based on ${foundPlace.user_ratings_total} reviews.`;
            }
            
            speak(description);
            
            // Auto-open the info window
            setTimeout(() => {
                if (placesInfoWindows.length > 0) {
                    // Close any open info window
                    if (currentInfoWindow) {
                        currentInfoWindow.close();
                    }
                    
                    // Open the info window for this place
                    placesInfoWindows[0].open(map, placesMarkers[0]);
                    currentInfoWindow = placesInfoWindows[0];
                }
            }, 500);
            
            return true;
        }
        
        return false;
    } catch (e) {
        debug(`Error in findAndDescribePlace: ${e.message}`);
        return false;
    }
}

// Display a summary panel of nearby places
function showPlacesSummaryPanel(places, category) {
    try {
        // Create or get the summary panel element
        let summaryPanel = document.getElementById('places-summary-panel');
        
        if (!summaryPanel) {
            summaryPanel = document.createElement('div');
            summaryPanel.id = 'places-summary-panel';
            summaryPanel.style.cssText = `
                position: absolute;
                top: 80px;
                right: 10px;
                background: white;
                padding: 10px;
                border-radius: 4px;
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
                z-index: 1000;
                max-width: 300px;
                max-height: 400px;
                overflow-y: auto;
                font-size: 12px;
            `;
            document.body.appendChild(summaryPanel);
        }
        
        // Clear previous content
        summaryPanel.innerHTML = '';
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ccc;
        `;
        header.textContent = `Nearby ${category.replace('_', ' ')}`;
        summaryPanel.appendChild(header);
        
        // Add places
        places.forEach((place, index) => {
            const placeItem = document.createElement('div');
            placeItem.className = 'place-item';
            placeItem.style.cssText = `
                padding: 8px;
                border-bottom: 1px solid #eee;
                cursor: pointer;
            `;
            
            // Add click handler
            placeItem.onclick = function() {
                // Center on this place
                map.setCenter(place.location);
                map.setZoom(16);
                
                // Trigger marker click to show info window
                google.maps.event.trigger(placesMarkers[index], 'click');
            };
            
            // Format distance
            const distance = place.distance < 1 ? 
                `${Math.round(place.distance * 1000)} m` : 
                `${place.distance.toFixed(1)} km`;
            
            // Create content
            placeItem.innerHTML = `
                <div style="font-weight: bold;">${index + 1}. ${place.name}</div>
                <div style="font-size: 11px;">${place.category}</div>
                <div style="font-size: 11px; display: flex; justify-content: space-between; margin-top: 4px;">
                    <span>${distance} away</span>
                    ${place.rating ? `<span style="color: #FFC107;">★ ${place.rating.toFixed(1)}</span>` : ''}
                </div>
            `;
            
            summaryPanel.appendChild(placeItem);
        });
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            margin-top: 10px;
            padding: 5px 10px;
            background-color: #f1f1f1;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
        `;
        closeButton.onclick = function() {
            summaryPanel.style.display = 'none';
        };
        summaryPanel.appendChild(closeButton);
        
        // Show the panel
        summaryPanel.style.display = 'block';
    } catch (e) {
        debug(`Error showing places summary panel: ${e.message}`);
    }
}

// Clear custom markers from the map
function clearCustomMarkers() {
    // Clear place-specific markers
    for (let i = 0; i < placesMarkers.length; i++) {
        placesMarkers[i].setMap(null);
    }
    placesMarkers = [];
    
    // Clear info windows
    placesInfoWindows = [];
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
    }
    
    // Hide any places summary panel
    const summaryPanel = document.getElementById('places-summary-panel');
    if (summaryPanel) {
        summaryPanel.style.display = 'none';
    }
}

// Function to detect and handle new custom commands
// This should be added to the existing speech recognition result handler
function handleCustomVoiceCommands(transcript) {
    // First try the enhanced command processor
    if (enhancedProcessVoiceCommand(transcript)) {
        return true; // Command was handled
    }
    
    // If not handled, let the original function process it
    return false;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

// Function to modify the existing processVoiceCommand to check our commands first
function modifyExistingVoiceCommand() {
    // Store reference to the original function
    const originalProcessVoiceCommand = window.processVoiceCommand;
    
    // Replace with enhanced version
    window.processVoiceCommand = function(command) {
        try {
            debug('Processing command (enhanced): ' + command);
            
            // First try our enhanced processor
            if (enhancedProcessVoiceCommand(command)) {
                return; // Command was handled
            }
            
            // If not handled, call the original function
            return originalProcessVoiceCommand(command);
        } catch (e) {
            debug('Error in enhanced voice command processing: ' + e.message);
            // Fall back to original processor
            return originalProcessVoiceCommand(command);
        }
    };
    
    debug("Voice command processing enhanced with places database");
}

// Initialize our enhanced system
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the map to initialize first
    setTimeout(() => {
        initPlacesDatabase();
        
        // After database is loaded, modify the command processor
        setTimeout(() => {
            modifyExistingVoiceCommand();
        }, 1000);
    }, 3000);
});

// This function could be called when clearing the map
function resetPlacesSystem() {
    clearCustomMarkers();
}

// For debugging purposes
function testPlacesSystem() {
    if (!placesData) {
        debug("Places data not loaded. Cannot test.");
        return;
    }
    
    debug(`Places database contains ${Object.keys(placesData).length} categories`);
    
    // Display a random category as a test
    const categories = Object.keys(placesData);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    debug(`Testing with random category: ${randomCategory}`);
    showNearbyPlaces(randomCategory);
}

// Add global window functions for integration
window.clearCustomMarkers = clearCustomMarkers;
window.setDestinationToPlace = setDestinationToPlace;
window.testPlacesSystem = testPlacesSystem;