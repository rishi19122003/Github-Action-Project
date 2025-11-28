# Course Reseller Platform - Complete Backend System

A production-ready Node.js + Express + MongoDB backend for an online course reselling platform with wallet-based commission system, Razorpay payment integration, and RazorpayX payout functionality.

## 🚀 Features

### Core Business Logic
- **Direct Payment to Reseller**: Student payments go directly to reseller's Razorpay account
- **Virtual Wallet System**: Each reseller has a virtual wallet for commission management
- **Automatic Commission Deduction**: Admin commission auto-deducted via Razorpay webhooks
- **Pending Commission Handling**: System handles insufficient wallet balance gracefully
- **Reseller Blocking**: Automatically blocks resellers with negative balance
- **Admin Payouts**: RazorpayX integration for admin to withdraw collected commissions

### Technical Features
- ✅ JWT Authentication & Authorization
- ✅ Role-based Access Control (Admin, Reseller, Student)
- ✅ MongoDB Transactions for atomic operations
- ✅ Razorpay Order Creation & Webhook Verification
- ✅ RazorpayX Payout Integration
- ✅ Complete Error Handling
- ✅ Request Validation
- ✅ Production-ready Code Structure

## 📁 Project Structure

```
├── config/
│   ├── database.js          # MongoDB connection
│   └── razorpay.js          # Razorpay & RazorpayX instances
├── controllers/
│   ├── authController.js    # Authentication
│   ├── courseController.js  # Course management
│   ├── walletController.js  # Wallet operations
│   ├── enrollmentController.js  # Course enrollment
│   ├── webhookController.js # Razorpay webhook handler
│   ├── adminController.js   # Admin dashboard
│   └── payoutController.js  # RazorpayX payouts
├── models/
│   ├── User.js              # User (Admin/Reseller/Student)
│   ├── Wallet.js            # Virtual wallet
│   ├── WalletTransaction.js # Transaction history
│   ├── Course.js            # Course catalog
│   ├── Enrollment.js        # Student enrollments
│   ├── PendingCommission.js # Pending commissions
│   └── Payout.js            # Admin payouts
├── routes/
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   ├── walletRoutes.js
│   ├── enrollmentRoutes.js
│   ├── webhookRoutes.js
│   ├── adminRoutes.js
│   └── payoutRoutes.js
├── middlewares/
│   ├── auth.js              # JWT & role verification
│   ├── errorHandler.js      # Global error handler
│   └── validateRequest.js   # Request validation
├── utils/
│   ├── walletHelper.js      # Core wallet logic
│   ├── razorpayHelper.js    # Signature verification
│   ├── razorpayXHelper.js   # Payout functions
│   └── seedAdmin.js         # Create default admin
├── .env.example
├── .gitignore
├── package.json
├── server.js
├── README.md
└── POSTMAN_COLLECTION.json
```

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Razorpay Test Account

### Steps

1. **Clone or extract the project**

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/course-reseller-platform
JWT_SECRET=your_super_secret_jwt_key_change_this
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX
ADMIN_EMAIL=admin@platform.com
ADMIN_PASSWORD=admin123
```

4. **Start MongoDB**
```bash
mongod
```

5. **Start the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

## 🔑 Getting Razorpay Credentials

### 1. Razorpay Test Keys
1. Go to https://dashboard.razorpay.com/
2. Login/Signup (free)
3. Switch to **Test Mode** (toggle at top)
4. Go to **Settings** → **API Keys**
5. Click **Generate Test Keys**
6. Copy `Key ID` and `Key Secret`

### 2. Webhook Secret
1. Go to **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. Webhook URL: `https://your-ngrok-url.ngrok.io/api/webhook/razorpay`
4. Select events: `payment.captured`, `payment.failed`
5. Click **Create** and copy the **Secret**

### 3. Setup ngrok (for local testing)
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 5000

# Copy the https URL and update Razorpay webhook
```

## 📖 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### API Endpoints

#### 1. Authentication
```
POST   /auth/register       # Register new user
POST   /auth/login          # Login
GET    /auth/me             # Get current user (protected)
```

#### 2. Courses
```
GET    /courses             # Get all courses
GET    /courses/:id         # Get single course
POST   /courses             # Create course (Admin only)
PUT    /courses/:id         # Update course (Admin only)
DELETE /courses/:id         # Delete course (Admin only)
```

#### 3. Wallet
```
GET    /wallet/balance                  # Get wallet balance
POST   /wallet/topup/create-order       # Create top-up order
POST   /wallet/topup/manual             # Manual top-up (Admin)
GET    /wallet/transactions             # Transaction history
```

#### 4. Enrollment
```
POST   /enrollment/create-order         # Create course order (Student)
GET    /enrollment/:enrollmentId        # Get enrollment details
GET    /enrollment/my/enrollments       # Get my enrollments (Student)
GET    /enrollment/reseller/enrollments # Get reseller enrollments
```

#### 5. Admin
```
GET    /admin/dashboard/stats                    # Dashboard statistics
GET    /admin/commissions/pending                # Pending commissions
GET    /admin/commissions/stats                  # Commission stats
GET    /admin/commissions/reseller-breakdown     # Reseller breakdown
GET    /admin/users                              # Get all users
PATCH  /admin/users/:userId/block                # Block/unblock user
```

#### 6. Payout (RazorpayX)
```
POST   /payout/create       # Create payout (Admin withdrawal)
GET    /payout              # Get all payouts
GET    /payout/:payoutId    # Get payout details
```

#### 7. Webhook
```
POST   /webhook/razorpay    # Razorpay webhook endpoint
```

## 🔄 Complete Flow

### 1. Setup Phase
```bash
# 1. Admin logs in (auto-created on server start)
POST /api/auth/login
{
  "email": "admin@platform.com",
  "password": "admin123"
}

# 2. Admin creates a course
POST /api/courses
{
  "title": "Web Development Bootcamp",
  "price": 2000,
  "adminCommission": 500,
  ...
}

# 3. Reseller registers
POST /api/auth/register
{
  "name": "John Reseller",
  "role": "RESELLER",
  ...
}

# 4. Student registers
POST /api/auth/register
{
  "name": "Jane Student",
  "role": "STUDENT",
  ...
}
```

### 2. Course Purchase Flow
```bash
# 1. Student creates order
POST /api/enrollment/create-order
{
  "courseId": "...",
  "resellerId": "..."
}
# Returns: Razorpay order_id

# 2. Student completes payment on frontend using Razorpay Checkout

# 3. Razorpay sends webhook to /api/webhook/razorpay
# System automatically:
# - Updates enrollment status
# - Deducts commission from reseller wallet
# - If insufficient balance: marks pending & blocks reseller
# - Activates course for student
```

### 3. Wallet Top-Up Flow
```bash
# 1. Reseller creates top-up order
POST /api/wallet/topup/create-order
{
  "amount": 5000
}

# 2. Reseller completes payment

# 3. Webhook credits wallet
# 4. System clears pending commissions
# 5. Reseller unblocked
```

### 4. Admin Payout Flow
```bash
# 1. Admin creates payout
POST /api/payout/create
{
  "amount": 10000,
  "bankDetails": {...}
}

# 2. System uses RazorpayX to transfer money
# 3. In TEST mode: simulates payout
# 4. In LIVE mode: real bank transfer
```

## 🧪 Testing with Postman

1. **Import Collection**
   - Open Postman
   - Import `POSTMAN_COLLECTION.json`

2. **Set Base URL**
   - Collection Variables → `baseUrl` = `http://localhost:5000/api`

3. **Test Flow**
   - Run "Login Admin" → saves token automatically
   - Run "Register Reseller" → saves token
   - Run "Register Student" → saves token
   - Create course, enrollment, etc.

### Test Card Details (Razorpay Test Mode)
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: Any future date (12/25)
Name: Any name
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based authorization
- ✅ Razorpay webhook signature verification
- ✅ Request validation
- ✅ MongoDB injection prevention
- ✅ Error handling without exposing internals

## 🎯 Key Business Logic

### Commission Deduction (utils/walletHelper.js)

**When wallet has sufficient balance:**
- Deduct commission immediately
- Mark as PAID
- Update wallet balance

**When wallet has insufficient balance:**
- Deduct anyway (balance goes negative)
- Create PendingCommission record
- Block reseller from new sales
- When topped up: clear pending & unblock

### Webhook Handler (controllers/webhookController.js)

Handles two types of payments:
1. **Course Purchase** → Deduct commission from reseller
2. **Wallet Top-Up** → Credit reseller wallet & clear pending

## 📊 Database Models

- **User**: Admin, Reseller, Student accounts
- **Wallet**: Virtual wallet for each reseller
- **WalletTransaction**: Complete transaction history
- **Course**: Course catalog with pricing
- **Enrollment**: Student course purchases
- **PendingCommission**: Tracks unpaid commissions
- **Payout**: Admin withdrawal records

## 🚨 Important Notes

### For Production:

1. **Razorpay Route API**: Use Razorpay's Route/Transfer API to send money directly to reseller accounts

2. **Environment Variables**: Change all secrets in production

3. **Database**: Use MongoDB Atlas or managed database

4. **Logging**: Add Winston/Morgan for production logging

5. **Monitoring**: Set up error tracking (Sentry, Rollbar)

6. **Rate Limiting**: Add rate limiting middleware

7. **HTTPS**: Use HTTPS in production

8. **Backup**: Regular database backups

## 🐛 Troubleshooting

### Webhook not working?
- Check ngrok is running
- Verify webhook URL in Razorpay dashboard
- Check webhook secret in .env
- Look at server logs for errors

### Commission not deducting?
- Check webhook is being received
- Verify enrollment exists
- Check reseller wallet exists
- Look at console logs

### Payout failing?
- In TEST mode: payouts are simulated
- In LIVE mode: need RazorpayX account
- Check bank details are correct
- Verify sufficient balance

## 📝 License

ISC

## 👨‍💻 Support

For issues or questions, check the code comments or console logs for detailed information.

---

**Built with ❤️ for production use in Razorpay TEST mode**
