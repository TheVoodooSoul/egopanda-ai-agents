# 🐼 EgoPanda Creative - Production Deployment Guide

## 🚀 Production Setup Instructions

This guide will help you deploy EgoPanda Creative to production with full Supabase authentication, Square payment integration, and real agent access control.

## 📋 Prerequisites

- [x] Supabase project (already configured: `owalnojeylnucvmkvqvo`)
- [x] Square payment account with live payment links
- [x] Domain name for production deployment
- [ ] Email service for welcome emails (Resend, SendGrid, etc.)
- [ ] SSL certificate for secure connections

## 🔧 Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure production environment variables:**
   ```env
   # Supabase (LIVE CREDENTIALS)
   SUPABASE_URL=https://owalnojeylnucvmkvqvo.supabase.co
   SUPABASE_ANON_KEY=38687bb428633ab4513d15d3a753a3aa1af86f727f3daa44ba8004f4bb29add4
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   
   # Square (PRODUCTION)
   SQUARE_ENVIRONMENT=production
   SQUARE_WEBHOOK_SECRET=your_webhook_secret_here
   
   # Production Domain
   DOMAIN=egopandacreative.com
   ```

## 🗄️ Database Setup

### Step 1: Deploy Schema to Supabase

1. **Go to your Supabase project:**
   https://supabase.com/dashboard/project/owalnojeylnucvmkvqvo

2. **Navigate to SQL Editor**

3. **Run the schema:**
   Copy and paste the contents of `public/sql/user-subscriptions-schema.sql` and click "Run"

4. **Verify tables created:**
   - `user_subscriptions`
   - `agent_usage_logs`
   - Helper functions and policies

### Step 2: Test Database Connection
```bash
node scripts/deploy-schema.js
```

## 💳 Square Integration Setup

### Step 1: Configure Webhooks

1. **Go to Square Developer Dashboard**
2. **Navigate to Webhooks**
3. **Add webhook endpoint:**
   ```
   URL: https://egopandacreative.com/api/square-webhook
   Events: payment.updated, subscription.updated
   ```

### Step 2: Verify Payment Links

✅ **Live Payment Links (Already Configured):**
- Single Agent: https://square.link/u/4XDDOghE
- Executive Trial: https://square.link/u/iORIO9s
- Full Suite Annual: https://square.link/u/swAJ1grE
- Executive Annual: https://square.link/u/MHuKoxUP
- Custom Lifetime: https://square.link/u/aocGgYQs

## 🔐 Security Configuration

### Authentication Flow
1. **Customer pays via Square** → Payment webhook triggered
2. **User account created** → Welcome email sent with credentials
3. **User logs in** → Supabase JWT authentication
4. **Access control enforced** → Database-level tier restrictions

### Security Features
- ✅ Row-level security (RLS) enabled
- ✅ JWT token authentication
- ✅ Webhook signature verification
- ✅ HTTPS-only cookies
- ✅ CSRF protection
- ✅ Rate limiting

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SQUARE_WEBHOOK_SECRET
```

### Option 2: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

### Option 3: Traditional VPS
```bash
# Clone repository
git clone <your-repo-url>
cd minimax-supabase-integration

# Install dependencies
npm install

# Start production server
npm run start:prod
```

## 📧 Email Configuration

### Setup Welcome Emails

1. **Choose email service:**
   - Resend (recommended)
   - SendGrid
   - Amazon SES

2. **Update webhook handler:**
   Edit `public/api/square-webhook.js` line 195-200

3. **Configure SMTP settings:**
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASS=your_api_key
   ```

## 🧪 Testing Production

### Test User Registration Flow

1. **Create test payment:**
   Use Square's test payment link

2. **Verify webhook processing:**
   Check server logs for webhook events

3. **Test user login:**
   Use credentials from welcome email

4. **Verify access control:**
   Ensure tier restrictions work properly

### Test Commands
```bash
# Test database connection
node scripts/deploy-schema.js

# Test authentication
curl -X POST https://egopandacreative.com/api/test-auth

# Test webhook (development)
curl -X POST localhost:3000/api/square-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment.updated","data":{"object":{"payment":{"status":"COMPLETED"}}}}'
```

## 📊 Monitoring & Analytics

### Key Metrics to Track
- User registrations per tier
- Project usage by subscription level
- Agent interaction frequency
- Revenue per tier
- Support ticket volume

### Recommended Tools
- Supabase Analytics (built-in)
- Vercel Analytics
- Google Analytics 4
- Sentry for error tracking

## 🔄 Backup & Recovery

### Database Backups
```bash
# Export Supabase data
supabase db dump > backup.sql

# Restore from backup
supabase db reset --restore backup.sql
```

### Configuration Backups
- Store environment variables securely
- Version control all configuration files
- Document all third-party integrations

## 📋 Production Checklist

### Pre-Launch
- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Square webhooks configured
- [ ] Email service configured
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Error monitoring setup

### Post-Launch
- [ ] Test complete user journey
- [ ] Verify payment processing
- [ ] Check email delivery
- [ ] Monitor error logs
- [ ] Verify access controls
- [ ] Test agent interactions

## 🆘 Troubleshooting

### Common Issues

**Authentication fails:**
- Check Supabase keys are correct
- Verify JWT signature validation
- Check CORS settings

**Webhook not receiving:**
- Verify Square webhook URL
- Check webhook signature validation
- Test with ngrok for local development

**Database errors:**
- Check RLS policies
- Verify table permissions
- Check foreign key constraints

**Access control not working:**
- Verify subscription tier in database
- Check agent access logic
- Validate JWT claims

### Support Contacts
- **Supabase Support:** https://supabase.com/support
- **Square Developer Support:** https://developer.squareup.com/support
- **Vercel Support:** https://vercel.com/support

## 🎯 Success Metrics

### Technical KPIs
- 99.9% uptime
- < 200ms API response time
- Zero authentication failures
- 100% webhook delivery success

### Business KPIs
- Customer acquisition cost
- Monthly recurring revenue
- Agent usage per tier
- Customer lifetime value

---

## 🚀 Ready for Production!

Once you've completed all steps above, your EgoPanda Creative platform will be:

✅ **Fully authenticated** with Supabase
✅ **Payment-integrated** with Square
✅ **Access-controlled** by subscription tier
✅ **Production-ready** with real data storage
✅ **Scalable** and secure for growth

**Questions?** Open an issue or contact the development team.

🐼 **Happy deploying!** - The EgoPanda Creative Team
