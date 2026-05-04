/**
 * Industry-specific social media templates
 * Pre-populated content for vertical-specific marketing
 */

export interface IndustryTemplate {
  id: string;
  label: string;
  icon: string;
  color: string;
  templates: {
    instagram: string[];
    facebook: string[];
    linkedin: string[];
    tiktok: string[];
    sms: string[];
  };
}

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  hvac: {
    id: 'hvac',
    label: 'HVAC',
    icon: '❄️',
    color: '#3B82F6',
    templates: {
      instagram: [
        "🔥 Is your AC ready for summer? Schedule your tune-up today and beat the heat! #HVAC #ACRepair #SummerReady",
        "❄️ Winter is coming! Don't get caught in the cold. Book your furnace inspection now. #HeatingRepair #WinterPrep",
        "💡 Energy bills too high? Our HVAC experts can help you save up to 30% on cooling costs. DM us for a free estimate!",
        "🌡️ Hot spots in your home? It might be time for duct cleaning or AC maintenance. We've got you covered!",
      ],
      facebook: [
        "🏠 Seasonal HVAC Tip: Change your air filters every 1-3 months for optimal performance and air quality. Need help? Call us today!",
        "⚠️ Don't wait until your AC breaks down on the hottest day of the year! Schedule preventive maintenance now and stay cool all summer.",
        "🎉 LIMITED TIME: $50 off your first AC tune-up! Mention this post when you call. Offer expires soon!",
      ],
      linkedin: [
        "As a local HVAC company, we're committed to keeping homes and businesses comfortable year-round. Our certified technicians are ready to help with all your heating and cooling needs.",
        "Energy efficiency isn't just good for your wallet—it's good for the environment. Learn how modern HVAC solutions can reduce your carbon footprint.",
      ],
      tiktok: [
        "POV: You're an HVAC tech arriving to save someone's summer 😎 #HVACLife #ACRepair #SummerVibes",
        "When the AC breaks and you're the hero who fixes it 🦸 #HVACTech #HomeRepair",
      ],
      sms: [
        "Hi {name}! Your AC tune-up is coming up. Reply YES to confirm or call us to reschedule.",
        "Summer heat alert! ☀️ Schedule your AC check today: {link}",
      ],
    },
  },
  plumbing: {
    id: 'plumbing',
    label: 'Plumbing',
    icon: '🔧',
    color: '#0EA5E9',
    templates: {
      instagram: [
        "🚿 Drip, drip, drip... That leaky faucet could be wasting 3,000 gallons a year! Let us fix it today. #PlumbingExperts #WaterConservation",
        "🚽 Clogged drain? Don't reach for the chemicals! Call a pro for safe, effective drain cleaning. #PlumbingTips #DrainCleaning",
        "💧 Water heater acting up? Signs to watch: lukewarm water, strange noises, rusty water. We're here to help!",
      ],
      facebook: [
        "🏠 Plumbing Emergency? We offer 24/7 service because pipes don't care what time it is! Save our number: [phone]",
        "💡 Weekly Tip: Know where your main water shutoff is! It could save you thousands in water damage during an emergency.",
        "🎉 Spring Special: Camera drain inspection + cleaning for just $149! Catch problems before they become disasters.",
      ],
      linkedin: [
        "Licensed and insured plumbing services for residential and commercial properties. Our team brings years of experience to every job, big or small.",
        "From routine maintenance to emergency repairs, our commitment to quality workmanship has made us the trusted choice for local plumbing needs.",
      ],
      tiktok: [
        "Things plumbers see that make us cringe 😬 #PlumberLife #HomeOwnerTips",
        "The satisfying moment when you clear a stubborn clog 😌 #DrainCleaning #PlumbingWin",
      ],
      sms: [
        "Hi {name}! Just a reminder about your plumbing appointment tomorrow at {time}. Reply YES to confirm.",
        "Emergency plumbing? We're available 24/7: {link}",
      ],
    },
  },
  electrical: {
    id: 'electrical',
    label: 'Electrical',
    icon: '⚡',
    color: '#F59E0B',
    templates: {
      instagram: [
        "⚡ Flickering lights? It's not ghosts—it could be a wiring issue. Stay safe, call a licensed electrician! #ElectricalSafety",
        "🔌 Planning a home renovation? Don't forget to upgrade your electrical panel! Modern homes need modern power.",
        "💡 LED upgrades can save you up to 75% on lighting costs. Let us help you make the switch!",
      ],
      facebook: [
        "⚠️ Electrical Safety Reminder: Overloaded outlets are a leading cause of house fires. If you're using multiple power strips, it's time to call us for an upgrade!",
        "🏠 Thinking about a generator for storm season? We can help you choose and install the right backup power solution for your home.",
        "🎉 FREE electrical safety inspection with any service call this month! Protect your family and home.",
      ],
      linkedin: [
        "As certified electrical contractors, we take pride in delivering safe, code-compliant installations for homes and businesses throughout the area.",
        "Smart home technology is transforming how we live. From automated lighting to EV charger installations, we're ready for the future of electrical services.",
      ],
      tiktok: [
        "When a homeowner says 'I tried to fix it myself' 😅 #ElectricianLife #SafetyFirst",
        "The glow-up after we install new LED fixtures ✨ #HomeImprovement #LightingDesign",
      ],
      sms: [
        "Hi {name}! Your electrical inspection is scheduled for {date}. Reply YES to confirm.",
        "Upgrade your home's electrical—free estimates: {link}",
      ],
    },
  },
  roofing: {
    id: 'roofing',
    label: 'Roofing',
    icon: '🏠',
    color: '#78350F',
    templates: {
      instagram: [
        "🏠 Your roof protects everything you love. When was your last inspection? Schedule yours today! #RoofingExperts",
        "🌧️ Storm damage? We offer FREE inspections and work with all insurance companies. Don't wait—call now!",
        "☀️ Summer sun can be tough on shingles. Look for curling, cracking, or missing granules. We can help!",
      ],
      facebook: [
        "🏠 Signs you need a new roof: Shingles curling or missing, daylight through roof boards, sagging areas. See any of these? Call us for a free inspection!",
        "⚡ Storm just passed through? We're offering priority scheduling for storm damage assessments. Your safety is our priority!",
        "🎉 Financing available! A new roof is an investment in your home's value. Ask about our 0% APR options.",
      ],
      linkedin: [
        "Quality roofing installation and repair for residential and commercial properties. Our certified team uses only the best materials for lasting protection.",
        "As your local roofing experts, we understand the unique weather challenges in our area and build roofs that stand the test of time.",
      ],
      tiktok: [
        "The before and after that homeowners love to see 🏠 #RoofingTransformation #HomeImprovement",
        "POV: Inspecting a roof after a major storm 🌪️ #RoofingLife #StormDamage",
      ],
      sms: [
        "Hi {name}! Your roof inspection is tomorrow at {time}. Reply YES to confirm.",
        "Free roof inspection after the recent storms: {link}",
      ],
    },
  },
  solar: {
    id: 'solar',
    label: 'Solar Energy',
    icon: '☀️',
    color: '#F97316',
    templates: {
      instagram: [
        "☀️ Did you know solar can cut your electricity bill by up to 90%? Let the sun pay your bills! #SolarPower #CleanEnergy",
        "🌱 Go green and save green! Solar installation has never been more affordable. Get your free quote today!",
        "💰 Federal tax credits make now the BEST time to go solar. Don't miss out on 30% savings!",
      ],
      facebook: [
        "☀️ How Solar Works: Your panels generate electricity → Power your home → Sell excess back to the grid → PROFIT! Ready to learn more?",
        "🏠 Our customers save an average of $150/month on electricity after going solar. What would YOU do with that extra money?",
        "🎉 Limited Time: $0 down solar installation! Start saving from day one. Schedule your free consultation!",
      ],
      linkedin: [
        "Helping homeowners and businesses transition to clean, renewable solar energy. Our certified installation team ensures maximum efficiency and ROI.",
        "The solar industry continues to grow as more property owners recognize the financial and environmental benefits of renewable energy.",
      ],
      tiktok: [
        "When the electric bill is $0 after going solar 😎 #SolarPower #MoneyTips #CleanEnergy",
        "Installing solar panels is literally putting money on your roof 💰 #SolarLife #HomeUpgrade",
      ],
      sms: [
        "Hi {name}! Your solar consultation is scheduled for {date}. Reply YES to confirm.",
        "See how much you can save with solar: {link}",
      ],
    },
  },
  landscape: {
    id: 'landscape',
    label: 'Landscape & Trees',
    icon: '🌳',
    color: '#22C55E',
    templates: {
      instagram: [
        "🌳 Transform your outdoor space! From lawn care to complete landscape design, we make your vision reality. #LandscapeDesign",
        "🍂 Fall cleanup time! Don't let leaves damage your lawn. Schedule your cleanup service today!",
        "🌺 Curb appeal matters! A beautiful landscape can increase your home's value by up to 15%.",
      ],
      facebook: [
        "🏡 Dreaming of a backyard oasis? Our landscape designers can help you create the perfect outdoor living space for your family!",
        "🌳 Tree trimming season is here! Regular pruning keeps your trees healthy and your property safe. Book now!",
        "🎉 Spring Special: Free design consultation with any landscape project over $1,000!",
      ],
      linkedin: [
        "Professional landscaping services for residential and commercial properties. From maintenance to complete outdoor transformations.",
        "Quality landscape design adds value to properties while creating functional outdoor spaces for work and relaxation.",
      ],
      tiktok: [
        "The transformation that took this yard from 0 to 💯 #LandscapeDesign #BeforeAndAfter",
        "Satisfying tree trimming compilation 🌳✂️ #TreeService #Satisfying",
      ],
      sms: [
        "Hi {name}! Your lawn service is scheduled for {date}. Reply YES to confirm.",
        "Ready for a landscape upgrade? Free estimates: {link}",
      ],
    },
  },
  pool_spa: {
    id: 'pool_spa',
    label: 'Pool & Spa',
    icon: '🏊',
    color: '#06B6D4',
    templates: {
      instagram: [
        "🏊 Crystal clear water, ready for summer fun! Schedule your pool opening service today. #PoolLife #SummerReady",
        "🌴 Hot tub season is year-round! Ask about our spa maintenance packages for worry-free relaxation.",
        "💧 Green pool? We can bring it back to life in 24-48 hours. Don't suffer through another week of murky water!",
      ],
      facebook: [
        "🏊 Pool Opening Checklist: Remove cover, fill water level, balance chemicals, inspect equipment, TEST! Or just call us and relax 😎",
        "🌡️ Hot tub tip: Drain and refill every 3-4 months for optimal water quality. Need help? That's what we're here for!",
        "🎉 Book your pool opening by April 15 and get a FREE chemical kit ($75 value)!",
      ],
      linkedin: [
        "Professional pool and spa services for residential properties. From weekly maintenance to equipment repair and renovation.",
        "Quality pool care requires expertise and attention to detail. Our certified technicians ensure your investment stays in pristine condition.",
      ],
      tiktok: [
        "Satisfying pool transformation: green to clean 💚➡️💙 #PoolCleaning #Satisfying",
        "POV: Pool tech on a Monday morning 🏊‍♂️☀️ #PoolLife #SummerVibes",
      ],
      sms: [
        "Hi {name}! Pool service is scheduled for {date}. Reply YES to confirm.",
        "Pool opening special—book now: {link}",
      ],
    },
  },
  pest_control: {
    id: 'pest_control',
    label: 'Pest Control',
    icon: '🐜',
    color: '#84CC16',
    templates: {
      instagram: [
        "🐜 Ants marching through your kitchen? We'll show them the exit—permanently! #PestControl #AntFree",
        "🕷️ Don't share your home with uninvited guests! Our treatments are safe for your family and pets.",
        "🦟 Mosquito season is here! Protect your backyard with our barrier spray treatments.",
      ],
      facebook: [
        "🏠 Signs of a pest problem: Droppings, strange smells, damaged wood or fabric, actual sightings. If you see any of these, call us!",
        "🐀 Rodent prevention tip: Seal gaps around pipes, doors, and windows. Mice can squeeze through openings as small as a dime!",
        "🎉 First treatment 50% off for new customers! Safe, effective pest control for your home.",
      ],
      linkedin: [
        "Licensed pest control services for residential and commercial properties. Eco-friendly options available for a safer approach to pest management.",
        "Integrated pest management combines prevention, monitoring, and targeted treatments for long-lasting results.",
      ],
      tiktok: [
        "What I found under this client's house 😱 #PestControl #WildFind",
        "The satisfying moment when the treatment works perfectly 🎯 #BugFree #PestControlLife",
      ],
      sms: [
        "Hi {name}! Your pest control service is scheduled for {date}. Reply YES to confirm.",
        "Seeing pests? Get 50% off your first treatment: {link}",
      ],
    },
  },
  appliance_repair: {
    id: 'appliance_repair',
    label: 'Appliance Repair',
    icon: '🔧',
    color: '#6366F1',
    templates: {
      instagram: [
        "🧊 Fridge on the fritz? Our techs can diagnose and repair most issues same-day! #ApplianceRepair #SameDay",
        "🧺 Washer making strange noises? It's trying to tell you something! Call us before it becomes a bigger problem.",
        "🍳 Oven not heating properly? We repair all major brands. Don't order takeout—call us!",
      ],
      facebook: [
        "🏠 Before you buy new, call us! 80% of appliance issues can be repaired for a fraction of replacement cost.",
        "💡 Appliance Tip: Clean your dryer vent regularly! A clogged vent is a fire hazard and makes your dryer work harder.",
        "🎉 $20 off any repair over $100! Mention this post when you call.",
      ],
      linkedin: [
        "Factory-trained appliance repair technicians serving residential customers. We repair all major brands and provide upfront pricing.",
        "Quality appliance repair extends the life of your investments. Our certified team ensures repairs are done right the first time.",
      ],
      tiktok: [
        "When the client says 'it just stopped working' and I find a sock in the drain pump 🧦 #ApplianceRepair #PlotTwist",
        "The most satisfying dishwasher repair 🧽✨ #FixIt #ApplianceLife",
      ],
      sms: [
        "Hi {name}! Your appliance repair appointment is {date} at {time}. Reply YES to confirm.",
        "Appliance not working? Same-day service: {link}",
      ],
    },
  },
  handyman: {
    id: 'handyman',
    label: 'Handyman & Cleaning',
    icon: '🛠️',
    color: '#8B5CF6',
    templates: {
      instagram: [
        "🛠️ Too many small projects piling up? That's our specialty! From repairs to installations, we handle it all.",
        "🧹 Deep cleaning that makes your home feel brand new! Book your whole-home refresh today.",
        "🔨 Honey-do list getting long? Hand it over to us and enjoy your weekend!",
      ],
      facebook: [
        "🏠 No job too small! Leaky faucets, squeaky doors, picture hanging, furniture assembly—we do it all!",
        "🧼 Spring cleaning special! Whole-home deep clean starting at $199. Book now before slots fill up!",
        "🎉 Refer a friend and BOTH get $25 off your next service!",
      ],
      linkedin: [
        "Reliable handyman and cleaning services for homeowners and property managers. Licensed, insured, and committed to quality.",
        "From routine maintenance to complete property turnovers, our team handles all the details so you don't have to.",
      ],
      tiktok: [
        "5 things every homeowner should know how to fix (or call us 😉) #HandymanTips #HomeOwner",
        "The satisfaction of a freshly organized garage 📦✨ #Organizing #HandymanLife",
      ],
      sms: [
        "Hi {name}! Your handyman appointment is {date} at {time}. Reply YES to confirm.",
        "Have a project? Free estimates: {link}",
      ],
    },
  },
  construction: {
    id: 'construction',
    label: 'Construction',
    icon: '🏗️',
    color: '#EAB308',
    templates: {
      instagram: [
        "🏗️ Building dreams, one project at a time! Check out our latest custom home build. #Construction #CustomHome",
        "🔨 From foundation to finish, we handle every detail of your construction project.",
        "📐 Thinking about a home addition? Let's design and build your perfect space!",
      ],
      facebook: [
        "🏠 Before you start your renovation, get a proper plan! Free consultations available for projects over $10k.",
        "🏗️ Quality construction takes time, expertise, and the right materials. We never cut corners.",
        "🎉 NOW BOOKING spring/summer projects! Get on our schedule early for your dream renovation.",
      ],
      linkedin: [
        "Licensed general contractor specializing in residential construction, renovations, and additions. Building with integrity since [year].",
        "Quality construction requires attention to detail at every stage. Our project management ensures your vision becomes reality, on time and on budget.",
      ],
      tiktok: [
        "The transformation from day 1 to move-in day 🏠 #Construction #BuildingDreams",
        "What goes into building a house (it's more than you think!) #ConstructionLife #Education",
      ],
      sms: [
        "Hi {name}! Your project consultation is {date} at {time}. Reply YES to confirm.",
        "Ready to build? Free consultations: {link}",
      ],
    },
  },
  auto_care: {
    id: 'auto_care',
    label: 'Auto Care',
    icon: '🚗',
    color: '#EF4444',
    templates: {
      instagram: [
        "🚗 Your car deserves the best care! Full-service auto maintenance and repair. #AutoCare #CarMaintenance",
        "🔧 That check engine light won't fix itself! Free diagnostics with any repair service.",
        "🛞 Tire season is here! Swap, rotate, or upgrade—we've got you covered.",
      ],
      facebook: [
        "🚗 5 signs your car needs attention: Strange noises, warning lights, poor fuel economy, vibrations, or fluid leaks. Don't ignore them!",
        "🏎️ Quality parts + experienced techs = repairs that last. That's our promise to you.",
        "🎉 Oil change special: $29.99 for conventional, $59.99 for synthetic! Includes multi-point inspection.",
      ],
      linkedin: [
        "Full-service auto repair and maintenance for all makes and models. ASE-certified technicians committed to keeping you safely on the road.",
        "Automotive care built on trust. We explain every repair, provide upfront pricing, and stand behind our work.",
      ],
      tiktok: [
        "What your mechanic wishes you knew about car maintenance 🔧 #CarTips #AutoCare",
        "The sound of a perfectly tuned engine 😌 #CarLife #Satisfying",
      ],
      sms: [
        "Hi {name}! Your service appointment is {date} at {time}. Reply YES to confirm.",
        "Time for an oil change? Book online: {link}",
      ],
    },
  },
  security_systems: {
    id: 'security_systems',
    label: 'Security Systems',
    icon: '🔒',
    color: '#1E40AF',
    templates: {
      instagram: [
        "🔒 Protect what matters most. Smart security for modern homes. #HomeSecurity #SmartHome",
        "📹 See who's at your door from anywhere! Video doorbell installation starting at $149.",
        "🚨 24/7 monitoring gives you peace of mind, day and night.",
      ],
      facebook: [
        "🏠 Home security isn't just about alarms—it's cameras, smart locks, motion sensors, and professional monitoring working together.",
        "📱 Control your entire security system from your phone! Arm, disarm, and monitor from anywhere.",
        "🎉 Free equipment with 3-year monitoring agreement! Protect your home for less than $1/day.",
      ],
      linkedin: [
        "Comprehensive security solutions for residential and commercial properties. From design to installation to 24/7 monitoring.",
        "Modern security goes beyond basic alarms. Smart integration, video verification, and mobile control provide complete protection.",
      ],
      tiktok: [
        "POV: A package thief meets a video doorbell 📹 #HomeSecurity #CaughtOnCamera",
        "Setting up a smart home security system in 60 seconds ⏱️ #SmartHome #Security",
      ],
      sms: [
        "Hi {name}! Your security consultation is {date} at {time}. Reply YES to confirm.",
        "Free security assessment: {link}",
      ],
    },
  },
  real_estate: {
    id: 'real_estate',
    label: 'Real Estate',
    icon: '🏡',
    color: '#059669',
    templates: {
      instagram: [
        "🏡 Just listed! Beautiful 3BR home in [neighborhood]. DM for details! #RealEstate #JustListed",
        "🔑 SOLD! Another happy family in their dream home. Ready to start your journey?",
        "📍 Market update: It's a great time to [buy/sell]! Let's chat about your goals.",
      ],
      facebook: [
        "🏠 Thinking about selling? Here's what you need to know about today's market... [tips]",
        "🏡 Open house this Sunday 1-4pm! [address]. Come see this stunning [beds]BR home!",
        "🎉 Just closed! Congratulations to my amazing clients on their new home!",
      ],
      linkedin: [
        "Helping families find their perfect home in [area]. Whether buying or selling, I'm here to guide you through every step.",
        "Real estate market insights: [current trend analysis]. Contact me to discuss what this means for your property goals.",
      ],
      tiktok: [
        "House tour of this amazing property 🏡 #RealEstate #HouseTour #DreamHome",
        "What $[price] gets you in [city] 🤯 #RealEstateMarket #HomeTour",
      ],
      sms: [
        "Hi {name}! Your home showing is confirmed for {date} at {time}. Reply YES to confirm.",
        "New listing matching your criteria: {link}",
      ],
    },
  },
  beauty_wellness: {
    id: 'beauty_wellness',
    label: 'Beauty & Wellness',
    icon: '💆',
    color: '#EC4899',
    templates: {
      instagram: [
        "💆‍♀️ Self-care isn't selfish—it's necessary! Book your relaxation session today. #SelfCare #Wellness",
        "💅 New season, new look! Check out our latest nail designs. #NailArt #BeautyTrends",
        "✨ Glowing skin is always in! Ask about our facial treatments.",
      ],
      facebook: [
        "💆 Stressed? Our massage therapists are ready to melt your tension away. Book your escape!",
        "💇‍♀️ New client special: 20% off your first haircut or color service! ",
        "🎉 Spa day with your bestie? Book together and save 15%!",
      ],
      linkedin: [
        "Creating beautiful experiences in our relaxing spa environment. Our licensed professionals are dedicated to your wellness journey.",
        "Self-care is essential for work-life balance. Treat yourself to the rejuvenation you deserve.",
      ],
      tiktok: [
        "The transformation that had everyone asking for her hair routine 💇‍♀️ #HairTransformation #BeautyTips",
        "Spa day ASMR that'll make you book immediately 💆‍♀️ #SpaTok #Relaxing",
      ],
      sms: [
        "Hi {name}! Your appointment is {date} at {time}. Reply YES to confirm.",
        "Time for self-care! Book your next visit: {link}",
      ],
    },
  },
  restaurants: {
    id: 'restaurants',
    label: 'Restaurants',
    icon: '🍽️',
    color: '#DC2626',
    templates: {
      instagram: [
        "🍽️ Fresh, local, delicious. That's our promise to you! #FoodieLife #LocalEats",
        "🍕 Friday night special: [dish] + wine pairing for just $[price]!",
        "👨‍🍳 Behind the scenes with Chef [name]! See how we prepare your favorites.",
      ],
      facebook: [
        "🍴 This week's special: [dish description]. Available until Sunday or while supplies last!",
        "🎉 Book your private event with us! Perfect for birthdays, anniversaries, and corporate gatherings.",
        "📍 Now accepting reservations for Valentine's Day! Don't miss our special prix fixe menu.",
      ],
      linkedin: [
        "Crafting memorable dining experiences for our community. From intimate dinners to corporate events, we're honored to serve you.",
        "Supporting local farmers and producers is at the heart of our menu. Fresh ingredients make all the difference.",
      ],
      tiktok: [
        "The dish everyone's ordering this week 🍝 #FoodTok #RestaurantLife",
        "How we make our famous [signature dish] 👨‍🍳 #BehindTheScenes #FoodieLife",
      ],
      sms: [
        "Hi {name}! Here's the link to book your table: {link}",
        "Thanks for calling {company}! Menu & hours: {link}",
      ],
    },
  },
  personal_assistant: {
    id: 'personal_assistant',
    label: 'Personal Assistant',
    icon: '📋',
    color: '#7C3AED',
    templates: {
      instagram: [
        "📋 Too much on your plate? Let me take some off! Virtual assistant services for busy professionals. #VirtualAssistant",
        "⏰ Time is your most valuable resource. Let me help you get more of it back!",
        "📧 Inbox zero is possible! Ask me how I help clients stay organized.",
      ],
      facebook: [
        "🏃‍♀️ Running a business shouldn't mean running yourself ragged. Learn how a virtual assistant can help you scale!",
        "📅 Calendar management, email organization, travel booking—I handle the details so you can focus on growth.",
        "🎉 New client special: First 5 hours at 50% off! Let's see what we can accomplish together.",
      ],
      linkedin: [
        "Professional virtual assistant services for entrepreneurs and executives. Streamline your operations and reclaim your time.",
        "Delegation is key to scaling. Let me handle administrative tasks while you focus on strategic growth.",
      ],
      tiktok: [
        "A day in the life of a virtual assistant ☕📱 #VALife #WorkFromHome",
        "How I help business owners save 10+ hours a week ⏰ #ProductivityTips #VirtualAssistant",
      ],
      sms: [
        "Hi {name}! Your consultation call is {date} at {time}. Reply YES to confirm.",
        "Ready to delegate? Book a free consultation: {link}",
      ],
    },
  },
  fencing: {
    id: 'fencing',
    label: 'Fencing & Decking',
    icon: '🏡',
    color: '#92400E',
    templates: {
      instagram: [
        "🏡 Define your space with a beautiful new fence! Privacy, security, and curb appeal. #FencingPro #BackyardGoals",
        "🪵 Deck season is here! Create your perfect outdoor living space with our custom designs.",
        "🔨 Quality craftsmanship that stands the test of time. See our latest project!",
      ],
      facebook: [
        "🏠 Thinking about a new fence? Wood, vinyl, aluminum, chain link—we install them all! Free estimates.",
        "🌅 Imagine hosting summer BBQs on your beautiful new deck. Let's make it happen!",
        "🎉 Spring special: 10% off all fence installations booked this month!",
      ],
      linkedin: [
        "Professional fencing and deck installation for residential properties. Quality materials and craftsmanship you can trust.",
        "Outdoor living spaces add value to your property. Our custom deck designs blend seamlessly with your home's architecture.",
      ],
      tiktok: [
        "This fence transformation is everything 😍 #FenceBuilding #BeforeAndAfter",
        "Building a deck from start to finish ⏰ #DeckBuilding #DIY",
      ],
      sms: [
        "Hi {name}! Your fence estimate is scheduled for {date}. Reply YES to confirm.",
        "Ready for your new fence or deck? Free estimates: {link}",
      ],
    },
  },
};

export const INDUSTRY_LIST = Object.values(INDUSTRY_TEMPLATES);

export function getIndustryById(id: string): IndustryTemplate | undefined {
  return INDUSTRY_TEMPLATES[id];
}

export function getTemplatesForPlatform(industryId: string, platform: keyof IndustryTemplate['templates']): string[] {
  const industry = getIndustryById(industryId);
  return industry?.templates[platform] || [];
}
