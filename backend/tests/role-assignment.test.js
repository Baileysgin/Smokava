/**
 * Unit tests for Role Assignment functionality
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

const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const User = require('../models/User');
const Admin = require('../models/Admin');

describe('Role Assignment Tests', () => {
  let app;
  let adminToken;
  let testUser;
  let testAdmin;

  beforeAll(async () => {
    // Use MONGODB_URI from environment (server MongoDB) or default to server service name
    // Replace database name with test database
    const baseUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava';
    const mongoUri = baseUri.replace(/\/[^\/]+$/, '/smokava_test');
    await mongoose.connect(mongoUri);

    app = express();
    app.use(express.json());
    app.use('/api/admin', require('../routes/admin'));
    app.use('/api/auth', require('../routes/auth'));
  });

  beforeEach(async () => {
    // Clean up test data
    await UserRole.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({ phoneNumber: /^09\d{9}$/ });
    await Admin.deleteMany({ username: 'testadmin' });

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
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Role Creation', () => {
    test('should create a new role', async () => {
      const role = new Role({ name: 'operator' });
      await role.save();

      expect(role._id).toBeDefined();
      expect(role.name).toBe('operator');
    });

    test('should not create duplicate roles', async () => {
      const role1 = new Role({ name: 'operator' });
      await role1.save();

      const role2 = new Role({ name: 'operator' });
      await expect(role2.save()).rejects.toThrow();
    });
  });

  describe('Assign Role to User', () => {
    test('should assign operator role to user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUser._id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roleNames: ['operator'],
          restaurantId: null
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Roles assigned successfully');
      expect(response.body.roles).toHaveLength(1);
      expect(response.body.roles[0].roleId.name).toBe('operator');
    });

    test('should assign admin role to user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUser._id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roleNames: ['admin']
        });

      expect(response.status).toBe(200);

      // Verify user's legacy role field is updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.role).toBe('admin');
    });

    test('should assign operator role with restaurant scope', async () => {
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
        .post(`/api/admin/users/${testUser._id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roleNames: ['operator'],
          restaurantId: restaurant._id.toString()
        });

      expect(response.status).toBe(200);

      const userRole = await UserRole.findOne({
        userId: testUser._id,
        'scope.restaurantId': restaurant._id
      });
      expect(userRole).toBeDefined();

      // Verify user's assignedRestaurant is set
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.assignedRestaurant.toString()).toBe(restaurant._id.toString());
    });

    test('should not assign duplicate role', async () => {
      // Assign role first time
      await request(app)
        .post(`/api/admin/users/${testUser._id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleNames: ['operator'] });

      // Try to assign same role again
      const response = await request(app)
        .post(`/api/admin/users/${testUser._id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleNames: ['operator'] });

      expect(response.status).toBe(200);
      // Should return existing role, not create duplicate
      const userRoles = await UserRole.find({ userId: testUser._id });
      expect(userRoles).toHaveLength(1);
    });

    test('should require admin authentication', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUser._id}/roles`)
        .send({ roleNames: ['operator'] });

      expect(response.status).toBe(401);
    });

    test('should validate roleNames array', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUser._id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleNames: 'not-an-array' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('roleNames array is required');
    });
  });

  describe('Revoke Role from User', () => {
    beforeEach(async () => {
      // Assign role first
      const role = new Role({ name: 'operator' });
      await role.save();

      const userRole = new UserRole({
        userId: testUser._id,
        roleId: role._id,
        scope: { restaurantId: null },
        assignedBy: testAdmin._id
      });
      await userRole.save();
    });

    test('should revoke role from user', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${testUser._id}/roles/operator`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Role revoked successfully');

      const userRoles = await UserRole.find({ userId: testUser._id });
      expect(userRoles).toHaveLength(0);
    });

    test('should update user role to "user" when all roles revoked', async () => {
      // Set user role to operator first
      testUser.role = 'restaurant_operator';
      await testUser.save();

      await request(app)
        .delete(`/api/admin/users/${testUser._id}/roles/operator`)
        .set('Authorization', `Bearer ${adminToken}`);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.role).toBe('user');
    });

    test('should return 404 for non-existent role', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${testUser._id}/roles/nonexistent`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('List User Roles', () => {
    beforeEach(async () => {
      // Assign multiple roles
      const operatorRole = new Role({ name: 'operator' });
      await operatorRole.save();

      const adminRole = new Role({ name: 'admin' });
      await adminRole.save();

      await UserRole.create([
        {
          userId: testUser._id,
          roleId: operatorRole._id,
          scope: { restaurantId: null },
          assignedBy: testAdmin._id
        },
        {
          userId: testUser._id,
          roleId: adminRole._id,
          scope: { restaurantId: null },
          assignedBy: testAdmin._id
        }
      ]);
    });

    test('should list all user roles', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.roles).toHaveLength(2);
      expect(response.body.roles[0].roleId.name).toBeDefined();
    });
  });
});
