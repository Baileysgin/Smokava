require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('../models/Package');
const Restaurant = require('../models/Restaurant');

const packages = [
  {
    name: '10 Pack',
    nameFa: 'پکیج ۱۰ تایی',
    count: 10,
    price: 500000,
    badge: null
  },
  {
    name: '30 Pack',
    nameFa: 'پکیج ۳۰ تایی',
    count: 30,
    price: 1300000,
    badge: 'popular'
  },
  {
    name: '50 Pack',
    nameFa: 'پکیج ۵۰ تایی',
    count: 50,
    price: 2000000,
    badge: 'special'
  }
];

const restaurants = [
  {
    name: 'Niayaran Restaurant',
    nameFa: 'رستوران نیاوران',
    address: 'Niayaran St, Tehran',
    addressFa: 'تهران، نیاوران، خیابان شهید باقری',
    location: {
      type: 'Point',
      coordinates: [51.4412, 35.8065]
    },
    phone: '021-22222222',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    rating: 4.8,
    reviews: 234,
    flavors: 12,
    distance: '۲.۳ کیلومتر',
    popular: true,
    accepted: true
  },
  {
    name: 'Velenjak Restaurant',
    nameFa: 'رستوران ولنجک',
    address: 'Velenjak St, Tehran',
    addressFa: 'تهران، ولنجک، خیابان ولنجک',
    location: {
      type: 'Point',
      coordinates: [51.4019, 35.8014]
    },
    phone: '021-22333333',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
    rating: 4.6,
    reviews: 189,
    flavors: 18,
    distance: '۵.۷ کیلومتر',
    popular: false,
    accepted: true
  },
  {
    name: 'Tajrish Restaurant',
    nameFa: 'رستوران تجریش',
    address: 'Tajrish Square, Tehran',
    addressFa: 'تهران، میدان تجریش',
    location: {
      type: 'Point',
      coordinates: [51.4268, 35.8044]
    },
    phone: '021-22444444',
    image: 'https://images.unsplash.com/photo-1578591887-f2e8e93a3d6d?w=400&h=300&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1578591887-f2e8e93a3d6d?w=400&h=300&fit=crop',
    rating: 4.9,
    reviews: 456,
    flavors: 15,
    distance: '۱.۵ کیلومتر',
    popular: true,
    accepted: true
  },
  {
    name: 'Zafaranieh Restaurant',
    nameFa: 'رستوران زعفرانیه',
    address: 'Zafaranieh St, Tehran',
    addressFa: 'تهران، زعفرانیه، خیابان اصلی',
    location: {
      type: 'Point',
      coordinates: [51.4333, 35.8089]
    },
    phone: '021-22555555',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
    rating: 4.7,
    reviews: 312,
    flavors: 20,
    distance: '۳.۲ کیلومتر',
    popular: false,
    accepted: true
  },
  {
    name: 'Hermanos Restaurant',
    nameFa: 'رستوران هرمانوس',
    address: 'Tehran, Iran',
    addressFa: 'تهران، ایران',
    location: {
      type: 'Point',
      coordinates: [51.4200, 35.8000]
    },
    phone: '021-22666666',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    rating: 4.5,
    reviews: 150,
    flavors: 10,
    distance: '۴.۰ کیلومتر',
    popular: true,
    accepted: true
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava');
    console.log('Connected to MongoDB');

    // Safety check: Only clear data if explicitly requested via CLEAR_DATA=true
    const shouldClearData = process.env.CLEAR_DATA === 'true' || process.argv.includes('--clear');

    if (shouldClearData) {
      console.log('⚠️  WARNING: Clearing existing Package and Restaurant data...');

      // Count existing data before deletion
      const packageCount = await Package.countDocuments();
      const restaurantCount = await Restaurant.countDocuments();

      if (packageCount > 0 || restaurantCount > 0) {
        console.log(`Found ${packageCount} packages and ${restaurantCount} restaurants`);
        console.log('Deleting existing data...');
      }

      await Package.deleteMany({});
      await Restaurant.deleteMany({});
      console.log('✅ Existing data cleared');
    } else {
      console.log('ℹ️  Skipping data deletion (use CLEAR_DATA=true or --clear flag to clear existing data)');
      console.log('ℹ️  Checking for existing data...');

      const existingPackages = await Package.countDocuments();
      const existingRestaurants = await Restaurant.countDocuments();

      if (existingPackages > 0 || existingRestaurants > 0) {
        console.log(`⚠️  Found ${existingPackages} packages and ${existingRestaurants} restaurants already in database`);
        console.log('⚠️  Skipping insertion to prevent duplicates');
        console.log('⚠️  To replace existing data, run: CLEAR_DATA=true npm run seed');
        process.exit(0);
      }
    }

    // Insert packages - check each one individually to avoid duplicates
    let packageInsertedCount = 0;
    let packageSkippedCount = 0;

    for (const pkg of packages) {
      const existing = await Package.findOne({ name: pkg.name });
      if (!existing) {
        await Package.create(pkg);
        packageInsertedCount++;
        console.log(`✅ Inserted package: ${pkg.name}`);
      } else {
        packageSkippedCount++;
        console.log(`ℹ️  Package already exists: ${pkg.name}`);
      }
    }

    console.log(`✅ Package seeding complete: ${packageInsertedCount} inserted, ${packageSkippedCount} skipped`);

    // Insert restaurants - check each one individually to avoid duplicates
    let insertedCount = 0;
    let skippedCount = 0;

    for (const restaurant of restaurants) {
      const existing = await Restaurant.findOne({ name: restaurant.name });
      if (!existing) {
        await Restaurant.create(restaurant);
        insertedCount++;
        console.log(`✅ Inserted restaurant: ${restaurant.name}`);
      } else {
        skippedCount++;
        console.log(`ℹ️  Restaurant already exists: ${restaurant.name}`);
      }
    }

    console.log(`✅ Restaurant seeding complete: ${insertedCount} inserted, ${skippedCount} skipped`);

    console.log('✅ Seed operation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
