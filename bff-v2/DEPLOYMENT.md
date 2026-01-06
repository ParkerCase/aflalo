# BFF Cannabis Recommendation System - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Core Features Completed
- [x] Anonymous PIN-based user management
- [x] 5-question personalization questionnaire  
- [x] Daily check-in system for preference updates
- [x] 69+ strain database with comprehensive terpene profiles
- [x] OpenAI-powered chat with personalized recommendations
- [x] Feedback system (heart/X ratings)
- [x] Mobile-responsive design (emoji-free)
- [x] Washington State product database integration

### ✅ Production Features Implemented
- [x] **Admin Dashboard** (`/admin`) - Analytics, user engagement, strain insights
- [x] **Advanced Error Handling** - Custom error types, graceful fallbacks  
- [x] **Rate Limiting** - API protection (60 requests/hour for chat)
- [x] **Age Verification** (`/age-verification`) - Legal compliance, 21+ requirement
- [x] **Privacy Controls** (`/api/privacy/[pin]`) - GDPR data export/deletion
- [x] **Performance Caching** - In-memory cache for database queries
- [x] **Health Monitoring** (`/api/health`) - Database, cache, environment checks
- [x] **Comprehensive Logging** - Request tracking, error monitoring, performance metrics
- [x] **Data Maintenance** (`/api/admin/maintenance`) - Cleanup utilities

### ✅ Security & Compliance
- [x] Anonymous data storage (no PII)
- [x] Age verification with session expiry
- [x] Rate limiting on all endpoints
- [x] Input validation and sanitization
- [x] Error handling without data exposure
- [x] GDPR-compliant data export/deletion

## 🚀 Production Environment Setup

### Required Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Xata Database Configuration  
XATA_API_KEY=xau_your-xata-api-key
XATA_DATABASE_URL=postgresql://postgres:password@hostname:5432/database

# Environment
NODE_ENV=production
```

### Recommended Infrastructure

#### Option 1: Vercel (Recommended)
```bash
# Deploy to Vercel
npm install -g vercel
vercel --prod

# Set environment variables in Vercel dashboard
vercel env add OPENAI_API_KEY
vercel env add XATA_API_KEY  
vercel env add XATA_DATABASE_URL
```

#### Option 2: Traditional VPS
```bash
# Server requirements
- Node.js 18+
- PostgreSQL 13+ (via Xata)
- 2GB RAM minimum
- SSL certificate for HTTPS

# Process management with PM2
npm install -g pm2
pm2 start ecosystem.config.js
```

## 📊 Monitoring & Maintenance

### Health Check Endpoints
- `GET /api/health` - System health status
- `GET /api/monitoring` - Performance metrics  
- `GET /api/admin/dashboard` - Business analytics

### Daily Maintenance (Automated)
```bash
# Add to cron job (runs daily at 2 AM)
0 2 * * * curl -X POST https://your-domain.com/api/admin/maintenance \
  -H "Content-Type: application/json" \
  -d '{"operation": "full-cleanup", "dryRun": false}'
```

### Data Retention Policy
- **User Sessions**: 90 days
- **Feedback Data**: 1 year  
- **Inactive Users**: 1 year
- **Logs**: 1 week
- **Cache**: 10 minutes (strain data), 2 minutes (user data)

## 🔒 Security Configuration

### API Rate Limits (Implemented)
- Chat API: 60 requests/hour per IP
- Admin endpoints: 10 requests/hour per IP
- Privacy endpoints: 10 requests/hour per IP
- General APIs: 100 requests/hour per IP

### Legal Compliance Features
- Age verification (21+ required)
- Data export (GDPR Article 15)
- Data deletion (GDPR Article 17)
- Legal disclaimers and terms
- Anonymous data storage

## 📈 Performance Optimizations

### Caching Strategy (Implemented)
- **Strain database**: 10-minute cache
- **User data**: 2-minute cache  
- **Dashboard metrics**: 5-minute cache
- **Washington products**: 30-minute cache

### Database Optimization
- Indexed queries on PIN lookups
- Automatic VACUUM on maintenance
- Connection pooling via Xata
- Prepared statements for security

## 🎯 Dispensary Integration Roadmap

### Phase 1 (Current - Ready for Demo)
- Manual strain recommendations
- Customer preference tracking
- Basic analytics dashboard
- Educational cannabis information

### Phase 2 (Future - POS Integration)
- Real-time inventory integration
- Automated product matching
- Sales conversion tracking
- Multi-location support

### Phase 3 (Future - Advanced Features)
- Loyalty program integration
- Predictive recommendations
- Inventory optimization
- Regional compliance tools

## 🛠 Troubleshooting Guide

### Common Issues
1. **Database Connection Fails**
   - Check XATA_DATABASE_URL in environment
   - Verify Xata API key permissions
   - Test with `/api/health` endpoint

2. **OpenAI API Errors**
   - Verify OPENAI_API_KEY is valid
   - Check API usage limits
   - Monitor error logs in `/api/monitoring`

3. **Rate Limiting Triggered**
   - Normal behavior for protection
   - Check X-RateLimit headers
   - Implement client-side retry logic

### Performance Monitoring
```bash
# Check system health
curl https://your-domain.com/api/health

# Monitor performance metrics
curl https://your-domain.com/api/monitoring?type=performance

# Check cache efficiency  
curl https://your-domain.com/api/monitoring?type=cache
```

## 📱 Mobile Optimization (Completed)

- Responsive design for all screen sizes
- Touch-friendly interface elements
- Optimized font sizes (text-sm sm:text-base)
- Compressed UI for mobile bandwidth
- Fast loading times with caching

## 🎓 Staff Training Guide

### For Dispensary Staff
1. **Customer Onboarding**
   - Age verification process
   - PIN generation and safety
   - 5-question setup importance

2. **Daily Operations**
   - Daily check-in process
   - Interpreting AI recommendations
   - Understanding terpene science

3. **Analytics Dashboard**
   - Accessing `/admin` page
   - Reading customer insights
   - Popular strain trends

### For Management
1. **Business Intelligence**
   - User engagement metrics
   - Popular product categories
   - Customer satisfaction scores

2. **Compliance Management**
   - Privacy policy compliance
   - Data retention policies
   - Legal disclaimer updates

## ✅ Launch Readiness Checklist

### Technical Prerequisites
- [ ] Environment variables configured
- [ ] Database migrations completed (`/api/setup-database`)
- [ ] Strain database migrated (`/api/migrate-strains-fixed`)
- [ ] Health checks passing (`/api/health`)
- [ ] SSL certificate installed (HTTPS)
- [ ] Domain configured with DNS

### Business Prerequisites  
- [ ] Staff trained on system usage
- [ ] Age verification process documented
- [ ] Privacy policy published
- [ ] Terms of service updated
- [ ] Compliance review completed
- [ ] Customer communication plan ready

### Post-Launch Monitoring
- [ ] Daily health check monitoring
- [ ] Weekly analytics review
- [ ] Monthly data cleanup
- [ ] Quarterly compliance audit
- [ ] Customer feedback analysis

---

## 🎯 Summary: You're Production-Ready!

Your BFF cannabis recommendation system includes:

**Core Intelligence**: 69 strains + terpene science + Washington products + OpenAI
**User Experience**: Anonymous PINs + questionnaire + daily check-ins + mobile-responsive
**Business Tools**: Admin dashboard + analytics + customer insights
**Production Features**: Monitoring + logging + caching + error handling + legal compliance
**Security**: Rate limiting + age verification + data privacy + GDPR compliance

The system is sophisticated enough for immediate dispensary deployment and provides genuine value through personalized, science-based cannabis recommendations.