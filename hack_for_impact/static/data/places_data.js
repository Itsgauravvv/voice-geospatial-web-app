const placesDatabase = {
    "restaurants": [
        {
            "id": "rest001",
            "name": "Karim's",
            "location": {
                "lat": 28.6506,
                "lng": 77.2347
            },
            "address": "16, Gali Kababian, Jama Masjid, Chandni Chowk, New Delhi",
            "category": "North Indian, Mughlai",
            "rating": 4.6,
            "user_ratings_total": 29873,
            "price_level": 2,
            "description": "Iconic restaurant serving authentic Mughlai cuisine since 1913. Famous for kebabs and biryanis.",
            "phone": "+91-11-23269880",
            "website": "https://www.karimshotels.com/",
            "opening_hours": {
                "monday": "12:00 PM - 11:00 PM",
                "tuesday": "12:00 PM - 11:00 PM",
                "wednesday": "12:00 PM - 11:00 PM",
                "thursday": "12:00 PM - 11:00 PM",
                "friday": "12:00 PM - 11:00 PM",
                "saturday": "12:00 PM - 11:00 PM",
                "sunday": "12:00 PM - 11:00 PM"
            },
            "popular_dishes": ["Mutton Burra", "Chicken Jahangiri", "Mutton Biryani"],
            "photos": ["karim1.jpg", "karim2.jpg"],
            "parking_available": "Limited street parking",
            "accessibility": "Limited accessibility for wheelchairs",
            "facilities": ["Indoor seating", "Takeaway"]
        },
        // Other restaurant entries...
    ],
    "transportation": [
        {
            "id": "trans001",
            "name": "Indira Gandhi International Airport",
            "location": {
                "lat": 28.5562,
                "lng": 77.1000
            },
            "address": "New Delhi",
            "category": "Airport",
            "rating": 4.5,
            "user_ratings_total": 89632,
            "description": "Delhi's international airport serving both domestic and international flights. Features modern terminals with various amenities.",
            "phone": "+91-11-24651800",
            "website": "https://www.newdelhiairport.in/",
            "photos": ["igi1.jpg", "igi2.jpg"],
            "parking_available": "Paid parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Lounges", "Restaurants", "Duty-Free Shops", "Currency Exchange", "Car Rental"]
        },
        // Other transportation entries...
    ],
    "hotels": [
        {
            "id": "hotel001",
            "name": "The Leela Palace",
            "location": {
                "lat": 28.5988,
                "lng": 77.2183
            },
            "address": "Diplomatic Enclave, Chanakyapuri, New Delhi",
            "category": "5-Star Luxury",
            "rating": 4.8,
            "user_ratings_total": 7845,
            "price_level": 4,
            "description": "Opulent 5-star hotel featuring palatial architecture, elegant rooms, and world-class amenities.",
            "phone": "+91-11-39331234",
            "website": "https://www.theleela.com/the-leela-palace-new-delhi/",
            "check_in": "2:00 PM",
            "check_out": "12:00 PM",
            "amenities": ["Outdoor Pool", "Spa", "Fitness Center", "Free Wi-Fi", "Room Service", "Restaurant", "Bar", "Business Center"],
            "photos": ["leela1.jpg", "leela2.jpg"],
            "parking_available": "Valet parking available",
            "accessibility": "Wheelchair accessible"
        },
        // Other hotel entries...
    ],
    "educational_institutions": [
        {
            "id": "edu001",
            "name": "Indraprastha Institute of Information Technology Delhi",
            "location": {
                "lat": 28.5459,
                "lng": 77.2732
            },
            "address": "Okhla Industrial Estate, Phase III, New Delhi",
            "category": "University, Technical Institute",
            "rating": 4.6,
            "user_ratings_total": 3475,
            "description": "Premier institute for education and research in IT and interdisciplinary areas. Known for computer science, electronics and communications engineering programs.",
            "phone": "+91-11-26907400",
            "website": "https://www.iiitd.ac.in/",
            "founded": 2008,
            "programs": ["B.Tech", "M.Tech", "Ph.D"],
            "photos": ["iiitd1.jpg", "iiitd2.jpg"],
            "parking_available": "Available for students and faculty",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Library", "Computer Labs", "Sports Complex", "Cafeteria", "Hostel"]
        },
        // Other educational institution entries...
    ],
    "attractions": [
        {
            "id": "attr001",
            "name": "India Gate",
            "location": {
                "lat": 28.6129,
                "lng": 77.2295
            },
            "address": "Rajpath, New Delhi",
            "category": "Monument, Historical",
            "rating": 4.6,
            "user_ratings_total": 89563,
            "description": "Iconic war memorial built in honor of soldiers who died during World War I. Popular spot for locals and tourists alike.",
            "phone": "N/A",
            "website": "https://delhitourism.gov.in/delhitourism/tourist_place/india_gate.jsp",
            "timings": "Open 24 hours",
            "entry_fee": "Free",
            "photos": ["indiagate1.jpg", "indiagate2.jpg"],
            "parking_available": "Street parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Gardens", "Street Food Vendors", "Light Show (evenings)"]
        },

        {
            "id": "attr002",
            "name": "Lotus Temple",
            "location": {
                "lat": 28.5535,
                "lng": 77.2588
            },
            "address": "Lotus Temple Road, Bahapur, New Delhi",
            "category": "Religious Site, Architectural",
            "rating": 4.6,
            "user_ratings_total": 59874,
            "description": "Distinctive lotus-shaped Bahá'í House of Worship, known for its unique architecture and peaceful atmosphere.",
            "phone": "+91-11-26444029",
            "website": "https://www.bahaihouseofworship.in/",
            "timings": "9:00 AM - 5:30 PM (Closed on Mondays)",
            "entry_fee": "Free",
            "photos": ["lotus1.jpg", "lotus2.jpg"],
            "parking_available": "Free parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Gardens", "Information Center", "Meditation Halls"]
        },

        {
            "id": "attr003",
            "name": "Garden of Five Senses",
            "location": {
                "lat": 28.5133,
                "lng": 77.2035
            },
            "address": "Said-ul-Ajaib Village, M.B. Road, New Delhi",
            "category": "Park, Recreation",
            "rating": 4.3,
            "user_ratings_total": 12568,
            "description": "Sprawling garden complex designed to stimulate the five senses with diverse plants, sculptures, and interactive installations.",
            "phone": "+91-11-41050000",
            "website": "https://delhitourism.gov.in/delhitourism/tourist_place/garden_of_five_senses.jsp",
            "timings": "9:00 AM - 7:00 PM",
            "entry_fee": "₹30 for adults",
            "photos": ["fivesenses1.jpg", "fivesenses2.jpg"],
            "parking_available": "Paid parking available",
            "accessibility": "Partially wheelchair accessible",
            "facilities": ["Food Court", "Amphitheatre", "Art Gallery", "Souvenir Shop"]
        },
        {
            "id": "attr004",
            "name": "Kalkaji Temple",
            "location": {
                "lat": 28.5504,
                "lng": 77.2640
            },
            "address": "Kalkaji, New Delhi",
            "category": "Religious Site, Temple",
            "rating": 4.5,
            "user_ratings_total": 8965,
            "description": "Ancient Hindu temple dedicated to Goddess Kali, a significant religious site in South Delhi.",
            "phone": "N/A",
            "website": "N/A",
            "timings": "5:00 AM - 10:00 PM",
            "entry_fee": "Free",
            "photos": ["kalkaji1.jpg", "kalkaji2.jpg"],
            "parking_available": "Limited parking available",
            "accessibility": "Limited accessibility",
            "facilities": ["Prayer Hall", "Water Facilities"]
        },
        {
            "id": "attr005",
            "name": "Asola Bhatti Wildlife Sanctuary",
            "location": {
                "lat": 28.4742,
                "lng": 77.2304
            },
            "address": "Dr. Karni Singh Shooting Range Road, Asola, New Delhi",
            "category": "Wildlife Sanctuary, Nature",
            "rating": 4.2,
            "user_ratings_total": 3254,
            "description": "Protected forest area in the Delhi Ridge, offering hiking trails and opportunities to spot native wildlife.",
            "phone": "+91-11-26055700",
            "website": "https://forest.delhigovt.nic.in/",
            "timings": "9:00 AM - 5:00 PM",
            "entry_fee": "₹10 for Indians, ₹50 for foreigners",
            "photos": ["asola1.jpg", "asola2.jpg"],
            "parking_available": "Free parking available",
            "accessibility": "Limited accessibility due to terrain",
            "facilities": ["Nature Interpretation Center", "Hiking Trails"]
        },
        {
            "id": "attr006",
            "name": "Select Citywalk Mall",
            "location": {
                "lat": 28.5290,
                "lng": 77.2190
            },
            "address": "A-3, District Centre, Saket, New Delhi",
            "category": "Shopping Mall, Entertainment",
            "rating": 4.6,
            "user_ratings_total": 48965,
            "description": "Upscale shopping mall featuring international brands, entertainment options, and a variety of dining choices.",
            "phone": "+91-11-42114200",
            "website": "https://www.selectcitywalk.com/",
            "timings": "11:00 AM - 9:00 PM",
            "entry_fee": "Free",
            "photos": ["selectcitywalk1.jpg", "selectcitywalk2.jpg"],
            "parking_available": "Paid parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Food Court", "Multiplex", "Kids Play Area", "Restrooms"]
        }
        // Other attraction entries...
    ],
    "shopping": [
        {
            "id": "shop001",
            "name": "Connaught Place",
            "location": {
                "lat": 28.6315,
                "lng": 77.2167
            },
            "address": "Connaught Place, New Delhi",
            "category": "Shopping District",
            "rating": 4.5,
            "user_ratings_total": 58967,
            "description": "Historic shopping district featuring a mix of global brands, local boutiques, restaurants, and entertainment options.",
            "website": "https://ndmc.gov.in/",
            "timings": "11:00 AM - 9:00 PM (Most stores)",
            "photos": ["cp1.jpg", "cp2.jpg"],
            "parking_available": "Paid underground parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Restaurants", "Cafes", "ATMs", "Metro Station"]
        },
        {
            "id": "shop002",
            "name": "DLF Avenue Mall",
            "location": {
                "lat": 28.5289,
                "lng": 77.2201
            },
            "address": "Press Enclave Road, Saket, New Delhi",
            "category": "Shopping Mall",
            "rating": 4.3,
            "user_ratings_total": 25486,
            "description": "Modern shopping mall with a mix of international and local brands, dining options, and entertainment facilities.",
            "phone": "+91-11-46042142",
            "website": "https://dlf.in/malls/dlf-avenue/",
            "timings": "11:00 AM - 9:00 PM",
            "photos": ["dlfavenue1.jpg", "dlfavenue2.jpg"],
            "parking_available": "Paid parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Food Court", "Multiplex", "Restrooms", "ATMs"]
        },
        {
            "id": "shop003",
            "name": "Central Square Mall",
            "location": {
                "lat": 28.5475,
                "lng": 77.2524
            },
            "address": "Nehru Place, New Delhi",
            "category": "Shopping Mall",
            "rating": 4.0,
            "user_ratings_total": 12547,
            "description": "Multi-level shopping mall in the commercial hub of Nehru Place with various retail stores and eating outlets.",
            "phone": "+91-11-41600688",
            "website": "N/A",
            "timings": "10:30 AM - 8:30 PM",
            "photos": ["centralsquare1.jpg", "centralsquare2.jpg"],
            "parking_available": "Paid parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Food Court", "Gaming Zone", "Restrooms", "ATMs"]
        },
        {
            "id": "shop004",
            "name": "Epicuria Food Mall",
            "location": {
                "lat": 28.5491,
                "lng": 77.2521
            },
            "address": "Nehru Place Metro Station, New Delhi",
            "category": "Food Mall",
            "rating": 4.4,
            "user_ratings_total": 14587,
            "description": "Popular food mall with a variety of restaurants and cafes, located at Nehru Place Metro Station.",
            "phone": "+91-11-41607800",
            "website": "https://www.epicuria.co.in/",
            "timings": "11:00 AM - 11:00 PM",
            "photos": ["epicuria1.jpg", "epicuria2.jpg"],
            "parking_available": "Metro parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Restaurants", "Pubs", "Cafes", "Restrooms"]
        },
        {
            "id": "shop005",
            "name": "Lajpat Nagar Central Market",
            "location": {
                "lat": 28.5696,
                "lng": 77.2376
            },
            "address": "Lajpat Nagar II, New Delhi",
            "category": "Market",
            "rating": 4.2,
            "user_ratings_total": 35486,
            "description": "Popular shopping market known for clothing, accessories, home decor items, and street food.",
            "phone": "N/A",
            "website": "N/A",
            "timings": "11:00 AM - 8:00 PM (Closed on Mondays)",
            "photos": ["lajpatmarket1.jpg", "lajpatmarket2.jpg"],
            "parking_available": "Limited street parking",
            "accessibility": "Limited accessibility",
            "facilities": ["Street Food", "ATMs", "Public Restrooms"]
        },
        {
            "id": "shop006",
            "name": "DLF Mall of India",
            "location": {
                "lat": 28.5677,
                "lng": 77.3520
            },
            "address": "Sector 18, Noida",
            "category": "Shopping Mall, Entertainment",
            "rating": 4.5,
            "user_ratings_total": 68475,
            "description": "One of the largest malls in India with international brands, entertainment zones, and diverse dining options.",
            "phone": "+91-120-7119400",
            "website": "https://www.mallofindia.in/",
            "timings": "10:00 AM - 10:00 PM",
            "photos": ["dlf_moi1.jpg", "dlf_moi2.jpg"],
            "parking_available": "Large parking facility available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Food Court", "Snow Park", "Multiplex", "Gaming Zone", "Premium Lounges"]
        }
        // Other shopping entries...
    ],
    "healthcare": [
        {
            "id": "health001",
            "name": "All India Institute of Medical Sciences (AIIMS)",
            "location": {
                "lat": 28.5672,
                "lng": 77.2100
            },
            "address": "Ansari Nagar East, New Delhi",
            "category": "Government Hospital, Research Institute",
            "rating": 4.5,
            "user_ratings_total": 15623,
            "description": "India's premier public medical research and teaching hospital offering specialized care across all disciplines.",
            "phone": "+91-11-26588500",
            "website": "https://www.aiims.edu/",
            "emergency": "Yes (24 hours)",
            "specialties": ["General Medicine", "Cardiology", "Neurology", "Oncology", "Pediatrics", "Surgery"],
            "photos": ["aiims1.jpg", "aiims2.jpg"],
            "parking_available": "Available for patients",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Emergency Services", "Outpatient Departments", "Inpatient Wards", "Diagnostics", "Pharmacy"]
        },

        {
            "id": "health002",
            "name": "Apollo Hospital",
            "location": {
                "lat": 28.5614,
                "lng": 77.2829
            },
            "address": "Sarita Vihar, Delhi Mathura Road, New Delhi",
            "category": "Multi-specialty Hospital",
            "rating": 4.4,
            "user_ratings_total": 8752,
            "description": "Leading multi-specialty hospital with advanced medical facilities and experienced healthcare professionals.",
            "phone": "+91-11-71791000",
            "website": "https://delhi.apollohospitals.com/",
            "emergency": "Yes (24 hours)",
            "specialties": ["Cardiology", "Neurology", "Orthopedics", "Oncology", "General Surgery", "Pediatrics"],
            "photos": ["apollo1.jpg", "apollo2.jpg"],
            "parking_available": "Free parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Emergency Services", "ICU", "OPD", "Diagnostics", "Pharmacy", "Cafeteria"]
        },
        {
            "id": "health003",
            "name": "Max Super Speciality Hospital",
            "location": {
                "lat": 28.5685,
                "lng": 77.2721
            },
            "address": "1, 2, Press Enclave Road, Saket, New Delhi",
            "category": "Multi-specialty Hospital",
            "rating": 4.3,
            "user_ratings_total": 7463,
            "description": "Premier healthcare facility offering comprehensive medical services with state-of-the-art technology.",
            "phone": "+91-11-26515050",
            "website": "https://www.maxhealthcare.in/",
            "emergency": "Yes (24 hours)",
            "specialties": ["Cardiac Sciences", "Neurosciences", "Orthopedics", "Cancer Care", "Transplants"],
            "photos": ["maxsaket1.jpg", "maxsaket2.jpg"],
            "parking_available": "Paid parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Emergency Services", "ICU", "OPD", "Diagnostics", "Pharmacy", "Cafeteria"]
        },
        {
            "id": "health004",
            "name": "Holy Family Hospital",
            "location": {
                "lat": 28.5593,
                "lng": 77.2766
            },
            "address": "Okhla Road, Jamia Nagar, Okhla, New Delhi",
            "category": "General Hospital",
            "rating": 4.1,
            "user_ratings_total": 3542,
            "description": "Established hospital providing quality healthcare services at affordable rates.",
            "phone": "+91-11-26845900",
            "website": "https://www.holyfamilyhospitaldelhi.org/",
            "emergency": "Yes (24 hours)",
            "specialties": ["General Medicine", "Obstetrics & Gynecology", "Pediatrics", "Surgery", "Orthopedics"],
            "photos": ["holyfamily1.jpg", "holyfamily2.jpg"],
            "parking_available": "Limited parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Emergency Services", "ICU", "OPD", "Diagnostics", "Pharmacy"]
        },
        {
            "id": "health005",
            "name": "Fortis Escorts Heart Institute",
            "location": {
                "lat": 28.5598,
                "lng": 77.2733
            },
            "address": "Okhla Road, New Delhi",
            "category": "Specialty Hospital, Cardiac Care",
            "rating": 4.5,
            "user_ratings_total": 6854,
            "description": "Renowned cardiac hospital specializing in heart-related treatments and surgeries.",
            "phone": "+91-11-47135000",
            "website": "https://www.fortishealthcare.com/",
            "emergency": "Yes (24 hours)",
            "specialties": ["Cardiology", "Cardiac Surgery", "Electrophysiology", "Interventional Cardiology"],
            "photos": ["fortisescorts1.jpg", "fortisescorts2.jpg"],
            "parking_available": "Free parking available",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Emergency Services", "Cardiac ICU", "OPD", "Diagnostics", "Pharmacy", "Cafeteria"]
        },
        {
            "id": "health006",
            "name": "Dr. Lal PathLabs - Kalkaji",
            "location": {
                "lat": 28.5486,
                "lng": 77.2678
            },
            "address": "E-216, Greater Kailash II, New Delhi",
            "category": "Diagnostic Center",
            "rating": 4.2,
            "user_ratings_total": 2854,
            "description": "Leading diagnostic chain offering a wide range of laboratory tests and health check-up packages.",
            "phone": "+91-11-39885050",
            "website": "https://www.lalpathlabs.com/",
            "timings": "7:00 AM - 7:00 PM",
            "photos": ["lalpath1.jpg", "lalpath2.jpg"],
            "parking_available": "Street parking",
            "accessibility": "Wheelchair accessible",
            "facilities": ["Home Sample Collection", "Online Reports", "Health Packages"]
        }
        // Other healthcare entries...
    ]
};
window.placesDatabase = placesDatabase;