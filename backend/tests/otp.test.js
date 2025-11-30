/**
 * Unit tests for OTP functionality
 */

const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
require('dotenv').config();

const User = require('../models/User');
const { sendOTP, generateLoginOTP, generateOTP } = require('../services/kavenegar');

// Mock Kavenegar service
jest.mock('../services/kavenegar', () => ({
  sendOTP: jest.fn().mockResolvedValue({ success: true }),
  generateLoginOTP: jest.fn().mockReturnValue('123456'),
  generateOTP: jest.fn().mockReturnValue('12345')
}));

describe('OTP Tests', () => {
  let app;
  let testUser;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smokava_test';
    await mongoose.connect(mongoUri);
    
    app = express();
    app.use(express.json());
    app.use('/api/auth', require('../routes/auth'));
    app.use('/api/packages', require('../routes/packages'));
  });

  beforeEach(async () => {
    await User.deleteMany({ phoneNumber: /^09\d{9}$/ });
    
    testUser = new User({
      phoneNumber: '09301234567',
      role: 'user'
    });
    await testUser.save();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Send Login OTP', () => {
    test('should send OTP to valid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '09301234567' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('OTP');
      expect(response.body.expiresIn).toBe(300);

      // Verify OTP is saved to user
      const user = await User.findOne({ phoneNumber: '09301234567' });
      expect(user.otpCode).toBeDefined();
      expect(user.otpExpiresAt).toBeDefined();
    });

    test('should normalize phone number with +98 prefix', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '+989301234567' });

      expect(response.status).toBe(200);
      
      const user = await User.findOne({ phoneNumber: '09301234567' });
      expect(user).toBeDefined();
    });

    test('should normalize phone number with 0098 prefix', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '00989301234567' });

      expect(response.status).toBe(200);
      
      const user = await User.findOne({ phoneNumber: '09301234567' });
      expect(user).toBeDefined();
    });

    test('should reject invalid phone number format', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '1234567890' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid phone number format');
    });

    test('should create new user if not exists', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '09309999999' });

      expect(response.status).toBe(200);
      
      const user = await User.findOne({ phoneNumber: '09309999999' });
      expect(user).toBeDefined();
      expect(user.otpCode).toBeDefined();
    });

    test('should require phone number', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Phone number is required');
    });
  });

  describe('Verify Login OTP', () => {
    beforeEach(async () => {
      // Set OTP for test user
      testUser.otpCode = '123456';
      testUser.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      await testUser.save();
    });

    test('should verify valid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phoneNumber: '09301234567',
          otpCode: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    test('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phoneNumber: '09301234567',
          otpCode: '000000'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid');
    });

    test('should reject expired OTP', async () => {
      testUser.otpExpiresAt = new Date(Date.now() - 1000); // Expired
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phoneNumber: '09301234567',
          otpCode: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('expired');
    });

    test('should reject OTP for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phoneNumber: '09309999999',
          otpCode: '123456'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('Generate Consumption OTP', () => {
    let userToken;

    beforeEach(async () => {
      // Generate token for authenticated user
      const jwt = require('jsonwebtoken');
      userToken = jwt.sign(
        { userId: testUser._id, role: 'user' },
        process.env.JWT_SECRET || 'secret'
      );

      // Create UserPackage with remaining credits
      const UserPackage = require('../models/UserPackage');
      const Package = require('../models/Package');
      
      const testPackage = new Package({
        name: 'Test Package',
        nameFa: 'پکیج تست',
        count: 10,
        price: 100000
      });
      await testPackage.save();

      const userPackage = new UserPackage({
        user: testUser._id,
        package: testPackage._id,
        totalCount: 10,
        remainingCount: 5
      });
      await userPackage.save();
    });

    test('should generate consumption OTP for authenticated user', async () => {
      const Restaurant = require('../models/Restaurant');
      const restaurant = new Restaurant({
        name: 'Test Restaurant',
        nameFa: 'رستوران تست',
        address: 'Test Address',
        addressFa: 'آدرس تست',
        location: { type: 'Point', coordinates: [51.3890, 35.6892] }
      });
      await restaurant.save();

      const response = await request(app)
        .post('/api/packages/generate-consumption-otp')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          restaurantId: restaurant._id.toString(),
          count: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.otpCode).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();
      expect(response.body.restaurantId).toBe(restaurant._id.toString());

      // Verify OTP is saved to user
      const user = await User.findById(testUser._id);
      expect(user.consumptionOtp).toBeDefined();
      expect(user.consumptionOtpRestaurant.toString()).toBe(restaurant._id.toString());
    });

    test('should reject if not enough credits', async () => {
      const Restaurant = require('../models/Restaurant');
      const restaurant = new Restaurant({
        name: 'Test Restaurant',
        nameFa: 'رستوران تست',
        address: 'Test Address',
        addressFa: 'آدرس تست',
        location: { type: 'Point', coordinates: [51.3890, 35.6892] }
      });
      await restaurant.save();

      const response = await request(app)
        .post('/api/packages/generate-consumption-otp')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          restaurantId: restaurant._id.toString(),
          count: 100 // More than available
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Not enough');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/packages/generate-consumption-otp')
        .send({
          restaurantId: 'test',
          count: 1
        });

      expect(response.status).toBe(401);
    });
  });

  describe('OTP Code Generation', () => {
    test('should generate 6-digit login OTP', () => {
      const otp = generateLoginOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    test('should generate 5-digit consumption OTP', () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{5}$/);
    });
  });
});

