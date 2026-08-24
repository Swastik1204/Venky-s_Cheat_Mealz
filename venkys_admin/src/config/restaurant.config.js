// Centralized Restaurant Configuration
// Single source of truth for restaurant branding, location defaults, and contact details.

export const RESTAURANT_CONFIG = {
  brand: {
    name: "Venky's Chicken Xperience Durgapur",
    shortName: "Venky's",
    tagline: 'Admin dashboard & POS for Venky\'s Chicken Xperience Durgapur.',
    receiptTitle: "Venky's Cheat Mealz",
    receiptSubtitle: 'Durgapur, West Bengal',
  },
  location: {
    city: 'Durgapur',
    state: 'West Bengal',
    country: 'India',
    defaultCoordinates: {
      lat: 23.5204,
      lng: 87.3119,
    },
    defaultRadiusKm: 8,
  },
  contact: {
    email: 'venkysdgp@gmail.com',
    supportEmail: 'venkysdgp@gmail.com',
    phone: '+91 98765 43210',
    address: 'City Centre, Durgapur, West Bengal 713216',
  },
  defaults: {
    currency: '₹',
    currencyCode: 'INR',
  },
}

export default RESTAURANT_CONFIG
