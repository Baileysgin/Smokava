require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('../models/Package');

const samplePackages = [
  {
    name: '10 Pack',
    nameFa: 'پکیج ۱۰ تایی',
    count: 10,
    price: 500000,
    badge: 'popular',
    description: 'پکیج مناسب برای شروع',
    quantity_display_fa: '۱۰ عدد قلیان',
    price_per_item_fa: 'هر قلیان ۵۰,۰۰۰ تومان',
    feature_usage_fa: 'قابل استفاده در تمام رستوران‌های شریک',
    feature_validity_fa: 'اعتبار ۳ ماهه',
    feature_support_fa: 'پشتیبانی ۲۴ ساعته',
    package_icon: ''
  },
  {
    name: '50 Pack',
    nameFa: 'پکیج ۵۰ تایی',
    count: 50,
    price: 2250000,
    badge: 'special',
    description: 'پکیج محبوب با تخفیف ویژه',
    quantity_display_fa: '۵۰ عدد قلیان',
    price_per_item_fa: 'هر قلیان ۴۵,۰۰۰ تومان',
    feature_usage_fa: 'قابل استفاده در تمام رستوران‌های شریک',
    feature_validity_fa: 'اعتبار ۶ ماهه',
    feature_support_fa: 'پشتیبانی ۲۴ ساعته',
    package_icon: ''
  },
  {
    name: '100 Pack',
    nameFa: 'پکیج ۱۰۰ تایی',
    count: 100,
    price: 4000000,
    badge: null,
    description: 'پکیج اقتصادی برای استفاده طولانی مدت',
    quantity_display_fa: '۱۰۰ عدد قلیان',
    price_per_item_fa: 'هر قلیان ۴۰,۰۰۰ تومان',
    feature_usage_fa: 'قابل استفاده در تمام رستوران‌های شریک',
    feature_validity_fa: 'اعتبار ۱۲ ماهه',
    feature_support_fa: 'پشتیبانی ۲۴ ساعته',
    package_icon: ''
  }
];

async function addSamplePackages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava');
    console.log('✅ Connected to MongoDB');

    // Clear existing packages (optional - comment out if you want to keep existing)
    // await Package.deleteMany({});
    // console.log('🗑️  Cleared existing packages');

    // Add sample packages
    console.log('\n📦 Adding sample packages...\n');

    for (const pkgData of samplePackages) {
      // Check if package already exists
      const existing = await Package.findOne({
        nameFa: pkgData.nameFa,
        count: pkgData.count
      });

      if (existing) {
        console.log(`⚠️  Package "${pkgData.nameFa}" already exists, skipping...`);
        continue;
      }

      const package = new Package(pkgData);
      await package.save();
      console.log(`✅ Created: ${pkgData.nameFa} - ${pkgData.count} عدد - ${pkgData.price.toLocaleString('fa-IR')} تومان`);
    }

    // Display all packages
    console.log('\n📋 All packages in database:');
    const allPackages = await Package.find().sort({ count: 1 });
    allPackages.forEach(pkg => {
      console.log(`   - ${pkg.nameFa} (${pkg.count} عدد) - ${pkg.price.toLocaleString('fa-IR')} تومان`);
    });

    console.log('\n✨ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSamplePackages();
