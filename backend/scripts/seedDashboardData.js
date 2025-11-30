require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Restaurant = require('../models/Restaurant');
const Package = require('../models/Package');
const UserPackage = require('../models/UserPackage');

// Persian names for fake users
const persianNames = [
  { firstName: 'علی', lastName: 'احمدی', username: 'user_ali' },
  { firstName: 'سارا', lastName: 'محمدی', username: 'user_sara' },
  { firstName: 'محمد', lastName: 'رضایی', username: 'user_mmd' },
  { firstName: 'فاطمه', lastName: 'کریمی', username: 'user_fateme' },
  { firstName: 'حسین', lastName: 'نوری', username: 'user_hossein' },
  { firstName: 'زهرا', lastName: 'حسینی', username: 'user_zahra' },
  { firstName: 'رضا', lastName: 'موسوی', username: 'user_reza' },
  { firstName: 'مریم', lastName: 'جعفری', username: 'user_maryam' },
  { firstName: 'امیر', lastName: 'کاظمی', username: 'user_amir' },
  { firstName: 'نازنین', lastName: 'صادقی', username: 'user_nazanin' },
  { firstName: 'پریسا', lastName: 'علیزاده', username: 'user_parisa' },
  { firstName: 'مهدی', lastName: 'رحمانی', username: 'user_mahdi' },
  { firstName: 'نیلوفر', lastName: 'فرهادی', username: 'user_niloufar' },
  { firstName: 'کامران', lastName: 'شریفی', username: 'user_kamran' },
  { firstName: 'شهرزاد', lastName: 'نظری', username: 'user_shahrzad' }
];

// Persian captions for posts
const persianCaptions = [
  'امروز قلیون کشیدم 😌',
  'عصر خوبی بود با دوستان 🍃',
  'طعم عالی بود! حتما دوباره میرم',
  'فضای دنج و قلیان خوشمزه 🔥',
  'بهترین قلیان این هفته!',
  'عاشق این طعم شدم 💚',
  'شب خوبی بود با قلیان و دوستان',
  'طعم جدید و جذاب! پیشنهاد می‌کنم',
  'فضای سنتی و قلیان عالی',
  'امروز تجربه جدیدی داشتم 🎉'
];

// Generate random date within last N days
function randomDate(daysAgo = 30) {
  const now = new Date();
  const days = Math.floor(Math.random() * daysAgo);
  const hours = Math.floor(Math.random() * 24);
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() - hours);
  return date;
}

// Get random avatar URL
function getRandomAvatar(index) {
  return `https://i.pravatar.cc/150?img=${index + 1}`;
}

async function seedDashboardData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava');
    console.log('✅ Connected to MongoDB\n');

    // Get or create packages
    let packages = await Package.find({});
    if (packages.length === 0) {
      console.log('📦 Creating packages...');
      packages = await Package.insertMany([
        { name: '10 Pack', nameFa: 'پکیج ۱۰ تایی', count: 10, price: 500000 },
        { name: '30 Pack', nameFa: 'پکیج ۳۰ تایی', count: 30, price: 1300000, badge: 'popular' },
        { name: '50 Pack', nameFa: 'پکیج ۵۰ تایی', count: 50, price: 2000000, badge: 'special' }
      ]);
      console.log(`✅ Created ${packages.length} packages\n`);
    } else {
      console.log(`✅ Found ${packages.length} existing packages\n`);
    }

    // Get or create restaurants
    let restaurants = await Restaurant.find({});
    if (restaurants.length === 0) {
      console.log('🏪 Creating restaurants...');
      restaurants = await Restaurant.insertMany([
        {
          name: 'Niayaran Restaurant',
          nameFa: 'رستوران نیاوران',
          address: 'Niayaran St, Tehran',
          addressFa: 'تهران، نیاوران',
          location: { type: 'Point', coordinates: [51.4412, 35.8065] },
          phone: '021-22222222',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
          accepted: true
        },
        {
          name: 'Velenjak Restaurant',
          nameFa: 'رستوران ولنجک',
          address: 'Velenjak St, Tehran',
          addressFa: 'تهران، ولنجک',
          location: { type: 'Point', coordinates: [51.4019, 35.8014] },
          phone: '021-22333333',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
          accepted: true
        },
        {
          name: 'Tajrish Restaurant',
          nameFa: 'رستوران تجریش',
          address: 'Tajrish Square, Tehran',
          addressFa: 'تهران، تجریش',
          location: { type: 'Point', coordinates: [51.4268, 35.8044] },
          phone: '021-22444444',
          image: 'https://images.unsplash.com/photo-1578591887-f2e8e93a3d6d?w=400&h=300&fit=crop',
          accepted: true
        }
      ]);
      console.log(`✅ Created ${restaurants.length} restaurants\n`);
    } else {
      console.log(`✅ Found ${restaurants.length} existing restaurants\n`);
    }

    // Create fake users
    console.log('👥 Creating users...');
    const fakeUsers = [];
    for (let i = 0; i < persianNames.length; i++) {
      const nameData = persianNames[i];
      const phoneNumber = `0912${1000000 + i}`;

      let user = await User.findOne({ phoneNumber });
      if (!user) {
        user = new User({
          phoneNumber,
          firstName: nameData.firstName,
          lastName: nameData.lastName,
          username: nameData.username,
          photoUrl: getRandomAvatar(i),
          name: `${nameData.firstName} ${nameData.lastName}`,
          avatar: getRandomAvatar(i),
          createdAt: randomDate(60)
        });
        await user.save();
        console.log(`  ✓ Created user: ${nameData.firstName} ${nameData.lastName}`);
      } else {
        console.log(`  - User exists: ${nameData.firstName} ${nameData.lastName}`);
      }
      fakeUsers.push(user);
    }
    console.log(`✅ Total users: ${fakeUsers.length}\n`);

    // Create UserPackages (sold packages)
    console.log('📦 Creating sold packages (UserPackages)...');
    let totalSold = 0;
    let totalConsumed = 0;

    // Create packages for 60% of users
    const usersWithPackages = fakeUsers.slice(0, Math.floor(fakeUsers.length * 0.6));

    for (const user of usersWithPackages) {
      // Each user can have 1-3 packages
      const numPackages = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numPackages; i++) {
        const randomPackage = packages[Math.floor(Math.random() * packages.length)];
        const purchaseDate = randomDate(90);

        // Some packages are fully consumed, some partially, some unused
        const consumptionRate = Math.random();
        let remainingCount, consumedCount;

        if (consumptionRate < 0.3) {
          // 30% fully consumed
          remainingCount = 0;
          consumedCount = randomPackage.count;
        } else if (consumptionRate < 0.7) {
          // 40% partially consumed
          consumedCount = Math.floor(Math.random() * (randomPackage.count * 0.8));
          remainingCount = randomPackage.count - consumedCount;
        } else {
          // 30% unused
          remainingCount = randomPackage.count;
          consumedCount = 0;
        }

        const userPackage = new UserPackage({
          user: user._id,
          package: randomPackage._id,
          restaurant: restaurants[Math.floor(Math.random() * restaurants.length)]._id,
          totalCount: randomPackage.count,
          remainingCount: remainingCount,
          purchasedAt: purchaseDate,
          expiresAt: new Date(purchaseDate.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days
        });

        await userPackage.save();
        totalSold += randomPackage.count;
        totalConsumed += consumedCount;
      }
    }
    console.log(`✅ Created UserPackages for ${usersWithPackages.length} users`);
    console.log(`   Total sold: ${totalSold} shishas`);
    console.log(`   Total consumed: ${totalConsumed} shishas\n`);

    // Create posts
    console.log('📝 Creating posts...');
    const numPosts = 25;
    let postsCreated = 0;

    for (let i = 0; i < numPosts; i++) {
      const randomUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
      const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
      const randomCaption = persianCaptions[Math.floor(Math.random() * persianCaptions.length)];

      const post = new Post({
        user: randomUser._id,
        restaurant: randomRestaurant._id,
        flavor: ['دو سیب', 'نعنا', 'لیمو', 'توت فرنگی'][Math.floor(Math.random() * 4)],
        caption: randomCaption,
        imageUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?w=800&h=600&fit=crop`,
        likes: [],
        comments: [],
        createdAt: randomDate(30)
      });

      await post.save();
      postsCreated++;
    }
    console.log(`✅ Created ${postsCreated} posts\n`);

    // Summary
    const totalUsers = await User.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalUserPackages = await UserPackage.countDocuments();
    const allUserPackages = await UserPackage.find();
    const totalConsumedShishas = allUserPackages.reduce((sum, pkg) => {
      return sum + (pkg.totalCount - pkg.remainingCount);
    }, 0);

    console.log('📊 Dashboard Summary:');
    console.log(`   👥 Total Users: ${totalUsers}`);
    console.log(`   🏪 Total Restaurants: ${totalRestaurants}`);
    console.log(`   📝 Total Posts: ${totalPosts}`);
    console.log(`   📦 Total Sold Packages: ${totalUserPackages}`);
    console.log(`   🔥 Total Consumed Shishas: ${totalConsumedShishas}`);
    console.log(`   👤 Recent Users (7 days): ${await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })}`);
    console.log('\n✅ Dashboard data seeding completed successfully!');
    console.log('   Refresh your admin dashboard to see the data.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
    process.exit(1);
  }
}

seedDashboardData();
