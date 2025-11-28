# Course Reseller Platform - Frontend

React frontend for the course reselling platform with Razorpay integration.

## Features

- **Student Dashboard**: Browse courses, select reseller, pay with Razorpay
- **Reseller Dashboard**: View wallet balance, transactions, sales history
- **Admin Dashboard**: View commission stats, withdraw money via RazorpayX

## Setup

```bash
cd frontend
npm install
npm start
```

Server will start on `http://localhost:3000`

## Environment

Make sure backend is running on `http://localhost:5000`

## Test Accounts

- **Admin**: admin@platform.com / admin123
- **Create Reseller & Student** accounts after login

## Razorpay Test Card

```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
```

## Flow

1. Login as Admin → Create courses
2. Register Reseller → Top-up wallet
3. Register Student → Buy course
4. Payment via Razorpay → Commission auto-deducted
5. Reseller sees wallet updated
6. Admin can withdraw commissions
