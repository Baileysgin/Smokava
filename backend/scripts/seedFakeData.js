require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Restaurant = require('../models/Restaurant');

// Persian names for fake users
const persianNames = [
  { firstName: 'Baileysgin', lastName: '', username: 'baileysgin', photoUrl: 'https://i.pravatar.cc/150?img=12' },
  { firstName: 'علی', lastName: 'احمدی', username: 'user_ali' },
  { firstName: 'سارا', lastName: 'محمدی', username: 'user_sara' },
  { firstName: 'محمد', lastName: 'رضایی', username: 'user_mmd' },
  { firstName: 'فاطمه', lastName: 'کریمی', username: 'user_fateme' },
  { firstName: 'حسین', lastName: 'نوری', username: 'user_hossein' },
  { firstName: 'زهرا', lastName: 'حسینی', username: 'user_zahra' },
  { firstName: 'رضا', lastName: 'موسوی', username: 'user_reza' },
  { firstName: 'مریم', lastName: 'جعفری', username: 'user_maryam' },
  { firstName: 'امیر', lastName: 'کاظمی', username: 'user_amir' },
  { firstName: 'نازنین', lastName: 'صادقی', username: 'user_nazanin' }
];

// Persian bios
const persianBios = [
  'عاشق قلیان و فضاهای سنتی ایرانی 🍃',
  'طرفدار قلیان‌های خوشمزه و رستوران‌های خوب',
  'علاقه‌مند به طعم‌های جدید و تجربه‌های تازه',
  'دنبال کننده بهترین مکان‌های قلیان در تهران',
  'عاشق شب‌های ایرانی و قلیان‌های دودی',
  'طرفدار طعم‌های خاص و فضاهای دنج',
  'علاقه‌مند به قلیان و دوستان خوب',
  'دنبال کننده مکان‌های جدید و جذاب',
  'عاشق تجربه طعم‌های مختلف',
  'طرفدار فضاهای سنتی و قلیان‌های خوشمزه'
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
  'امروز تجربه جدیدی داشتم 🎉',
  'قلیان خوشمزه و دوستان خوب',
  'بهترین مکان برای قلیان در تهران',
  'طعم فوق‌العاده! حتما امتحان کنید',
  'شب خاطره‌انگیزی بود 🌙',
  'عاشق این فضا و طعم شدم',
  'قلیان دودی و عالی!',
  'تجربه جدید و جذاب',
  'بهترین قلیان این ماه!',
  'طعم خاص و خوشمزه',
  'فضای دنج و قلیان عالی'
];

// Persian comments
const persianComments = [
  'عالی بود! 👏',
  'حتما میرم امتحان کنم',
  'طعمش چطور بود؟',
  'بهترین مکان!',
  'عاشق این طعم شدم',
  'پیشنهاد خوبیه',
  'حتما دوباره میرم',
  'فضاش عالیه',
  'قلیانش خوشمزه بود',
  'تجربه خوبی بود',
  'ممنون از معرفی',
  'عالی! 👍',
  'بهترین انتخاب',
  'طعم فوق‌العاده',
  'فضای دنجی داره'
];

// Generate fake Iranian phone number
function generatePhoneNumber() {
  const prefixes = ['0912', '0913', '0914', '0915', '0916', '0917', '0918', '0919', '0921', '0922'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${number}`;
}

// Generate random date within last 10 days
function randomDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 10);
  const hoursAgo = Math.floor(Math.random() * 24);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return date;
}

// Get random avatar URL
function getRandomAvatar(index) {
  // Using a placeholder service that provides different avatars
  return `https://i.pravatar.cc/150?img=${index + 1}`;
}

// Get placeholder image for posts
function getPostImage() {
  const images = [
    'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop'
  ];
  return images[Math.floor(Math.random() * images.length)];
}

async function seedFakeData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smokava');
    console.log('Connected to MongoDB');

    // Get existing restaurants
    const restaurants = await Restaurant.find({});
    if (restaurants.length === 0) {
      console.log('No restaurants found. Please run the main seed script first.');
      process.exit(1);
    }
    console.log(`Found ${restaurants.length} restaurants`);

    // Create fake users (using upsert to avoid duplicates)
    const fakeUsers = [];
    console.log('\nCreating fake users...');

    for (let i = 0; i < persianNames.length; i++) {
      const nameData = persianNames[i];

      // Check if user already exists by username
      let user = await User.findOne({ username: nameData.username });

      if (!user) {
        // Generate consistent phone number based on index
        const phoneNumber = `0912${1000000 + i}`;

        // Create new user
        user = new User({
          phoneNumber,
          firstName: nameData.firstName,
          lastName: nameData.lastName || '',
          username: nameData.username,
          photoUrl: nameData.photoUrl || getRandomAvatar(i),
          name: nameData.lastName ? `${nameData.firstName} ${nameData.lastName}` : nameData.firstName, // Legacy field
          avatar: nameData.photoUrl || getRandomAvatar(i), // Legacy field
          following: [],
          followers: [],
          createdAt: randomDate()
        });
        await user.save();
        console.log(`Created user: ${nameData.username} (${nameData.firstName} ${nameData.lastName || ''})`);
      } else {
        // Update existing user with photo if provided
        if (nameData.photoUrl && !user.photoUrl) {
          user.photoUrl = nameData.photoUrl;
          user.avatar = nameData.photoUrl;
          await user.save();
          console.log(`Updated user photo: ${nameData.username}`);
        } else {
          console.log(`User already exists: ${nameData.username}, skipping...`);
        }
      }

      fakeUsers.push(user);
    }

    // Create follow relationships (each user follows 3-6 other users)
    console.log('\nCreating follow relationships...');
    for (let i = 0; i < fakeUsers.length; i++) {
      // Reload user from database to get latest state
      const user = await User.findById(fakeUsers[i]._id);
      const numToFollow = Math.floor(Math.random() * 4) + 3; // 3-6 users
      const usersToFollow = [];

      // Get random users to follow (excluding self)
      const availableUsers = fakeUsers.filter(u => u._id.toString() !== user._id.toString());
      const shuffled = availableUsers.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(numToFollow, availableUsers.length));

      for (const targetUser of selected) {
        // Check if already following
        const isFollowing = user.following.some(
          id => id.toString() === targetUser._id.toString()
        );

        if (!isFollowing) {
          // Add to following list
          user.following.push(targetUser._id);
          usersToFollow.push(targetUser.username);

          // Add to target user's followers list
          await User.findByIdAndUpdate(targetUser._id, {
            $addToSet: { followers: user._id }
          });
        }
      }

      if (usersToFollow.length > 0) {
        await user.save();
        console.log(`${user.username} now follows ${usersToFollow.length} users`);
      }
    }

    // Create fake posts (30-40 posts for more content)
    console.log('\nCreating fake posts...');
    const numPosts = Math.floor(Math.random() * 11) + 30; // 30-40 posts

    for (let i = 0; i < numPosts; i++) {
      // Random user
      const randomUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];

      // Random restaurant
      const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];

      // Random caption
      const randomCaption = persianCaptions[Math.floor(Math.random() * persianCaptions.length)];

      // Random flavor (optional)
      const flavors = ['دو سیب', 'نعنا', 'لیمو', 'توت فرنگی', 'هندوانه', 'انگور', 'سیب سبز'];
      const randomFlavor = Math.random() > 0.5 ? flavors[Math.floor(Math.random() * flavors.length)] : '';

      // Random likes (0-25)
      const numLikes = Math.floor(Math.random() * 26);
      const likes = [];
      for (let j = 0; j < numLikes; j++) {
        const randomLiker = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
        likes.push({
          user: randomLiker._id,
          likedAt: randomDate()
        });
      }

      // Random comments (2-5 comments)
      const numComments = Math.floor(Math.random() * 4) + 2; // 2-5 comments
      const comments = [];
      for (let j = 0; j < numComments; j++) {
        const randomCommenter = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
        const randomComment = persianComments[Math.floor(Math.random() * persianComments.length)];
        comments.push({
          user: randomCommenter._id,
          text: randomComment,
          commentedAt: randomDate()
        });
      }

      // Check if post already exists (by checking caption + user + restaurant combination)
      const existingPost = await Post.findOne({
        user: randomUser._id,
        restaurant: randomRestaurant._id,
        caption: randomCaption
      });

      if (!existingPost) {
        const post = new Post({
          user: randomUser._id,
          restaurant: randomRestaurant._id,
          flavor: randomFlavor,
          caption: randomCaption,
          imageUrl: getPostImage(),
          likes: likes,
          comments: comments,
          createdAt: randomDate()
        });

        await post.save();
        console.log(`Created post by ${randomUser.username}: "${randomCaption.substring(0, 30)}..."`);
      } else {
        console.log(`Post already exists, skipping...`);
      }
    }

    console.log('\n✅ Fake data seeding completed successfully!');
    console.log(`- Created/verified ${fakeUsers.length} users`);
    console.log(`- Created ${numPosts} posts`);
    console.log('- Follow relationships established');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding fake data:', error);
    process.exit(1);
  }
}

seedFakeData();
