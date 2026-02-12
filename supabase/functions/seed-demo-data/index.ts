import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo company configurations with industry data
const COMPANY_DATA = {
  'b7d8e9f0-1a2b-3c4d-5e6f-7a8b9c0d1e2f': {
    name: 'Demo Presence',
    industry: 'Personal Assistant',
    services: [
      { name: 'Calendar Management', description: 'Full calendar organization and scheduling', price: 50, duration_minutes: 30 },
      { name: 'Task Scheduling', description: 'Priority-based task organization', price: 40, duration_minutes: 30 },
      { name: 'Appointment Setting', description: 'Booking and confirmation of appointments', price: 35, duration_minutes: 20 },
      { name: 'Reminder Services', description: 'Custom reminders via email, SMS, or call', price: 25, duration_minutes: 15 },
    ],
    faqs: [
      { question: 'How do I sync my calendar?', answer: 'You can sync your Google Calendar, Outlook, or iCal from the Settings > Integrations page.' },
      { question: 'Can you manage multiple schedules?', answer: 'Yes, we can manage personal and work calendars separately or combined.' },
      { question: 'What time zones do you support?', answer: 'We support all major time zones and automatically adjust for travel.' },
      { question: 'How far in advance can I schedule?', answer: 'You can schedule appointments up to 6 months in advance.' },
    ],
    socialPosts: [
      { platform: 'facebook', content: '🗓️ Tired of double-bookings? Let us handle your schedule! #ProductivityTips #TimeManagement', status: 'scheduled' },
      { platform: 'instagram', content: '✨ Work smarter, not harder. Our scheduling services save you 10+ hours/week! #WorkLifeBalance #PersonalAssistant', status: 'scheduled' },
      { platform: 'linkedin', content: 'Professionals: Your time is valuable. Our personal assistant services help executives reclaim their calendars and focus on what matters. #ExecutiveAssistant #Productivity', status: 'scheduled' },
    ],
    blogPosts: [
      { title: 'Work-Life Balance Guide', slug: 'work-life-balance-guide', excerpt: 'Discover how to manage your time effectively and achieve better work-life balance.', content: 'Managing your time effectively starts with understanding your priorities...' },
      { title: 'Digital Organization Tips', slug: 'digital-organization-tips', excerpt: 'Learn how to organize your digital life for maximum productivity.', content: 'In today\'s digital world, staying organized is more important than ever...' },
    ],
    aiProfile: {
      business_description: 'Personal assistant services for busy professionals in Austin, TX',
      primary_industry: 'Personal Services',
      target_audience: 'Busy professionals, executives, entrepreneurs',
      tone: 'balanced',
      brand_voice: 'Professional yet approachable, efficient, reliable',
      keywords: ['personal assistant', 'scheduling', 'time management', 'productivity', 'calendar management'],
      content_topics: ['productivity tips', 'time management', 'work-life balance', 'organization'],
      unique_selling_points: ['24/7 availability', 'Multi-calendar sync', 'Personal touch'],
    },
  },
  'c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f3a': {
    name: 'Demo Growth',
    industry: 'Real Estate',
    services: [
      { name: 'Home Buying Assistance', description: 'Full-service home buying from search to closing', price: 0, duration_minutes: 60 },
      { name: 'Home Selling Services', description: 'List, market, and sell your home', price: 0, duration_minutes: 60 },
      { name: 'Rental Assistance', description: 'Find the perfect rental property', price: 200, duration_minutes: 45 },
      { name: 'Market Analysis', description: 'Comprehensive local market analysis', price: 150, duration_minutes: 30 },
    ],
    faqs: [
      { question: 'What is the first step in buying a home?', answer: 'Getting pre-approved for a mortgage is the crucial first step. We can connect you with trusted lenders.' },
      { question: 'How do you price a home for sale?', answer: 'We conduct a comprehensive market analysis including recent sales, current listings, and market trends.' },
      { question: 'What are your commission rates?', answer: 'Our rates are competitive and vary based on services. Contact us for a personalized quote.' },
      { question: 'How long does the home buying process take?', answer: 'Typically 30-60 days from offer acceptance to closing, depending on financing and inspections.' },
    ],
    socialPosts: [
      { platform: 'facebook', content: '🏡 Just listed! Beautiful 3BR/2BA in South Austin. Schedule a showing today! #AustinRealEstate #NewListing', status: 'scheduled' },
      { platform: 'instagram', content: '✨ Dream homes don\'t find themselves. Let us help you find yours in Austin! DM for a free consultation. #AustinHomes #RealEstateAgent', status: 'scheduled' },
      { platform: 'linkedin', content: 'Austin real estate market update: Inventory is low but opportunities exist for prepared buyers. Contact me to discuss your options. #AustinRealEstate #MarketUpdate', status: 'scheduled' },
    ],
    blogPosts: [
      { title: 'Austin Real Estate Market Update', slug: 'austin-real-estate-market-update', excerpt: 'Get the latest insights on Austin\'s dynamic real estate market.', content: 'The Austin real estate market continues to evolve...' },
      { title: 'First-Time Home Buyer Guide', slug: 'first-time-buyer-guide', excerpt: 'Everything you need to know about buying your first home in Austin.', content: 'Buying your first home is an exciting milestone...' },
    ],
    aiProfile: {
      business_description: 'Full-service real estate agency serving Austin, TX and surrounding areas',
      primary_industry: 'Real Estate',
      target_audience: 'Home buyers, sellers, renters in Austin area',
      tone: 'balanced',
      brand_voice: 'Knowledgeable, trustworthy, local expert',
      keywords: ['real estate', 'homes for sale', 'Austin homes', 'buy home', 'sell home'],
      content_topics: ['market updates', 'home buying tips', 'selling advice', 'neighborhood guides'],
      unique_selling_points: ['Local market expertise', 'Full-service support', 'Proven track record'],
    },
  },
  '8fafcec0-4b2a-45a1-8663-f9ccb5afc545': {
    name: 'Demo Logistics',
    industry: 'HVAC',
    services: [
      { name: 'AC Repair', description: 'Expert diagnosis and repair of all AC systems', price: 150, duration_minutes: 60 },
      { name: 'AC Service', description: 'Routine maintenance and tune-ups', price: 99, duration_minutes: 45 },
      { name: 'AC Installation', description: 'New AC system installation', price: 3500, duration_minutes: 480 },
      { name: 'Heating Repair', description: 'Furnace and heating system repairs', price: 175, duration_minutes: 60 },
      { name: 'System Maintenance', description: 'Complete HVAC system inspection', price: 129, duration_minutes: 60 },
    ],
    faqs: [
      { question: 'How often should I service my AC?', answer: 'We recommend servicing your AC system twice a year - once in spring and once in fall.' },
      { question: 'What is the average AC installation cost?', answer: 'AC installation typically ranges from $3,000-$7,000 depending on system size and complexity.' },
      { question: 'Do you offer emergency services?', answer: 'Yes, we offer 24/7 emergency HVAC services for urgent repairs.' },
      { question: 'How long does an AC unit last?', answer: 'With proper maintenance, most AC units last 15-20 years.' },
    ],
    socialPosts: [
      { platform: 'facebook', content: '🌡️ Austin summer is here! Is your AC ready? Schedule a tune-up before the heat hits! #HVAC #AustinTX #ACService', status: 'scheduled' },
      { platform: 'instagram', content: '💨 Cool comfort all summer long. Our expert techs keep Austin homes comfortable. Book your service today! #HVACLife #AustinHVAC', status: 'scheduled' },
      { platform: 'linkedin', content: 'Energy efficiency tip: Regular HVAC maintenance can reduce your energy bills by up to 15%. Contact us for a system check. #EnergyEfficiency #HVAC', status: 'scheduled' },
    ],
    blogPosts: [
      { title: '5 Signs Your AC Needs Repair', slug: '5-signs-ac-needs-repair', excerpt: 'Don\'t wait for a breakdown. Learn the warning signs of AC trouble.', content: 'Your AC system gives warning signs before failing...' },
      { title: 'Summer Energy Savings Guide', slug: 'summer-energy-savings-guide', excerpt: 'Save money while staying cool this summer with these energy tips.', content: 'Austin summers are hot, but your energy bills don\'t have to be...' },
    ],
    aiProfile: {
      business_description: 'Professional HVAC services for residential customers in Austin, TX',
      primary_industry: 'HVAC',
      target_audience: 'Homeowners in Austin needing AC repair, service, or installation',
      tone: 'balanced',
      brand_voice: 'Expert, reliable, friendly, honest',
      keywords: ['AC repair', 'HVAC service', 'air conditioning', 'heating', 'Austin HVAC'],
      content_topics: ['AC maintenance tips', 'energy efficiency', 'seasonal prep', 'HVAC troubleshooting'],
      unique_selling_points: ['24/7 emergency service', 'Licensed and insured', 'Satisfaction guaranteed'],
    },
  },
  '4f85ed98-0e98-480c-b904-1c33424e26ad': {
    name: 'Demo Performance',
    industry: 'Plumbing',
    services: [
      { name: 'Leak Detection', description: 'Advanced leak detection and repair', price: 125, duration_minutes: 45 },
      { name: 'Fixture Installation', description: 'Faucet, toilet, and fixture installation', price: 175, duration_minutes: 60 },
      { name: 'Drain Cleaning', description: 'Professional drain cleaning and unclogging', price: 150, duration_minutes: 45 },
      { name: 'Water Heater Repair', description: 'Water heater diagnosis and repair', price: 200, duration_minutes: 60 },
      { name: 'Emergency Plumbing', description: '24/7 emergency plumbing services', price: 250, duration_minutes: 60 },
    ],
    faqs: [
      { question: 'What causes low water pressure?', answer: 'Low water pressure can be caused by pipe corrosion, leaks, or municipal supply issues. We can diagnose the exact cause.' },
      { question: 'How do I prevent frozen pipes?', answer: 'Insulate exposed pipes, keep cabinet doors open during cold snaps, and let faucets drip slightly during freezing temps.' },
      { question: 'Do you offer free estimates?', answer: 'Yes, we provide free estimates for most plumbing jobs. Emergency calls may have a service fee.' },
      { question: 'When should I replace my water heater?', answer: 'Most water heaters last 10-15 years. If yours is older or showing signs of rust or inefficiency, consider replacement.' },
    ],
    socialPosts: [
      { platform: 'facebook', content: '🔧 Dripping faucet? Running toilet? Don\'t let small leaks become big problems! Call us today. #PlumbingServices #AustinPlumber', status: 'scheduled' },
      { platform: 'instagram', content: '💧 Water conservation tip: Fix leaky faucets ASAP - a drip can waste 3,000+ gallons per year! #PlumbingTips #WaterConservation', status: 'scheduled' },
      { platform: 'linkedin', content: 'Commercial property managers: Regular plumbing maintenance prevents costly emergencies. Schedule your building inspection today. #CommercialPlumbing #PropertyManagement', status: 'scheduled' },
    ],
    blogPosts: [
      { title: 'Common Plumbing Emergencies', slug: 'common-plumbing-emergencies', excerpt: 'Know what to do when plumbing disasters strike.', content: 'Plumbing emergencies can happen at any time...' },
      { title: 'When to Replace Your Water Heater', slug: 'when-replace-water-heater', excerpt: 'Signs it\'s time for a new water heater and what to consider.', content: 'Your water heater works hard every day...' },
    ],
    aiProfile: {
      business_description: 'Full-service plumbing company serving residential and commercial customers in Austin, TX',
      primary_industry: 'Plumbing',
      target_audience: 'Homeowners and businesses needing plumbing services in Austin',
      tone: 'balanced',
      brand_voice: 'Professional, dependable, fast, honest pricing',
      keywords: ['plumber', 'plumbing repair', 'leak repair', 'drain cleaning', 'Austin plumber'],
      content_topics: ['plumbing maintenance', 'DIY tips', 'water conservation', 'emergency prep'],
      unique_selling_points: ['24/7 emergency service', 'Upfront pricing', 'Licensed master plumbers'],
    },
  },
  '298a7275-0a1f-4bd8-a0ae-b692fdbcd3af': {
    name: 'Demo Command',
    industry: 'Electrical',
    services: [
      { name: 'Electrical Repair', description: 'Troubleshooting and repair of electrical issues', price: 150, duration_minutes: 60 },
      { name: 'Panel Upgrades', description: 'Electrical panel replacement and upgrades', price: 2000, duration_minutes: 240 },
      { name: 'Lighting Installation', description: 'Indoor and outdoor lighting installation', price: 200, duration_minutes: 90 },
      { name: 'Outlet/Switch Repair', description: 'Outlet, switch, and wiring repairs', price: 125, duration_minutes: 45 },
      { name: 'Safety Inspections', description: 'Comprehensive electrical safety inspection', price: 175, duration_minutes: 60 },
    ],
    faqs: [
      { question: 'How often should I get an electrical inspection?', answer: 'We recommend electrical inspections every 3-5 years, or when buying/selling a home.' },
      { question: 'What causes circuit breaker trips?', answer: 'Overloaded circuits, short circuits, or ground faults. Frequent trips indicate a problem needing professional attention.' },
      { question: 'Can I do my own electrical work?', answer: 'For safety and code compliance, we recommend licensed electricians for most electrical work beyond simple outlet cover changes.' },
      { question: 'How do I know if I need a panel upgrade?', answer: 'Signs include frequent breaker trips, flickering lights, or an older 100-amp panel that can\'t support modern needs.' },
    ],
    socialPosts: [
      { platform: 'facebook', content: '⚡ Flickering lights? Hot outlets? Don\'t ignore electrical warning signs! Call us for a safety inspection. #ElectricalSafety #AustinElectrician', status: 'scheduled' },
      { platform: 'instagram', content: '💡 LED lighting upgrades save energy and look amazing! Transform your home with professional installation. #LEDLighting #HomeImprovement', status: 'scheduled' },
      { platform: 'linkedin', content: 'Business owners: Electrical issues cost money through downtime and energy waste. Our commercial services keep your business running efficiently. #CommercialElectrical #BusinessServices', status: 'scheduled' },
    ],
    blogPosts: [
      { title: 'Signs You Need a Panel Upgrade', slug: 'signs-need-panel-upgrade', excerpt: 'Is your electrical panel keeping up with modern demands?', content: 'Older homes often have electrical panels that weren\'t designed for today\'s power needs...' },
      { title: 'LED Lighting Benefits', slug: 'led-lighting-benefits', excerpt: 'Why LED lighting is the smart choice for your home or business.', content: 'LED technology has revolutionized home and commercial lighting...' },
    ],
    aiProfile: {
      business_description: 'Licensed electrical contractors serving residential and commercial customers in Austin, TX',
      primary_industry: 'Electrical',
      target_audience: 'Homeowners and businesses needing electrical services in Austin',
      tone: 'balanced',
      brand_voice: 'Expert, safety-focused, reliable, professional',
      keywords: ['electrician', 'electrical repair', 'panel upgrade', 'lighting installation', 'Austin electrician'],
      content_topics: ['electrical safety', 'energy efficiency', 'home upgrades', 'commercial electrical'],
      unique_selling_points: ['Licensed and insured', 'Code compliant work', '24/7 emergency service'],
    },
  },
  '56c0a3a8-a2a1-4689-9c18-d115080a816d': {
    name: 'Demo Connect',
    industry: 'Salon',
    services: [
      { name: 'Manicure', description: 'Classic manicure with polish', price: 35, duration_minutes: 30 },
      { name: 'Pedicure', description: 'Relaxing pedicure with massage', price: 50, duration_minutes: 45 },
      { name: 'Haircut', description: 'Precision haircut and style', price: 45, duration_minutes: 45 },
      { name: 'Hair Coloring', description: 'Professional hair coloring services', price: 120, duration_minutes: 120 },
      { name: 'Styling', description: 'Special occasion styling', price: 75, duration_minutes: 60 },
      { name: 'Nail Art', description: 'Custom nail art and designs', price: 25, duration_minutes: 30 },
    ],
    faqs: [
      { question: 'How long does a manicure last?', answer: 'A regular manicure lasts about 1 week, while gel manicures can last 2-3 weeks with proper care.' },
      { question: 'What is the difference between gel and acrylic nails?', answer: 'Gel nails are more flexible and natural-looking, while acrylics are stronger and better for length. We can help you choose!' },
      { question: 'Do you take walk-ins?', answer: 'We accept walk-ins based on availability, but appointments are recommended to guarantee your preferred time.' },
      { question: 'What hair products do you use?', answer: 'We use premium professional products and can customize based on your hair type and preferences.' },
    ],
    socialPosts: [
      { platform: 'facebook', content: '💅 Spring nails are HERE! Book your appointment for fresh, seasonal designs. #NailArt #AustinSalon #SpringNails', status: 'scheduled' },
      { platform: 'instagram', content: '✨ Before ➡️ After! Love this color transformation 😍 Book your appointment today! #HairTransformation #AustinHair #Balayage', status: 'scheduled' },
      { platform: 'linkedin', content: 'Looking for a new career in beauty? We\'re hiring talented stylists and nail technicians. Join our growing Austin team! #NowHiring #BeautyJobs', status: 'scheduled' },
    ],
    blogPosts: [
      { title: '2024 Hair Color Trends', slug: '2024-hair-color-trends', excerpt: 'Discover the hottest hair color trends for this year.', content: 'This year\'s hair color trends are all about dimension and natural beauty...' },
      { title: 'Nail Care Tips', slug: 'nail-care-tips', excerpt: 'Keep your nails healthy and beautiful between salon visits.', content: 'Beautiful nails start with healthy nail beds...' },
    ],
    aiProfile: {
      business_description: 'Full-service nail and hair salon in Austin, TX offering manicures, pedicures, haircuts, and styling',
      primary_industry: 'Beauty/Salon',
      target_audience: 'Beauty-conscious clients seeking nail and hair services in Austin',
      tone: 'balanced',
      brand_voice: 'Trendy, welcoming, creative, professional',
      keywords: ['nail salon', 'hair salon', 'manicure', 'pedicure', 'haircut', 'Austin salon'],
      content_topics: ['beauty trends', 'nail art', 'hair styles', 'self-care tips'],
      unique_selling_points: ['Experienced stylists', 'Premium products', 'Relaxing atmosphere'],
    },
  },
  'd4a6c195-c89a-4208-a818-981902af6c51': {
    name: 'Demo Starter',
    industry: 'Restaurant',
    services: [
      { name: 'Dine-In', description: 'Full dining experience with table service', price: 0, duration_minutes: 60 },
      { name: 'Takeout', description: 'Order ahead for quick pickup', price: 0, duration_minutes: 15 },
      { name: 'Catering', description: 'Full-service catering for events', price: 500, duration_minutes: 240 },
      { name: 'Private Events', description: 'Private dining room for special occasions', price: 300, duration_minutes: 180 },
    ],
    faqs: [
      { question: 'Do you accommodate dietary restrictions?', answer: 'Yes! We offer vegetarian, vegan, and gluten-free options. Please inform your server of any allergies.' },
      { question: 'How far in advance should I book catering?', answer: 'We recommend booking catering at least 2 weeks in advance, though we can sometimes accommodate shorter notice.' },
      { question: 'Do you take reservations?', answer: 'Yes, reservations are recommended for dinner and weekends. Walk-ins are welcome based on availability.' },
      { question: 'What are your hours?', answer: 'We\'re open Tuesday-Sunday for lunch (11am-3pm) and dinner (5pm-10pm). Closed Mondays.' },
    ],
    socialPosts: [
      { platform: 'facebook', content: '🍽️ Tonight\'s special: Paella Valenciana! Fresh seafood, saffron rice, and authentic Spanish flavors. Reserve your table now! #SpanishFood #AustinEats', status: 'scheduled' },
      { platform: 'instagram', content: '🌮 Taco Tuesday meets Spanish tapas! Join us for our fusion special menu. #AustinFoodie #TacoTuesday #SpanishCuisine', status: 'scheduled' },
      { platform: 'linkedin', content: 'Planning a corporate event? Our private dining room and catering services are perfect for team celebrations and client dinners. Contact us today! #CorporateCatering #AustinEvents', status: 'scheduled' },
    ],
    blogPosts: [
      { title: 'Our Story', slug: 'our-story', excerpt: 'Learn about our journey from family recipes to Austin favorite.', content: 'Our restaurant started with a dream and family recipes passed down through generations...' },
      { title: 'Authentic Spanish Recipes', slug: 'authentic-spanish-recipes', excerpt: 'Discover the secrets behind our most popular dishes.', content: 'Spanish cuisine is all about fresh ingredients and time-honored techniques...' },
    ],
    aiProfile: {
      business_description: 'Authentic Spanish and American restaurant in Austin, TX serving local food with international flair',
      primary_industry: 'Restaurant',
      target_audience: 'Food lovers in Austin seeking authentic Spanish and American cuisine',
      tone: 'balanced',
      brand_voice: 'Warm, authentic, passionate about food, welcoming',
      keywords: ['restaurant', 'Spanish food', 'Austin dining', 'catering', 'local food'],
      content_topics: ['menu specials', 'recipes', 'events', 'food culture'],
      unique_selling_points: ['Authentic recipes', 'Fresh local ingredients', 'Family atmosphere'],
    },
  },
};

async function seedCompanyData(supabase: ReturnType<typeof createClient>, companyId: string, clearExisting: boolean) {
  const companyData = COMPANY_DATA[companyId as keyof typeof COMPANY_DATA];
  if (!companyData) {
    return { error: `Company data not found for ID: ${companyId}` };
  }

  const results = {
    services: 0,
    faqs: 0,
    aiProfile: 0,
    socialPosts: 0,
    blogPosts: 0,
    appointments: 0,
    leads: 0,
    customers: 0,
    campaigns: 0,
    businessHours: 0,
  };

  try {
    // Clear existing data if requested
    if (clearExisting) {
      await Promise.all([
        supabase.from('services').delete().eq('company_id', companyId),
        supabase.from('faqs').delete().eq('company_id', companyId),
        supabase.from('company_ai_content_profiles').delete().eq('company_id', companyId),
        supabase.from('scheduled_social_posts').delete().eq('company_id', companyId),
        supabase.from('scheduled_blog_posts').delete().eq('company_id', companyId),
        supabase.from('appointments').delete().eq('company_id', companyId),
        supabase.from('leads').delete().eq('company_id', companyId),
        supabase.from('customer_profiles').delete().eq('company_id', companyId),
        supabase.from('marketing_campaigns').delete().eq('company_id', companyId),
        supabase.from('business_hours').delete().eq('company_id', companyId),
      ]);
    }

    // Seed Services
    const servicesData = companyData.services.map(s => ({
      company_id: companyId,
      name: s.name,
      description: s.description,
      price: s.price,
      duration_minutes: s.duration_minutes,
      is_active: true,
    }));
    const { data: servicesResult } = await supabase.from('services').insert(servicesData).select();
    results.services = servicesResult?.length || 0;

    // Seed FAQs
    const faqsData = companyData.faqs.map(f => ({
      company_id: companyId,
      question: f.question,
      answer: f.answer,
      is_active: true,
    }));
    const { data: faqsResult } = await supabase.from('faqs').insert(faqsData).select();
    results.faqs = faqsResult?.length || 0;

    // Seed AI Profile
    const aiProfileData = {
      company_id: companyId,
      business_description: companyData.aiProfile.business_description,
      primary_industry: companyData.aiProfile.primary_industry,
      target_audience: companyData.aiProfile.target_audience,
      tone: companyData.aiProfile.tone,
      brand_voice: companyData.aiProfile.brand_voice,
      keywords: companyData.aiProfile.keywords,
      content_topics: companyData.aiProfile.content_topics,
      unique_selling_points: companyData.aiProfile.unique_selling_points,
    };
    const { data: aiProfileResult } = await supabase.from('company_ai_content_profiles').upsert(aiProfileData, { onConflict: 'company_id' }).select();
    results.aiProfile = aiProfileResult?.length || 0;

    // Seed Social Posts
    const now = new Date();
    const socialPostsData = companyData.socialPosts.map((p, i) => ({
      company_id: companyId,
      topic: `${companyData.industry} social post`,
      platforms: [p.platform],
      content_json: { [p.platform]: p.content },
      status: 'approved',
      scheduled_for: new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    }));
    const { data: socialResult, error: socialError } = await supabase.from('scheduled_social_posts').insert(socialPostsData).select();
    if (socialError) console.error('Social posts error:', socialError);
    results.socialPosts = socialResult?.length || 0;

    // Seed Blog Posts
    const blogPostsData = companyData.blogPosts.map((b, i) => ({
      company_id: companyId,
      title: b.title,
      slug: `${b.slug}-${companyId.substring(0, 8)}-${Date.now()}-${i}`,
      excerpt: b.excerpt,
      content: b.content,
      status: 'pending',
      scheduled_for: new Date(now.getTime() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    const { data: blogResult, error: blogError } = await supabase.from('scheduled_blog_posts').insert(blogPostsData).select();
    if (blogError) console.error('Blog posts error:', blogError);
    results.blogPosts = blogResult?.length || 0;

    // Seed Demo Appointments
    const appointmentsData = [];
    for (let i = 0; i < 8; i++) {
      const daysOffset = i < 4 ? -(i + 1) * 3 : (i - 3) * 2; // Past and future appointments
      const status = i < 4 ? 'completed' : (i < 7 ? 'scheduled' : 'cancelled');
      appointmentsData.push({
        company_id: companyId,
        customer_name: `Demo Customer ${i + 1}`,
        customer_email: `customer${i + 1}@demo.com`,
        customer_phone: `+1512555${1000 + i}`,
        customer_address: `${100 + i * 10} Demo Street, Austin, TX 78701`,
        service_type: companyData.services[i % companyData.services.length].name,
        datetime: new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: companyData.services[i % companyData.services.length].duration_minutes,
        status,
        notes: `Demo appointment for ${companyData.industry} service`,
      });
    }
    const { data: appointmentsResult } = await supabase.from('appointments').insert(appointmentsData).select();
    results.appointments = appointmentsResult?.length || 0;

    // Seed Leads
    const leadSources = ['website', 'referral', 'social_media', 'phone'];
    const leadPriorities = ['high', 'medium', 'low'];
    const leadsData = [];
    for (let i = 0; i < 5; i++) {
      leadsData.push({
        company_id: companyId,
        name: `Lead Contact ${i + 1}`,
        email: `lead${i + 1}@demo.com`,
        phone: `+1512555${2000 + i}`,
        source: leadSources[i % leadSources.length],
        priority: leadPriorities[i % leadPriorities.length],
        status: i < 2 ? 'new' : (i < 4 ? 'contacted' : 'qualified'),
        notes: `Demo lead interested in ${companyData.services[i % companyData.services.length].name}`,
      });
    }
    const { data: leadsResult } = await supabase.from('leads').insert(leadsData).select();
    results.leads = leadsResult?.length || 0;

    // Seed Customer Profiles
    const companySlug = companyId.substring(0, 8);
    const customersData = [];
    for (let i = 0; i < 5; i++) {
      customersData.push({
        company_id: companyId,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}.${companySlug}@demo.com`,
        phone: `+1512555${3000 + i}`,
        address: `${200 + i * 10} Customer Ave, Austin, TX 78701`,
        notes: `Regular customer for ${companyData.industry} services`,
      });
    }
    const { data: customersResult, error: customersError } = await supabase.from('customer_profiles').insert(customersData).select();
    if (customersError) console.error('Customers error:', customersError);
    results.customers = customersResult?.length || 0;

    // Seed Marketing Campaigns
    const campaignsData = [
      {
        company_id: companyId,
        name: `${companyData.industry} Spring Promotion`,
        campaign_type: 'promotional',
        status: 'active',
        email_subject: `Special Spring Offer from ${companyData.name}`,
        message_template: `Don't miss our spring specials on ${companyData.services[0].name}!`,
        channels: ['email'],
      },
      {
        company_id: companyId,
        name: `${companyData.industry} Seasonal Campaign`,
        campaign_type: 'seasonal',
        status: 'draft',
        email_subject: `Summer is Coming - Prepare Now!`,
        message_template: `Get ready for summer with our ${companyData.industry.toLowerCase()} services.`,
        channels: ['sms'],
      },
      {
        company_id: companyId,
        name: `Customer Follow-up Campaign`,
        campaign_type: 'follow_up',
        status: 'scheduled',
        email_subject: `How was your experience?`,
        message_template: `We'd love to hear your feedback about your recent ${companyData.services[0].name} service.`,
        channels: ['email'],
      },
    ];
    const { data: campaignsResult } = await supabase.from('marketing_campaigns').insert(campaignsData).select();
    results.campaigns = campaignsResult?.length || 0;

    // Seed Business Hours (vary by industry)
    const isRestaurantOrSalon = ['Restaurant', 'Salon'].includes(companyData.industry);
    const businessHoursData = [];
    for (let day = 0; day < 7; day++) {
      const isClosed = isRestaurantOrSalon ? day === 1 : (day === 0 || day === 6); // Restaurants/salons closed Monday, others closed weekends
      businessHoursData.push({
        company_id: companyId,
        day_of_week: day,
        is_closed: isClosed,
        open_time: isClosed ? null : (isRestaurantOrSalon ? '11:00' : '08:00'),
        close_time: isClosed ? null : (isRestaurantOrSalon ? '22:00' : '18:00'),
        hour_type: 'regular',
      });
    }
    const { data: businessHoursResult } = await supabase.from('business_hours').insert(businessHoursData).select();
    results.businessHours = businessHoursResult?.length || 0;

  } catch (error) {
    console.error('Error seeding data:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results };
  }

  return { success: true, results };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { companyId, clearExisting = false } = await req.json();

    // If specific company, seed just that one
    if (companyId) {
      const result = await seedCompanyData(supabase, companyId, clearExisting);
      return new Response(
        JSON.stringify(result),
        { status: result.error ? 400 : 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Otherwise seed all companies
    const allResults: Record<string, unknown> = {};
    for (const id of Object.keys(COMPANY_DATA)) {
      allResults[id] = await seedCompanyData(supabase, id, clearExisting);
    }

    return new Response(
      JSON.stringify({ success: true, results: allResults }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
