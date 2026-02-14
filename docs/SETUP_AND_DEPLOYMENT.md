# Setup Instructions

1. Install dependencies
```bash
npm install
```

2. Configure environment variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

3. Run app
```bash
npm run dev
```

4. Build production
```bash
npm run build
```

# Deployment Checklist
- [ ] Supabase project configured and migrations applied
- [ ] Admin user role assigned
- [ ] `RESEND_API_KEY` configured for email function
- [ ] `ALLOWED_ORIGIN` configured for edge function CORS
- [ ] Smoke-test checkout and admin orders
