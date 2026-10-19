// Centralized Mock Data System for DONOR ↔ RECEIVER BRIDGE PLATFORM

export const MOCK_NGOS = [];

export const MOCK_INITIAL_DONATIONS = [
  {
    "id": "DON-2026-00501",
    "title": "60 Servings Veg Biryani & Paneer Curry",
    "category": "Food",
    "itemName": "Veg Biryani & Paneer Curry",
    "excessDetails": "Freshly packed commercial buffet surplus in thermal foil containers",
    "quantity": 60,
    "unit": "servings",
    "foodType": "Cooked Food",
    "description": "Hot vegetarian cooked meals prepared for lunch buffet, untouched and ready for redistribution.",
    "condition": "Fresh / Cooked Today",
    "pickupLocation": "FC Road, Deccan Gymkhana, Pune",
    "pickupCoords": {
      "lat": 18.5196,
      "lng": 73.8412
    },
    "ngoCoords": null,
    "volunteerId": null,
    "volunteerName": null,
    "volunteerPhone": null,
    "volunteerCoords": null,
    "availabilityDate": "2026-08-23",
    "availabilityTime": "18:00 - 22:00",
    "expiryDate": "2026-08-24T02:00:00Z",
    "expiryTime": "2026-08-24T02:00:00Z",
    "urgency": "HIGH",
    "notes": "Please collect from the side dispatch door.",
    "status": "AVAILABLE",
    "matchedNgoId": null,
    "matchedNgoName": null,
    "createdAt": "2026-08-23T14:30:00Z",
    "donorName": "Green Bite Restaurant & Catering",
    "donorPhone": "+91 98111 22334",
    "trackingTimeline": [
      {
        "status": "CREATED",
        "label": "Donation Created",
        "timestamp": "2026-08-23T14:30:00Z",
        "completed": true
      },
      {
        "status": "MATCHED",
        "label": "Receiver Matched",
        "timestamp": null,
        "completed": false
      },
      {
        "status": "VOLUNTEER_ASSIGNED",
        "label": "Volunteer Assigned 🚴",
        "timestamp": null,
        "completed": false
      },
      {
        "status": "FOOD_PICKED_UP",
        "label": "Food Picked Up 🍱",
        "timestamp": null,
        "completed": false
      },
      {
        "status": "IN_TRANSIT",
        "label": "Out for Delivery 🚚",
        "timestamp": null,
        "completed": false
      },
      {
        "status": "DELIVERED",
        "label": "Delivered to NGO 📍",
        "timestamp": null,
        "completed": false
      }
    ],
    "location": {
      "lat": 18.5204,
      "lng": 73.8567
    },
    "type": "surplus"
  },
  {
    "id": "DON-2026-00502",
    "title": "35 kg Fresh Seasonal Vegetables & Fruits",
    "category": "Food",
    "itemName": "Seasonal Produce Box",
    "excessDetails": "35 kg sorted fresh tomatoes, potatoes, spinach, and apples",
    "quantity": 35,
    "unit": "kg",
    "foodType": "Raw Produce",
    "description": "Fresh farm-sourced produce crates suitable for community kitchen cooking.",
    "condition": "Fresh / Raw",
    "pickupLocation": "Market Yard, Gultekdi, Pune",
    "lat": 18.4968,
    "lng": 73.8652,
    "type": "surplus",
    "donorId": "donor-1",
    "donorName": "AgroFresh Wholesale Co.",
    "pickupCoords": {
      "lat": 18.489,
      "lng": 73.868
    },
    "ngoCoords": null,
    "volunteerId": null,
    "volunteerName": null,
    "volunteerPhone": null,
    "volunteerCoords": null,
    "availabilityDate": "2026-08-23",
    "availabilityTime": "10:00 - 20:00",
    "expiryDate": "2026-08-25T18:00:00Z",
    "expiryTime": "2026-08-25T18:00:00Z",
    "urgency": "MEDIUM",
    "notes": "Crates packed and ready in loading bay 3.",
    "status": "AVAILABLE",
    "matchedNgoId": null,
    "matchedNgoName": null,
    "createdAt": "2026-08-23T12:00:00Z",
    "donorPhone": "+91 98224 88990",
    "trackingTimeline": [
      {
        "status": "CREATED",
        "label": "Donation Created",
        "timestamp": "2026-08-23T12:00:00Z",
        "completed": true
      },
      {
        "status": "MATCHED",
        "label": "Receiver Matched",
        "timestamp": null,
        "completed": false
      },
      {
        "status": "VOLUNTEER_ASSIGNED",
        "label": "Volunteer Assigned 🚴",
        "timestamp": null,
        "completed": false
      },
      {
        "status": "FOOD_PICKED_UP",
        "label": "Food Picked Up 🍱",
        "timestamp": null,
        "completed": false
      },
      {
        "status": "IN_TRANSIT",
        "label": "Out for Delivery 🚚",
        "timestamp": null,
        "completed": false
      },
      {
        "status": "DELIVERED",
        "label": "Delivered to NGO 📍",
        "timestamp": null,
        "completed": false
      }
    ],
    "location": {
      "lat": 18.5206,
      "lng": 73.8421
    }
  },
  {
    "id": "DON-2026-00482",
    "title": "50 kg Basmati Rice & Grain Stock",
    "category": "Food",
    "itemName": "Basmati Rice",
    "excessDetails": "50 kg surplus raw Basmati rice sacks from restaurant inventory",
    "quantity": 50,
    "unit": "kg",
    "foodType": "Cooked Food",
    "description": "Sealed 25kg sacks of premium Basmati rice, freshly sourced for donation.",
    "condition": "New / Sealed",
    "pickupLocation": "FC Road, Deccan Gymkhana, Pune",
    "lat": 18.5196,
    "lng": 73.8411,
    "type": "surplus",
    "donorId": "donor-1",
    "donorName": "Green Bite Restaurant",
    "pickupCoords": {
      "lat": 18.5196,
      "lng": 73.8412
    },
    "ngoCoords": {
      "lat": 18.5308,
      "lng": 73.8474
    },
    "volunteerId": "vol-201",
    "volunteerName": "Rahul Verma (Rider)",
    "volunteerPhone": "+91 98233 44112",
    "volunteerCoords": {
      "lat": 18.524,
      "lng": 73.8445
    },
    "availabilityDate": "2026-08-17",
    "availabilityTime": "14:00 - 18:00",
    "urgency": "HIGH",
    "notes": "Please collect from the back kitchen gate.",
    "status": "VOLUNTEER_ASSIGNED",
    "matchedNgoId": "ngo-101",
    "matchedNgoName": "Helping Hands Foundation",
    "createdAt": "2026-08-16T10:30:00Z",
    "donorPhone": "+91 98111 22334",
    "trackingTimeline": [
      {
        "status": "CREATED",
        "label": "Donation Created",
        "timestamp": "2026-08-16T10:30:00Z",
        "completed": true
      },
      {
        "status": "MATCHED",
        "label": "Receiver Matched",
        "timestamp": "2026-08-16T11:15:00Z",
        "completed": true
      },
      {
        "status": "VOLUNTEER_ASSIGNED",
        "label": "Volunteer Assigned 🚴",
        "timestamp": "2026-08-16T11:45:00Z",
        "completed": true
      },
      {
        "status": "FOOD_PICKED_UP",
        "label": "Food Picked Up 🍱",
        "timestamp": null,
        "completed": false
      },
      {
        "status": "IN_TRANSIT",
        "label": "Out for Delivery 🚚",
        "timestamp": null,
        "completed": false
      },
      {
        "status": "DELIVERED",
        "label": "Delivered to NGO 📍",
        "timestamp": null,
        "completed": false
      }
    ],
    "location": {
      "lat": 18.5216,
      "lng": 73.84309999999999
    }
  },
  {
    "id": "DON-2026-00391",
    "title": "40 Hot Meals Catering Surplus",
    "category": "Food",
    "itemName": "Paneer Butter Masala & Rotis",
    "excessDetails": "40 hot cooked meal trays from wedding event catering excess",
    "quantity": 40,
    "unit": "Portions",
    "foodType": "Cooked Food",
    "description": "Freshly prepared vegetarian meals packed in thermal containers.",
    "condition": "Fresh / Cooked Today",
    "pickupLocation": "Aundh DP Road, Pune",
    "lat": 18.558,
    "lng": 73.8075,
    "type": "surplus",
    "donorId": "donor-1",
    "donorName": "Royal Spice Caterers",
    "pickupCoords": {
      "lat": 18.5602,
      "lng": 73.8031
    },
    "ngoCoords": {
      "lat": 18.5679,
      "lng": 73.9143
    },
    "volunteerId": "vol-202",
    "volunteerName": "Priya Sharma (Volunteer)",
    "volunteerPhone": "+91 98999 11223",
    "volunteerCoords": {
      "lat": 18.564,
      "lng": 73.85
    },
    "availabilityDate": "2026-08-16",
    "availabilityTime": "18:00 - 21:00",
    "urgency": "HIGH",
    "notes": "Hot food packed in insulated foil containers.",
    "status": "IN_TRANSIT",
    "matchedNgoId": "ngo-103",
    "matchedNgoName": "Seva Asha Community Shelter",
    "createdAt": "2026-08-16T12:00:00Z",
    "donorPhone": "+91 98222 55667",
    "trackingTimeline": [
      {
        "status": "CREATED",
        "label": "Donation Created",
        "timestamp": "2026-08-16T12:00:00Z",
        "completed": true
      },
      {
        "status": "MATCHED",
        "label": "Receiver Matched",
        "timestamp": "2026-08-16T12:20:00Z",
        "completed": true
      },
      {
        "status": "VOLUNTEER_ASSIGNED",
        "label": "Volunteer Assigned 🚴",
        "timestamp": "2026-08-16T12:35:00Z",
        "completed": true
      },
      {
        "status": "FOOD_PICKED_UP",
        "label": "Food Picked Up 🍱",
        "timestamp": "2026-08-16T13:10:00Z",
        "completed": true
      },
      {
        "status": "IN_TRANSIT",
        "label": "Out for Delivery 🚚",
        "timestamp": "2026-08-16T13:25:00Z",
        "completed": true
      },
      {
        "status": "DELIVERED",
        "label": "Delivered to NGO 📍",
        "timestamp": null,
        "completed": false
      }
    ],
    "location": {
      "lat": 18.5226,
      "lng": 73.8441
    }
  },
  {
    "id": "DON-2026-00215",
    "title": "15 Refurbished School Laptops",
    "category": "Electronics",
    "itemName": "Dell & HP Laptops",
    "excessDetails": "15 corporate surplus laptops reset for student digital labs",
    "quantity": 15,
    "unit": "Units",
    "foodType": "Other",
    "description": "Working laptops with Windows 10 & educational apps pre-installed.",
    "condition": "Refurbished",
    "pickupLocation": "Kharadi IT Park, Pune",
    "lat": 18.5515,
    "lng": 73.9348,
    "type": "surplus",
    "donorId": "donor-2",
    "donorName": "TechSolutions Pvt Ltd",
    "pickupCoords": {
      "lat": 18.5515,
      "lng": 73.9348
    },
    "ngoCoords": {
      "lat": 18.5089,
      "lng": 73.926
    },
    "volunteerId": "vol-203",
    "volunteerName": "Amit Deshmukh",
    "volunteerPhone": "+91 98765 43210",
    "volunteerCoords": {
      "lat": 18.5089,
      "lng": 73.926
    },
    "availabilityDate": "2026-08-12",
    "availabilityTime": "11:00 - 17:00",
    "urgency": "HIGH",
    "notes": "Chargers and carry bags included.",
    "status": "DELIVERED",
    "matchedNgoId": "ngo-104",
    "matchedNgoName": "Gyan Jyoti Shikshan Trust",
    "createdAt": "2026-08-11T14:00:00Z",
    "donorPhone": "+91 98765 43210",
    "trackingTimeline": [
      {
        "status": "CREATED",
        "label": "Donation Created",
        "timestamp": "2026-08-11T14:00:00Z",
        "completed": true
      },
      {
        "status": "MATCHED",
        "label": "Receiver Matched",
        "timestamp": "2026-08-11T15:30:00Z",
        "completed": true
      },
      {
        "status": "VOLUNTEER_ASSIGNED",
        "label": "Volunteer Assigned 🚴",
        "timestamp": "2026-08-12T09:30:00Z",
        "completed": true
      },
      {
        "status": "FOOD_PICKED_UP",
        "label": "Food Picked Up 🍱",
        "timestamp": "2026-08-12T11:45:00Z",
        "completed": true
      },
      {
        "status": "IN_TRANSIT",
        "label": "Out for Delivery 🚚",
        "timestamp": "2026-08-12T13:00:00Z",
        "completed": true
      },
      {
        "status": "DELIVERED",
        "label": "Delivered to NGO 📍",
        "timestamp": "2026-08-12T14:15:00Z",
        "completed": true
      }
    ],
    "location": {
      "lat": 18.552500000000002,
      "lng": 73.9358
    }
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Volunteer Assigned! 🚴',
    message: 'Rahul Verma accepted pickup for donation DON-2026-00482.',
    time: '5 mins ago',
    read: false,
    type: 'INFO'
  },
  {
    id: 'notif-2',
    title: 'Food Picked Up 🍱',
    message: 'Donation DON-2026-00391 has been picked up from donor address.',
    time: '1 hour ago',
    read: false,
    type: 'SUCCESS'
  },
  {
    id: 'notif-3',
    title: 'Out for Delivery 🚚',
    message: 'Volunteer is en route to Seva Asha Shelter.',
    time: '2 hours ago',
    read: true,
    type: 'WARNING'
  }
];


// ==========================================
// DEMO DATA - HARDCODED DONORS FOR SEEDING
// ==========================================
export const MOCK_DONORS = [
  {
    "id": "donor-1",
    "name": "Green Bite Restaurant & Catering",
    "type": "donor",
    "category": "restaurant",
    "area": "Deccan / FC Road",
    "lat": 18.5196,
    "lng": 73.8411,
    "isDemoData": true,
    "email": "contact@greenbite.demo",
    "phone": "+919999999991",
    "location": {
      "lat": 18.5196,
      "lng": 73.8411
    }
  },
  {
    "id": "donor-2",
    "name": "Fresh Farms Grocery",
    "type": "donor",
    "category": "grocery",
    "area": "Kharadi",
    "lat": 18.5515,
    "lng": 73.9348,
    "isDemoData": true,
    "email": "contact@freshfarms.demo",
    "phone": "+919999999992",
    "location": {
      "lat": 18.5515,
      "lng": 73.9348
    }
  },
  {
    "id": "donor-3",
    "name": "Daily Bread Bakery",
    "type": "donor",
    "category": "bakery",
    "area": "Viman Nagar",
    "lat": 18.5679,
    "lng": 73.9143,
    "isDemoData": true,
    "email": "contact@dailybread.demo",
    "phone": "+919999999993",
    "location": {
      "lat": 18.5679,
      "lng": 73.9143
    }
  }
];
