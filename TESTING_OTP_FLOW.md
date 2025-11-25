# Testing OTP Redemption Flow

This guide explains how to test the complete OTP redemption flow from user app to operator panel.

## Prerequisites

1. **User Account**: A user with phone number `09302593819` (already set up)
2. **Active Package**: User must have an active package with remaining credits
3. **Restaurant**: At least one restaurant in the database
4. **Operator Account**: User with `restaurant_operator` role assigned to a restaurant

## Step-by-Step Testing Guide

### Part 1: User Side (Frontend App)

1. **Open User App**
   - Go to: `http://localhost:3000`
   - Login with phone number: `09302593819`
   - Use OTP code from server console (check backend terminal)

2. **Navigate to Wallet Page**
   - Click on "کیف پول" (Wallet) in bottom navigation
   - Or go directly to: `http://localhost:3000/wallet`

3. **Generate Consumption OTP**
   - Click "دریافت کد OTP" (Get OTP Code) button
   - Select a restaurant from dropdown
   - Enter number of shisha (count): `1`
   - Click "تولید کد" (Generate Code)
   - **Copy the OTP code** - you'll need it for the operator

4. **OTP Details**
   - OTP code is displayed (6 digits)
   - OTP expires in 10 minutes
   - You can copy the code to clipboard

### Part 2: Operator Side (Admin Panel)

1. **Open Operator Panel**
   - Go to: `http://localhost:5173/operator/login`
   - Login with phone number: `09302593819`
   - Use OTP code from server console

2. **Navigate to Redemption Page**
   - Click "استفاده از پکیج" (Use Package) in sidebar
   - Or go to: `http://localhost:5173/operator/redeem`

3. **Redeem Package**
   - Enter customer phone number: `09302593819`
   - Enter the OTP code from Step 1.3 (user app)
   - Enter count: `1`
   - (Optional) Enter flavor: e.g., "سیب" (Apple)
   - Click "استفاده از پکیج" (Use Package)

4. **Success**
   - You should see success message
   - Package credits are deducted
   - Transaction is recorded in history

### Part 3: Verify Results

1. **Check User Wallet**
   - Go back to user app: `http://localhost:3000/wallet`
   - Refresh the page
   - Remaining count should be decreased
   - New entry should appear in "تاریخچه مصرف" (Consumption History)

2. **Check Operator History**
   - In operator panel, go to "تاریخچه مصرف" (Consumption History)
   - You should see the redemption record
   - Details include: customer, package, count, flavor, date/time

3. **Check Operator Dashboard**
   - Go to operator dashboard
   - "قلیون‌های امروز" (Today's Redemptions) should increase
   - "قلیون‌های این ماه" (This Month's Redemptions) should increase

## Quick Test (Development Mode)

For faster testing without going through the full user app:

1. **In Operator Panel**:
   - Go to redemption page
   - Enter customer phone: `09302593819`
   - Click "ایجاد OTP تست" (Generate Test OTP) button
   - OTP will be auto-filled
   - Enter count and click "استفاده از پکیج"

**Note**: Test OTP button only works in development mode.

## Troubleshooting

### OTP Expired
- OTPs expire after 10 minutes
- Generate a new OTP from user app

### Invalid OTP
- Make sure you're using the OTP for the correct restaurant
- OTP is restaurant-specific

### Not Enough Credits
- Check user has remaining package credits
- Go to wallet page to see balance

### Operator Not Assigned
- Make sure operator has `restaurant_operator` role
- Operator must have an assigned restaurant
- Check in admin panel: Users → User Details → Edit Role

## Testing Checklist

- [ ] User can generate OTP from wallet page
- [ ] OTP is displayed correctly
- [ ] OTP can be copied to clipboard
- [ ] Operator can redeem using OTP
- [ ] Package credits are deducted correctly
- [ ] History is recorded in user wallet
- [ ] History is recorded in operator panel
- [ ] Dashboard stats are updated
- [ ] OTP expires after 10 minutes
- [ ] Invalid OTP is rejected
- [ ] OTP for wrong restaurant is rejected

## API Endpoints Used

- `POST /api/packages/generate-consumption-otp` - User generates OTP
- `POST /api/operator/redeem` - Operator redeems package
- `GET /api/operator/history` - Operator views history
- `GET /api/operator/dashboard` - Operator views stats
- `GET /api/packages/my-packages` - User views packages

## Notes

- In production, users generate OTP from their mobile app
- Operators scan QR code or enter OTP manually
- OTP is restaurant-specific for security
- All transactions are logged for audit
