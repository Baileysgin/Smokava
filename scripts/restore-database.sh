#!/bin/bash

# ===========================================
# RESTORE DATABASE FROM BACKUP
# ===========================================
# This script restores data from READ__ME_TO_RECOVER_YOUR_DATA to smokava database
# Usage: ./scripts/restore-database.sh

set -e

echo "🔄 Restoring database from backup..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

# Check if running in Docker or locally
if [ -f "/.dockerenv" ] || [ -n "$DOCKER_CONTAINER" ]; then
    echo "📦 Running inside Docker container"
    MONGODB_URI="${MONGODB_URI:-mongodb://mongodb:27017/smokava}"
else
    echo "💻 Running locally"
    MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/smokava}"
fi

# Check if docker-compose is available
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    if docker compose ps 2>/dev/null | grep -q "smokava-mongodb.*Up"; then
        echo "🐳 Using Docker Compose MongoDB container"

        echo "📋 Step 1: Checking backup database..."
        docker compose exec -T mongodb mongosh READ__ME_TO_RECOVER_YOUR_DATA --quiet --eval "
            const userCount = db.users.countDocuments();
            const postCount = db.posts.countDocuments();
            const restaurantCount = db.restaurants.countDocuments();
            print('Backup database contains:');
            print('  Users: ' + userCount);
            print('  Posts: ' + postCount);
            print('  Restaurants: ' + restaurantCount);
        " 2>&1

        echo ""
        echo "📋 Step 2: Copying users from backup..."
        docker compose exec -T mongodb mongosh --quiet --eval "
            use READ__ME_TO_RECOVER_YOUR_DATA;
            const users = db.users.find({}).toArray();
            use smokava;
            users.forEach(user => {
                // Remove _id to allow MongoDB to generate new one, or keep existing
                const existing = db.users.findOne({username: user.username});
                if (!existing) {
                    db.users.insertOne(user);
                    print('Restored user: ' + user.username);
                } else {
                    print('User already exists: ' + user.username + ' (skipping)');
                }
            });
            print('Users restored: ' + db.users.countDocuments());
        " 2>&1

        echo ""
        echo "📋 Step 3: Copying restaurants from backup..."
        docker compose exec -T mongodb mongosh --quiet --eval "
            use READ__ME_TO_RECOVER_YOUR_DATA;
            const restaurants = db.restaurants.find({}).toArray();
            use smokava;
            restaurants.forEach(restaurant => {
                const existing = db.restaurants.findOne({name: restaurant.name});
                if (!existing) {
                    db.restaurants.insertOne(restaurant);
                    print('Restored restaurant: ' + restaurant.name);
                } else {
                    print('Restaurant already exists: ' + restaurant.name + ' (skipping)');
                }
            });
            print('Restaurants restored: ' + db.restaurants.countDocuments());
        " 2>&1

        echo ""
        echo "📋 Step 4: Copying posts from backup..."
        docker compose exec -T mongodb mongosh --quiet --eval "
            use READ__ME_TO_RECOVER_YOUR_DATA;
            const posts = db.posts.find({}).toArray();
            use smokava;
            let restored = 0;
            posts.forEach(post => {
                // Check if post exists by user + restaurant + caption combination
                const existing = db.posts.findOne({
                    user: post.user,
                    restaurant: post.restaurant,
                    caption: post.caption
                });
                if (!existing) {
                    db.posts.insertOne(post);
                    restored++;
                }
            });
            print('Posts restored: ' + restored);
            print('Total posts: ' + db.posts.countDocuments());
        " 2>&1

        echo ""
        echo "📋 Step 5: Copying packages from backup..."
        docker compose exec -T mongodb mongosh --quiet --eval "
            use READ__ME_TO_RECOVER_YOUR_DATA;
            const packages = db.packages.find({}).toArray();
            use smokava;
            packages.forEach(pkg => {
                const existing = db.packages.findOne({name: pkg.name});
                if (!existing) {
                    db.packages.insertOne(pkg);
                    print('Restored package: ' + pkg.name);
                }
            });
            print('Packages restored: ' + db.packages.countDocuments());
        " 2>&1

        echo ""
        echo "📋 Step 6: Copying user packages from backup..."
        docker compose exec -T mongodb mongosh --quiet --eval "
            use READ__ME_TO_RECOVER_YOUR_DATA;
            const userPackages = db.userpackages.find({}).toArray();
            use smokava;
            let restored = 0;
            userPackages.forEach(upkg => {
                const existing = db.userpackages.findOne({
                    user: upkg.user,
                    package: upkg.package,
                    purchasedAt: upkg.purchasedAt
                });
                if (!existing) {
                    db.userpackages.insertOne(upkg);
                    restored++;
                }
            });
            print('User packages restored: ' + restored);
            print('Total user packages: ' + db.userpackages.countDocuments());
        " 2>&1

        echo ""
        echo "✅ Database restoration completed!"
        echo ""
        echo "📊 Final Summary:"
        docker compose exec -T mongodb mongosh smokava --quiet --eval "
            print('Users: ' + db.users.countDocuments());
            print('Posts: ' + db.posts.countDocuments());
            print('Restaurants: ' + db.restaurants.countDocuments());
            print('Packages: ' + db.packages.countDocuments());
            print('UserPackages: ' + db.userpackages.countDocuments());
        " 2>&1

        exit 0
    fi
fi

echo "❌ Docker Compose not available or MongoDB not running"
exit 1
