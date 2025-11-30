/**
 * Unit tests for Moderation functionality
 */

const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
require('dotenv').config();

// Mock Kavenegar service
jest.mock('../services/kavenegar', () => ({
  sendOTP: jest.fn().mockResolvedValue({ success: true }),
  generateLoginOTP: jest.fn().mockReturnValue('123456'),
  generateOTP: jest.fn().mockReturnValue('12345')
}));

const Post = require('../models/Post');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Admin = require('../models/Admin');
const ModerationLog = require('../models/ModerationLog');

describe('Moderation Tests', () => {
  let app;
  let adminToken;
  let testUser;
  let testAdmin;
  let testRestaurant;
  let testPost;

  beforeAll(async () => {
    // Use MONGODB_URI from environment (server MongoDB) or default to server service name
    // Replace database name with test database
    const baseUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava';
    const mongoUri = baseUri.replace(/\/[^\/]+$/, '/smokava_test');
    await mongoose.connect(mongoUri);

    app = express();
    app.use(express.json());
    app.use('/api/admin', require('../routes/admin'));
  });

  beforeEach(async () => {
    // Clean up test data
    await ModerationLog.deleteMany({});
    await Post.deleteMany({});
    await User.deleteMany({ phoneNumber: /^09\d{9}$/ });
    await Admin.deleteMany({ username: 'testadmin' });
    await Restaurant.deleteMany({ name: 'Test Restaurant' });

    // Create test admin
    testAdmin = new Admin({
      username: 'testadmin',
      password: 'testpass123'
    });
    await testAdmin.save();
    adminToken = testAdmin.generateAuthToken();

    // Create test user
    testUser = new User({
      phoneNumber: '09301234567',
      role: 'user'
    });
    await testUser.save();

    // Create test restaurant
    testRestaurant = new Restaurant({
      name: 'Test Restaurant',
      nameFa: 'رستوران تست',
      address: 'Test Address',
      addressFa: 'آدرس تست',
      location: { type: 'Point', coordinates: [51.3890, 35.6892] }
    });
    await testRestaurant.save();

    // Create test post
    testPost = new Post({
      user: testUser._id,
      restaurant: testRestaurant._id,
      caption: 'Test post caption',
      imageUrl: 'https://example.com/image.jpg',
      published: true
    });
    await testPost.save();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('List Posts for Moderation', () => {
    test('should list all posts', async () => {
      const response = await request(app)
        .get('/api/admin/posts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.posts).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });

    test('should filter posts by published status', async () => {
      // Create unpublished post
      const unpublishedPost = new Post({
        user: testUser._id,
        restaurant: testRestaurant._id,
        caption: 'Unpublished post',
        imageUrl: 'https://example.com/image2.jpg',
        published: false
      });
      await unpublishedPost.save();

      const response = await request(app)
        .get('/api/admin/posts?published=false')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.posts.every(p => p.published === false)).toBe(true);
    });

    test('should search posts by caption', async () => {
      const response = await request(app)
        .get('/api/admin/posts?search=Test')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.posts.some(p => p.caption.includes('Test'))).toBe(true);
    });

    test('should paginate posts', async () => {
      const response = await request(app)
        .get('/api/admin/posts?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
      expect(response.body.posts.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Get Single Post', () => {
    test('should get post by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id.toString()).toBe(testPost._id.toString());
      expect(response.body.caption).toBe('Test post caption');
    });

    test('should filter out deleted comments', async () => {
      // Add a deleted comment
      testPost.comments.push({
        user: testUser._id,
        text: 'Deleted comment',
        commentedAt: new Date(),
        deletedAt: new Date(),
        deletedBy: testAdmin._id
      });
      await testPost.save();

      const response = await request(app)
        .get(`/api/admin/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const deletedComments = response.body.comments.filter(c => c.deletedAt);
      expect(deletedComments.length).toBe(0);
    });
  });

  describe('Delete Post', () => {
    test('should soft delete a post', async () => {
      const response = await request(app)
        .delete(`/api/admin/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Inappropriate content' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Post deleted successfully');

      // Verify post is soft deleted
      const deletedPost = await Post.findById(testPost._id);
      expect(deletedPost.deletedAt).toBeDefined();
      expect(deletedPost.published).toBe(false);
      expect(deletedPost.deletedBy.toString()).toBe(testAdmin._id.toString());
    });

    test('should create moderation log for deletion', async () => {
      await request(app)
        .delete(`/api/admin/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test reason' });

      const log = await ModerationLog.findOne({
        action: 'delete_post',
        targetId: testPost._id
      });

      expect(log).toBeDefined();
      expect(log.adminId.toString()).toBe(testAdmin._id.toString());
      expect(log.reason).toBe('Test reason');
    });

    test('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/admin/posts/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Hide/Unhide Post', () => {
    test('should hide a post', async () => {
      const response = await request(app)
        .patch(`/api/admin/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ published: false, reason: 'Hidden for review' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Post updated successfully');

      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.published).toBe(false);
    });

    test('should unhide a post', async () => {
      // Hide first
      testPost.published = false;
      await testPost.save();

      const response = await request(app)
        .patch(`/api/admin/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ published: true });

      expect(response.status).toBe(200);

      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.published).toBe(true);
    });

    test('should create moderation log for hide/unhide', async () => {
      await request(app)
        .patch(`/api/admin/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ published: false });

      const log = await ModerationLog.findOne({
        action: 'hide_post',
        targetId: testPost._id
      });

      expect(log).toBeDefined();
    });
  });

  describe('Delete Comment', () => {
    test('should soft delete a comment', async () => {
      // Add a comment
      testPost.comments.push({
        user: testUser._id,
        text: 'Test comment',
        commentedAt: new Date()
      });
      await testPost.save();

      const commentId = testPost.comments[testPost.comments.length - 1]._id;

      const response = await request(app)
        .delete(`/api/admin/posts/${testPost._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Spam' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Comment deleted successfully');

      // Verify comment is soft deleted
      const updatedPost = await Post.findById(testPost._id);
      const comment = updatedPost.comments.id(commentId);
      expect(comment.deletedAt).toBeDefined();
      expect(comment.deletedBy.toString()).toBe(testAdmin._id.toString());
    });

    test('should create moderation log for comment deletion', async () => {
      testPost.comments.push({
        user: testUser._id,
        text: 'Test comment',
        commentedAt: new Date()
      });
      await testPost.save();

      const commentId = testPost.comments[testPost.comments.length - 1]._id;

      await request(app)
        .delete(`/api/admin/posts/${testPost._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test reason' });

      const log = await ModerationLog.findOne({
        action: 'delete_comment',
        targetId: commentId
      });

      expect(log).toBeDefined();
      expect(log.metadata.postId.toString()).toBe(testPost._id.toString());
    });

    test('should return 404 for non-existent comment', async () => {
      const fakeCommentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/admin/posts/${testPost._id}/comments/${fakeCommentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Access Control', () => {
    test('should require admin authentication', async () => {
      const response = await request(app)
        .get('/api/admin/posts');

      expect(response.status).toBe(401);
    });

    test('should not allow non-admin users', async () => {
      // Create regular user token
      const jwt = require('jsonwebtoken');
      const userToken = jwt.sign(
        { userId: testUser._id, role: 'user' },
        process.env.JWT_SECRET || 'secret'
      );

      const response = await request(app)
        .get('/api/admin/posts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});
