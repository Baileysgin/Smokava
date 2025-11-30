/**
 * Unit tests for Time-Window Validation functionality
 */

const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config();

const UserPackage = require('../models/UserPackage');
const Package = require('../models/Package');
const User = require('../models/User');

// Mock Kavenegar service
jest.mock('../services/kavenegar', () => ({
  sendOTP: jest.fn().mockResolvedValue({ success: true }),
  generateLoginOTP: jest.fn().mockReturnValue('123456'),
  generateOTP: jest.fn().mockReturnValue('12345')
}));

describe('Time-Window Validation Tests', () => {
  let testUser;
  let testPackage;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smokava_test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    await UserPackage.deleteMany({});
    await Package.deleteMany({});
    await User.deleteMany({ phoneNumber: /^09\d{9}$/ });

    testUser = new User({
      phoneNumber: '09301234567',
      role: 'user'
    });
    await testUser.save();

    testPackage = new Package({
      name: 'Test Package',
      nameFa: 'پکیج تست',
      count: 10,
      price: 100000,
      timeWindows: [
        { start: '13:00', end: '17:00' },
        { start: '19:00', end: '23:00' }
      ]
    });
    await testPackage.save();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Time Window Format Validation', () => {
    test('should validate time window format', () => {
      const window = { start: '13:00', end: '17:00' };
      expect(window.start).toMatch(/^\d{2}:\d{2}$/);
      expect(window.end).toMatch(/^\d{2}:\d{2}$/);
    });

    test('should handle normal time windows (start < end)', () => {
      const now = moment.tz('13:30', 'HH:mm', 'Asia/Tehran');
      const windowStart = '13:00';
      const windowEnd = '17:00';
      const currentTime = now.format('HH:mm');

      const inWindow = currentTime >= windowStart && currentTime <= windowEnd;
      expect(inWindow).toBe(true);
    });

    test('should handle overnight time windows (start > end)', () => {
      const now = moment.tz('23:30', 'HH:mm', 'Asia/Tehran');
      const windowStart = '22:00';
      const windowEnd = '02:00';
      const currentTime = now.format('HH:mm');

      const inWindow = currentTime >= windowStart || currentTime <= windowEnd;
      expect(inWindow).toBe(true);
    });

    test('should detect time outside normal window', () => {
      const now = moment.tz('12:00', 'HH:mm', 'Asia/Tehran');
      const windowStart = '13:00';
      const windowEnd = '17:00';
      const currentTime = now.format('HH:mm');

      const inWindow = currentTime >= windowStart && currentTime <= windowEnd;
      expect(inWindow).toBe(false);
    });
  });

  describe('Package Date Range Validation', () => {
    test('should allow package usage within date range', async () => {
      const now = moment.tz('Asia/Tehran');
      const startDate = now.clone().subtract(1, 'day').toDate();
      const endDate = now.clone().add(1, 'day').toDate();

      const userPackage = new UserPackage({
        user: testUser._id,
        package: testPackage._id,
        totalCount: 10,
        remainingCount: 5,
        startDate,
        endDate,
        timeWindows: testPackage.timeWindows
      });
      await userPackage.save();

      const isValid = now.isAfter(moment(startDate).tz('Asia/Tehran')) &&
                     now.isBefore(moment(endDate).tz('Asia/Tehran'));
      expect(isValid).toBe(true);
    });

    test('should reject package usage before start date', async () => {
      const now = moment.tz('Asia/Tehran');
      const startDate = now.clone().add(1, 'day').toDate();

      const userPackage = new UserPackage({
        user: testUser._id,
        package: testPackage._id,
        totalCount: 10,
        remainingCount: 5,
        startDate,
        timeWindows: testPackage.timeWindows
      });
      await userPackage.save();

      const isValid = now.isAfter(moment(startDate).tz('Asia/Tehran'));
      expect(isValid).toBe(false);
    });

    test('should reject package usage after end date', async () => {
      const now = moment.tz('Asia/Tehran');
      const endDate = now.clone().subtract(1, 'day').toDate();

      const userPackage = new UserPackage({
        user: testUser._id,
        package: testPackage._id,
        totalCount: 10,
        remainingCount: 5,
        endDate,
        timeWindows: testPackage.timeWindows
      });
      await userPackage.save();

      const isValid = now.isBefore(moment(endDate).tz('Asia/Tehran'));
      expect(isValid).toBe(false);
    });
  });

  describe('Time Window Validation Logic', () => {
    test('should validate package is within time window', () => {
      const now = moment.tz('14:30', 'HH:mm', 'Asia/Tehran');
      const timeWindows = [
        { start: '13:00', end: '17:00' },
        { start: '19:00', end: '23:00' }
      ];
      const currentTime = now.format('HH:mm');

      let inWindow = false;
      for (const window of timeWindows) {
        const windowStart = window.start;
        const windowEnd = window.end;

        if (windowStart <= windowEnd) {
          inWindow = currentTime >= windowStart && currentTime <= windowEnd;
        } else {
          inWindow = currentTime >= windowStart || currentTime <= windowEnd;
        }

        if (inWindow) break;
      }

      expect(inWindow).toBe(true);
    });

    test('should reject package usage outside time window', () => {
      const now = moment.tz('12:00', 'HH:mm', 'Asia/Tehran');
      const timeWindows = [
        { start: '13:00', end: '17:00' },
        { start: '19:00', end: '23:00' }
      ];
      const currentTime = now.format('HH:mm');

      let inWindow = false;
      for (const window of timeWindows) {
        const windowStart = window.start;
        const windowEnd = window.end;

        if (windowStart <= windowEnd) {
          inWindow = currentTime >= windowStart && currentTime <= windowEnd;
        } else {
          inWindow = currentTime >= windowStart || currentTime <= windowEnd;
        }

        if (inWindow) break;
      }

      expect(inWindow).toBe(false);
    });

    test('should handle multiple time windows', () => {
      const now = moment.tz('20:30', 'HH:mm', 'Asia/Tehran');
      const timeWindows = [
        { start: '13:00', end: '17:00' },
        { start: '19:00', end: '23:00' }
      ];
      const currentTime = now.format('HH:mm');

      let inWindow = false;
      for (const window of timeWindows) {
        const windowStart = window.start;
        const windowEnd = window.end;

        if (windowStart <= windowEnd) {
          inWindow = currentTime >= windowStart && currentTime <= windowEnd;
        } else {
          inWindow = currentTime >= windowStart || currentTime <= windowEnd;
        }

        if (inWindow) break;
      }

      expect(inWindow).toBe(true);
    });
  });

  describe('Next Available Window Calculation', () => {
    test('should calculate next available window for today', () => {
      const now = moment.tz('12:00', 'HH:mm', 'Asia/Tehran');
      const timeWindows = [
        { start: '13:00', end: '17:00' },
        { start: '19:00', end: '23:00' }
      ];

      let nextWindow = null;
      for (const window of timeWindows) {
        const windowStart = window.start;
        const today = now.clone().startOf('day');
        const windowStartTime = today.clone()
          .add(parseInt(windowStart.split(':')[0]), 'hours')
          .add(parseInt(windowStart.split(':')[1]), 'minutes');

        if (now.isBefore(windowStartTime)) {
          nextWindow = windowStartTime;
          break;
        }
      }

      expect(nextWindow).toBeDefined();
      expect(nextWindow.format('HH:mm')).toBe('13:00');
    });

    test('should calculate next available window for tomorrow if no window today', () => {
      const now = moment.tz('23:30', 'HH:mm', 'Asia/Tehran');
      const timeWindows = [
        { start: '13:00', end: '17:00' },
        { start: '19:00', end: '23:00' }
      ];

      let nextWindow = null;
      for (const window of timeWindows) {
        const windowStart = window.start;
        const today = now.clone().startOf('day');
        const windowStartTime = today.clone()
          .add(parseInt(windowStart.split(':')[0]), 'hours')
          .add(parseInt(windowStart.split(':')[1]), 'minutes');

        if (now.isBefore(windowStartTime)) {
          nextWindow = windowStartTime;
          break;
        }
      }

      // If no window today, use first window tomorrow
      if (!nextWindow && timeWindows.length > 0) {
        const firstWindow = timeWindows[0];
        nextWindow = now.clone().add(1, 'day').startOf('day')
          .add(parseInt(firstWindow.start.split(':')[0]), 'hours')
          .add(parseInt(firstWindow.start.split(':')[1]), 'minutes');
      }

      expect(nextWindow).toBeDefined();
      expect(nextWindow.format('DD')).toBe(now.clone().add(1, 'day').format('DD'));
    });
  });

  describe('Remaining Time Calculation', () => {
    test('should calculate remaining time for active package', async () => {
      const now = moment.tz('Asia/Tehran');
      const endDate = now.clone().add(5, 'days').toDate();

      const userPackage = new UserPackage({
        user: testUser._id,
        package: testPackage._id,
        totalCount: 10,
        remainingCount: 5,
        startDate: now.toDate(),
        endDate,
        timeWindows: testPackage.timeWindows
      });
      await userPackage.save();

      const remainingDays = moment(endDate).diff(now, 'days');
      expect(remainingDays).toBeGreaterThan(0);
    });

    test('should handle package without time windows', async () => {
      const userPackage = new UserPackage({
        user: testUser._id,
        package: testPackage._id,
        totalCount: 10,
        remainingCount: 5,
        timeWindows: []
      });
      await userPackage.save();

      expect(userPackage.timeWindows).toHaveLength(0);
      // Package should be usable at any time if no time windows
    });
  });

  describe('Timezone Handling', () => {
    test('should use Asia/Tehran timezone', () => {
      const now = moment.tz('Asia/Tehran');
      expect(now.tz()).toBe('Asia/Tehran');
    });

    test('should format time in correct timezone', () => {
      const now = moment.tz('Asia/Tehran');
      const formatted = now.format('HH:mm');
      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});

