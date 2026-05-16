import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      
      <main className="container max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">Terms of Service for Aura Intercept LLC</h1>
        
        <p className="text-muted-foreground mb-8">Effective Date: April 28, 2026</p>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <p>
            Welcome to Aura Intercept. These Terms of Service ("Terms") govern your access to and use of the 
            Aura Intercept website, services, and applications (the "Service"), operated by <strong className="text-foreground">Aura Intercept LLC</strong> 
            (referred to as "Aura Intercept," "we," "us," or "our"). By accessing or using the Service, 
            you agree to be bound by these Terms. If you do not agree, do not use the Service.
          </p>

          <div className="border border-destructive/40 bg-destructive/5 rounded-lg p-4 text-sm">
            <strong className="text-foreground uppercase">Important Notice:</strong> The Service relies on artificial intelligence (AI) 
            technology that is inherently probabilistic. Aura Intercept LLC <strong className="text-foreground">does not guarantee or warrant</strong> that 
            the AI, automation, or any platform feature will function 100% accurately, reliably, continuously, or without error. 
            By using the Service, you expressly assume all risk of AI errors, miscommunications, downtime, missed bookings, 
            lost leads, lost customers, lost revenue, lost social media followers, likes, shares, engagement, or reach, and any other 
            business loss arising from your use of the Service. See Sections 5, 11, 12, 12A, 12B, and 21 below.
          </div>

          {/* Section 1: Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing Aura Intercept, you confirm that you can form a binding contract with us and that you agree 
              to comply with these Terms. If you are using the Service on behalf of a company or organization, you 
              represent that you have the authority to bind them to these Terms.
            </p>
          </section>

          {/* Section 2: Description of Service */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              Aura Intercept is a multi-tenant, AI-powered customer service and appointment management platform designed 
              for service-based businesses in the trades industry. The platform provides <strong className="text-foreground">24 specialized AI agents organized into 10 operatives</strong> across the platform's Consoles: Customer Portal, Field Operations, Business Management, Outreach & Sales Ops, Social Media, Web Presence, Analytics & Reports, and the AI Operatives Hub. These automate appointment scheduling, 
              customer communications, field technician dispatch, invoicing, marketing campaigns, social media content, 
              web presence management, and business analytics. Services are delivered through multiple communication channels 
              including AI voice calls, SMS, email, and an embeddable chat widget.
            </p>
            <p className="mt-4">
              The Service is hosted on Lovable Cloud infrastructure. We reserve the right to withdraw or amend 
              this Service, and any material we provide on the Service, in our sole discretion without notice.
            </p>
          </section>

          {/* Section 3: Subscription and Payment Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Subscription and Payment Terms</h2>
            
            <h3 className="text-xl font-semibold mt-4 mb-3">Billing & Subscription</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Subscription plans range from $197 to $1,997 per month across 4 tiers (Aura Core, Aura Boost, Aura Pro, and Aura Elite).</li>
              <li>Employee accounts vary by tier (10–Unlimited included). Additional employees: $25/month per 10 employees.</li>
              <li><strong className="text-foreground">One-time onboarding fee</strong> is due at the start of your 60-Day Live Trial: Aura Core $497, Aura Boost $697, Aura Pro $1,197, Aura Elite $2,197. Onboarding fees are non-refundable once onboarding is completed.</li>
              <li>Payment is processed securely through Stripe. By subscribing, you authorize recurring charges to your designated payment method.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Free Trial</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>New accounts receive a <strong className="text-foreground">60-Day Live Trial</strong> with full platform access. No credit card is required to start.</li>
              <li>Trial covers the Aura platform only. SMS, voice, email, and AI research require your own accounts at SignalWire, ElevenLabs, Resend, and Tavily — those providers will bill you directly for any usage during or after the trial.</li>
              <li>You may cancel any time during the 60-day trial at no charge.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Third-Party Provider Accounts (billed separately)</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your Aura subscription covers the <strong className="text-foreground">Aura platform only</strong>. It does not include any third-party provider usage.</li>
              <li>For compliance and account ownership, you are required to maintain your own active accounts at each provider you use — including <strong className="text-foreground">SignalWire</strong> (SMS, voice, A2P 10DLC), <strong className="text-foreground">ElevenLabs</strong> (AI voice), <strong className="text-foreground">Resend</strong> (email), <strong className="text-foreground">Tavily</strong> (AI research), <strong className="text-foreground">Stripe</strong> (payments, if applicable), and any social network APIs you publish to.</li>
              <li>You must keep a <strong className="text-foreground">valid credit card on file</strong> with each provider. Each provider will invoice you <strong className="text-foreground">directly and separately</strong> from your Aura plan fee, at the rates set by that provider.</li>
              <li>Aura Intercept does not resell, mark up, or invoice third-party usage and is not a billing intermediary for any provider. Provider pricing may change at any time at the provider's discretion.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Auto-Renewal</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Subscriptions automatically renew at the end of each billing period.</li>
              <li>You may cancel auto-renewal at any time through your account settings.</li>
              <li>Cancellation takes effect at the end of the current billing period.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Refund Policy</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Trial Period:</strong> Cancel any time during the 60-day trial at no charge — no refund is needed because no payment is taken during the trial.</li>
              <li><strong className="text-foreground">Implementation Fee:</strong> Non-refundable once onboarding has been completed.</li>
              <li><strong className="text-foreground">After Trial:</strong> No refunds for partial billing periods.</li>
              <li><strong className="text-foreground">Third-Party Provider Charges:</strong> Charges billed directly by SignalWire, ElevenLabs, Resend, Tavily, Stripe, or any other provider are governed by that provider's terms and are not refundable by Aura Intercept.</li>
            </ul>
          </section>

          {/* Section 4: Communication Consent (TCPA & Texas Law Compliance) */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Communication Consent (TCPA & Texas Law Compliance)</h2>
            <p className="mb-4">
              By using Aura Intercept, you and your customers consent to receive communications through automated means.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">Texas Telephone Solicitation Act (TTSA) & SB 140 Compliance</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Transactional messages (appointment reminders, confirmations, status updates) are exempt from TTSA registration requirements.</li>
              <li>All SMS communications through Aura Intercept are transactional/informational in nature for service delivery purposes.</li>
              <li>If you use the platform for marketing texts to non-customers in Texas, you may have additional registration obligations under Texas SB 140.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">For Business Users</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You represent that you have obtained proper consent from your customers before initiating AI voice calls or SMS messages through our platform.</li>
              <li>You agree to comply with all applicable laws including the Telephone Consumer Protection Act (TCPA), CAN-SPAM Act, Texas TTSA, and state equivalents.</li>
              <li>You are solely responsible for maintaining records of customer consent.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">For End Customers</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>By providing your phone number to a business using Aura Intercept, you consent to receive automated calls, text messages, and AI-generated communications regarding your appointments and service requests.</li>
              <li>Message and data rates may apply.</li>
              <li>You may opt out of SMS communications by replying STOP to any message.</li>
              <li>You may request to be placed on a do-not-call list by contacting the business directly.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Voice Recording Notice</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>AI voice calls may be recorded for quality assurance and record-keeping.</li>
              <li>By participating in a call, you consent to such recording.</li>
              <li>Recordings are retained for 90 days unless required longer for legal purposes.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Recordkeeping</h3>
            <p className="text-muted-foreground">
              We maintain records of SMS communications for 12 months as required by Texas law.
            </p>
          </section>

          {/* Section 5: AI-Specific Terms and Limitations */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. AI-Specific Terms and Limitations</h2>
            
            <h3 className="text-xl font-semibold mt-4 mb-3">No Performance Guarantee</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Aura Intercept LLC <strong className="text-foreground">makes no guarantee, representation, or warranty</strong> that any AI agent, automation, voice, SMS, email, chat, content generation, dispatch routing, scheduling, or analytics feature will function 100% accurately, reliably, continuously, or without error, downtime, hallucination, misclassification, mistranscription, or misrouting.</li>
              <li>We <strong className="text-foreground">do not guarantee</strong> any specific business outcome, including but not limited to bookings, appointments scheduled, revenue earned, leads captured, conversion rates, customer retention, response quality, social media engagement, or website traffic.</li>
              <li>AI is a <strong className="text-foreground">tool to assist — not replace — human judgment</strong>. You are solely responsible for reviewing, verifying, and supervising AI-generated outputs, communications, quotes, dispatch decisions, content, and posts before they are relied upon, sent to customers, or published.</li>
              <li>You acknowledge that AI technology is inherently probabilistic and may produce inaccurate, incomplete, biased, offensive, or unexpected results. You agree to maintain independent backup systems, manual review processes, and operational redundancy for any business-critical workflow.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">AI Accuracy Disclaimer</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Our AI agents are designed to assist with scheduling, customer service, content creation, dispatching, and business operations but may not always provide accurate or complete information.</li>
              <li>AI-generated responses, content, quotes, recommendations, and decisions should not be relied upon as professional, legal, medical, financial, or business advice.</li>
              <li>You are solely responsible for verifying any critical information provided by AI agents before acting on it or transmitting it to a third party.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">AI Training and Improvement</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>We may use anonymized interaction data to improve our AI models.</li>
              <li>Your specific conversations are not shared with other tenants or third parties for AI training.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Acceptable AI Use</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You agree not to use AI features to generate harmful, discriminatory, or illegal content.</li>
              <li>You will not attempt to manipulate AI agents to bypass security measures or access unauthorized data.</li>
              <li>Misuse of AI features may result in immediate account termination.</li>
            </ul>
          </section>

          {/* Section 6: Third-Party Integrations */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Third-Party Integrations</h2>
            <p className="mb-4">Aura Intercept integrates with various third-party services:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">SignalWire:</strong> Voice calling and SMS messaging</li>
              <li><strong className="text-foreground">ElevenLabs:</strong> AI voice synthesis</li>
              <li><strong className="text-foreground">Tavily:</strong> AI-powered web search for content and research operatives</li>
              <li><strong className="text-foreground">Stripe:</strong> Payment processing</li>
              <li><strong className="text-foreground">Resend:</strong> Email delivery</li>
              <li><strong className="text-foreground">Google Calendar:</strong> Calendar synchronization</li>
              <li><strong className="text-foreground">Lovable Cloud:</strong> Application hosting, database, authentication, and file storage</li>
            </ul>
            <p className="mt-4">By connecting third-party accounts:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You authorize data sharing necessary for integration functionality.</li>
              <li>You agree to comply with each third party's terms of service.</li>
              <li>We are not responsible for third-party service outages or data handling practices.</li>
              <li>You may disconnect integrations at any time through your settings.</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              You are required to maintain your own account with a valid credit card at each provider listed above. Each provider invoices you directly and separately from your Aura plan fee; see Section 3 for details.
            </p>
          </section>

          {/* Section 7: Service Level and Availability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Service Level and Availability</h2>
            
            <h3 className="text-xl font-semibold mt-4 mb-3">Availability</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>We target 99.5% uptime for core platform services.</li>
              <li>Scheduled maintenance will be announced in advance when possible.</li>
              <li>We are not liable for downtime caused by third-party service providers, internet outages, or circumstances beyond our control.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Support</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Support is available through AI Agent Chat and email.</li>
              <li>Response times may vary based on issue severity and subscription tier.</li>
            </ul>
          </section>

          {/* Section 8: User Accounts and Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. User Accounts and Security</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You may be required to create an account to access certain features.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to notify us immediately of any unauthorized access to or use of your account.</li>
              <li>Aura Intercept, its founders, and employees will not be liable for any loss or damage arising from your failure to protect your account.</li>
            </ul>
          </section>

          {/* Section 9: Intellectual Property Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property Rights</h2>
            <ul className="list-disc pl-6 space-y-4 text-muted-foreground">
              <li>
                <strong className="text-foreground">Our Property:</strong> The Service and its original content (excluding User Content), 
                features, and functionality are and will remain the exclusive property of Aura Intercept and its licensors.
              </li>
              <li>
                <strong className="text-foreground">Your License:</strong> We grant you a personal, non-exclusive, non-transferable, 
                revocable license to use the Service strictly in accordance with these Terms.
              </li>
              <li>
                <strong className="text-foreground">User Content:</strong> You retain ownership of any data or content you upload. 
                However, by posting content, you grant us a worldwide, royalty-free license to use, host, and store that content 
                solely for the purpose of providing the Service to you.
              </li>
            </ul>
          </section>

          {/* Section 10: Prohibited Conduct */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Prohibited Conduct</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law.</li>
              <li>Attempt to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service.</li>
              <li>Engage in "scraping" or "crawling" the Service for unauthorized purposes.</li>
              <li>Use the Service to generate or distribute malicious software, spam, or defamatory content.</li>
              <li>Use AI features to generate content that violates third-party rights or applicable laws.</li>
              <li>Initiate unsolicited communications or marketing campaigns without proper consent from recipients.</li>
            </ul>
          </section>

          {/* Section 11: Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Disclaimer of Warranties</h2>
            <p className="uppercase text-sm leading-relaxed">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITH ALL FAULTS. AURA INTERCEPT LLC, 
              ITS MEMBERS, MANAGERS, FOUNDERS, OFFICERS, DIRECTORS, EMPLOYEES, CONTRACTORS, AGENTS, LICENSORS, AND AFFILIATES 
              (COLLECTIVELY, THE "AURA PARTIES") EXPRESSLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, 
              STATUTORY, OR OTHERWISE, INCLUDING WITHOUT LIMITATION THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR 
              A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p className="uppercase text-sm leading-relaxed mt-4">
              WITHOUT LIMITING THE FOREGOING, THE AURA PARTIES MAKE NO WARRANTY OR REPRESENTATION THAT: (A) THE SERVICE OR 
              ANY AI FEATURE WILL BE UNINTERRUPTED, TIMELY, SECURE, ACCURATE, RELIABLE, OR ERROR-FREE; (B) AI-GENERATED 
              CONTENT, RESPONSES, RECOMMENDATIONS, QUOTES, DISPATCH ASSIGNMENTS, OR COMMUNICATIONS WILL BE ACCURATE, 
              COMPLETE, APPROPRIATE, OR FIT FOR ANY PURPOSE; (C) THE SERVICE WILL PRODUCE ANY SPECIFIC BUSINESS RESULT, 
              INCLUDING BUT NOT LIMITED TO BOOKINGS, REVENUE, LEAD CONVERSION, CUSTOMER ACQUISITION, CUSTOMER RETENTION, 
              SOCIAL MEDIA FOLLOWERS, LIKES, SHARES, COMMENTS, REACH, ENGAGEMENT, SEO RANKINGS, OR WEBSITE TRAFFIC; 
              (D) THIRD-PARTY INTEGRATIONS (INCLUDING META, GOOGLE, TIKTOK, LINKEDIN, X, STRIPE, SIGNALWIRE, 
              ELEVENLABS, RESEND, TAVILY, LOVABLE CLOUD, OR ANY OTHER PROVIDER) WILL REMAIN AVAILABLE, FUNCTIONAL, OR COMPATIBLE WITH THE SERVICE; 
              OR (E) ANY DEFECT IN THE SERVICE WILL BE CORRECTED. YOU ASSUME ALL RISK OF USE.
            </p>
          </section>

          {/* Section 12: Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
            <p className="uppercase text-sm leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL AURA INTERCEPT LLC OR ANY OF THE AURA 
              PARTIES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR 
              FOR ANY LOSS OF PROFITS, REVENUE, BUSINESS, CUSTOMERS, LEADS, OPPORTUNITIES, GOODWILL, REPUTATION, DATA, 
              USE, OR OTHER INTANGIBLE LOSSES, WHETHER BASED ON CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, 
              OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT THE AURA PARTIES HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH 
              DAMAGES, ARISING OUT OF OR RELATING TO:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4 uppercase text-sm">
              <li>Your access to, use of, or inability to use the Service;</li>
              <li>Any AI errors, hallucinations, mistranscriptions, misclassifications, misroutings, or incorrect dispatch assignments;</li>
              <li>Lost business, lost customers, lost leads, lost revenue, lost profits, lost goodwill, or lost opportunities;</li>
              <li>Lost, reduced, suspended, banned, throttled, or shadow-banned social media accounts, followers, likes, shares, comments, reach, impressions, engagement, or any other social media metric or outcome on Meta, Facebook, Instagram, TikTok, LinkedIn, X (Twitter), YouTube, Google, or any other platform;</li>
              <li>Missed, delayed, duplicated, or miscommunicated appointments, quotes, invoices, dispatch assignments, voice calls, SMS messages, emails, chats, notifications, or reminders;</li>
              <li>Failed, delayed, dropped, or misrouted SMS, voice, email, or chat communications;</li>
              <li>Third-party platform outages, algorithm changes, policy changes, API deprecations, account suspensions, or terminations (including but not limited to Meta, Google, TikTok, LinkedIn, X, YouTube, Stripe, SignalWire, ElevenLabs, Resend, Tavily, OpenAI, Google Gemini, Lovable Cloud);</li>
              <li>Unauthorized access to or alteration of your data or transmissions;</li>
              <li>Actions you, your employees, or your customers took (or failed to take) based on AI-generated content, recommendations, quotes, or communications;</li>
              <li>Any content obtained from or generated through the Service.</li>
            </ul>
            <p className="uppercase text-sm leading-relaxed mt-4 border border-border rounded-md p-4 bg-muted/30">
              NO LIABILITY / ZERO-DOLLAR CAP: TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE TOTAL AGGREGATE 
              LIABILITY OF AURA INTERCEPT LLC AND ALL AURA PARTIES TO YOU FOR ANY AND ALL CLAIMS ARISING OUT OF OR 
              RELATING TO THESE TERMS, THE SERVICE, OR YOUR USE OF OR INABILITY TO USE THE SERVICE, REGARDLESS OF THE 
              FORM OF ACTION (CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, STATUTE, OR OTHERWISE), SHALL NOT EXCEED 
              ZERO U.S. DOLLARS ($0.00). AURA INTERCEPT LLC OFFERS <strong className="text-foreground">NO MONETARY LIABILITY CAP, REFUND, 
              CREDIT, OR FINANCIAL REMEDY</strong> OF ANY KIND. YOU EXPRESSLY AGREE THAT THIS ZERO-DOLLAR LIMITATION IS A 
              REASONABLE ALLOCATION OF RISK, AN ESSENTIAL ELEMENT OF THE BARGAIN, AND A MATERIAL INDUCEMENT FOR 
              AURA INTERCEPT LLC TO PROVIDE THE SERVICE TO YOU.
            </p>
            <p className="text-sm leading-relaxed mt-4 text-muted-foreground">
              Some jurisdictions do not allow the exclusion or limitation of certain damages. To the extent such exclusions 
              or limitations are not enforceable, the Aura Parties' liability shall be limited to the maximum extent permitted by law.
            </p>
          </section>

          {/* Section 12A: No Guarantee of Results */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12A. No Guarantee of Results</h2>
            <p className="text-muted-foreground mb-4">
              Aura Intercept LLC <strong className="text-foreground">does not guarantee, promise, or warrant</strong> any specific business 
              outcome from your use of the Service. Without limitation, we make no guarantee of:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Revenue, profit, return on investment (ROI), sales, or financial performance;</li>
              <li>Volume of leads, appointments, bookings, conversions, or new customers;</li>
              <li>Customer satisfaction, retention, reviews, ratings, or referrals;</li>
              <li>Social media followers, likes, shares, comments, views, reach, impressions, engagement, or virality;</li>
              <li>Search engine optimization (SEO) rankings, website traffic, or click-through rates;</li>
              <li>Reduction in missed calls, no-shows, or operational costs.</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Your business results depend on numerous factors outside our control, including market conditions, your pricing, 
              your service quality, your industry, your geographic area, your team's execution, your customers' independent decisions, 
              third-party platform algorithms, and macroeconomic conditions. You acknowledge and agree that any examples, case 
              studies, screenshots, projections, demonstrations, or testimonials shown in marketing materials are illustrative only 
              and do not constitute a guarantee of similar results for your business.
            </p>
          </section>

          {/* Section 12B: Social Media Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12B. Social Media Disclaimer</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Aura Intercept LLC is <strong className="text-foreground">not responsible</strong> for any social media platform's algorithm changes, ranking changes, content moderation decisions, shadow-bans, throttling, account suspensions, account terminations, deleted posts, removed comments, or any loss or reduction of followers, likes, shares, engagement, or reach on Meta, Facebook, Instagram, TikTok, LinkedIn, X (Twitter), YouTube, Google, or any other third-party platform.</li>
              <li>All AI-generated social media content, captions, hashtags, images, and posts are provided as drafts. <strong className="text-foreground">You are solely responsible</strong> for reviewing, editing, approving, and verifying every piece of content before it is published, scheduled, or transmitted to a third-party platform.</li>
              <li>You are solely responsible for ensuring all published content complies with the applicable terms of service, community guidelines, and advertising policies of each third-party platform.</li>
              <li>We reserve the right (but have no obligation) to refuse, remove, or refuse to publish AI-generated content that we believe may violate any third-party platform policy, applicable law, or these Terms.</li>
              <li>You acknowledge that connecting your social accounts to our Service does not transfer ownership of those accounts or guarantee continued access to those accounts.</li>
            </ul>
          </section>

          {/* Section 13: Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Indemnification (The "Hold Harmless" Clause)</h2>
            <p className="mb-4">
              You agree to defend, indemnify, and hold harmless Aura Intercept LLC and the Aura Parties (its members, managers, 
              officers, directors, founders, employees, contractors, agents, licensors, and affiliates) from and against any 
              and all claims, demands, damages, obligations, losses, liabilities, costs, debts, fines, penalties, and expenses 
              (including reasonable attorneys' fees and court costs) resulting from or arising out of:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your access to or use of the Service;</li>
              <li>Your breach of these Terms;</li>
              <li>Any content, data, prompts, or instructions you upload, submit, or generate through the Service;</li>
              <li>Any AI-generated content that you (or your employees or agents) reviewed, approved, transmitted, or published — including social media posts, emails, SMS, voice messages, blog posts, quotes, invoices, or website copy;</li>
              <li>Claims by your customers, leads, employees, or other third parties relating to AI miscommunications, missed or duplicated appointments, incorrect quotes or invoices, incorrect dispatch, failed or delayed notifications, or any communication initiated or processed through the Service;</li>
              <li>Your violation of applicable communications laws, including the TCPA, CAN-SPAM Act, Texas TTSA, Texas SB 140, GDPR, CCPA/CPRA, and any state, federal, or international equivalent;</li>
              <li>Your violation of any third-party social media platform's terms of service, community guidelines, or advertising policies;</li>
              <li>Your violation of any third-party right, including without limitation any intellectual property, publicity, privacy, or contractual right;</li>
              <li>Any misrepresentation made by you to us or to your end customers.</li>
            </ul>
          </section>

          {/* Section 14: Data Ownership Upon Termination */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Data Ownership Upon Termination</h2>
            <p className="mb-4">Upon account termination or subscription cancellation:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Your Data:</strong> You may request a complete export of your data within 30 days of termination.</li>
              <li><strong className="text-foreground">Data Retention:</strong> We will retain your data for 30 days post-termination to allow for reactivation or data export.</li>
              <li><strong className="text-foreground">Permanent Deletion:</strong> After the 30-day period, your data will be permanently deleted from our active systems.</li>
              <li><strong className="text-foreground">Backup Retention:</strong> Anonymized data in backup systems may be retained for up to 90 days.</li>
              <li><strong className="text-foreground">Communication Records:</strong> Certain records may be retained longer if required by law or for ongoing dispute resolution.</li>
            </ul>
          </section>

          {/* Section 15: Termination */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, 
              under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          {/* Section 16: Governing Law (Texas - Nueces/Travis County) */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Texas, United States, 
              without regard to its conflict of law provisions. Any legal action or proceeding arising out of or relating to 
              these Terms shall be brought exclusively in the state or federal courts located in Nueces County or Travis County, 
              Texas, and you consent to the personal jurisdiction of such courts.
            </p>
          </section>

          {/* Section 17: Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">17. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice 
              of any changes by posting the new Terms on this page and updating the "Effective Date." For material changes, we will 
              provide at least 30 days' notice via email or prominent notice on our platform. Your continued use of the Service 
              after any changes constitute your acceptance of the new Terms.
            </p>
          </section>

          {/* Section 18: Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">18. Contact Us</h2>
            <p>
              For any questions about these Terms, please contact us via our AI Agent Chat.
            </p>
          </section>

          {/* Section 21: Assumption of Risk & Acknowledgment */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">21. Assumption of Risk & Acknowledgment</h2>
            <p className="mb-4 text-muted-foreground">
              By using the Service, you expressly acknowledge, represent, and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>AI technology is inherently <strong className="text-foreground">probabilistic, non-deterministic, and imperfect</strong>, and may produce errors, inaccuracies, hallucinations, biased outputs, or unexpected behavior at any time;</li>
              <li>You have independently evaluated the Service and have determined, in your own business judgment, that it is suitable for your needs, and you have not relied on any representation, warranty, projection, or guarantee not expressly contained in these Terms;</li>
              <li>You assume <strong className="text-foreground">all risk and responsibility</strong> for outcomes resulting from your use of the Service, including any AI-generated communications, dispatch decisions, quotes, invoices, content, or social media posts that reach your customers, employees, or the public;</li>
              <li>You will maintain <strong className="text-foreground">independent backup systems, manual review processes, and operational redundancy</strong> for any business-critical workflow (including but not limited to appointment scheduling, dispatching, billing, and customer communications);</li>
              <li>You are responsible for training your employees on the proper use, supervision, and limitations of AI features;</li>
              <li>You will not represent to any third party that AI-generated outputs are guaranteed accurate or endorsed by Aura Intercept LLC.</li>
            </ul>
          </section>

          {/* Section 22: Force Majeure */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">22. Force Majeure</h2>
            <p className="text-muted-foreground">
              Aura Intercept LLC and the Aura Parties shall not be liable for any failure or delay in performance, or for any 
              loss or damage, arising out of or resulting from causes beyond our reasonable control, including without limitation: 
              acts of God; natural disasters; fire; flood; war; terrorism; civil unrest; pandemic or epidemic; government actions, 
              orders, or regulations; labor disputes; cyberattacks; denial-of-service attacks; internet, telecommunications, or 
              power outages; failures, outages, deprecations, or policy changes by hosting providers, AI providers, telephony 
              providers, payment processors, email providers, or social media platforms (including without limitation Lovable Cloud, 
              OpenAI, Google, ElevenLabs, SignalWire, Stripe, Resend, Tavily, Meta, TikTok, LinkedIn, X, or YouTube); 
              or any other event beyond our reasonable control.
            </p>
          </section>

          {/* Section 23: Severability & Survival */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">23. Severability & Survival</h2>
            <p className="text-muted-foreground mb-4">
              If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, 
              such provision shall be modified to the minimum extent necessary to make it enforceable, or if no such modification 
              is possible, severed from these Terms; the remaining provisions shall continue in full force and effect.
            </p>
            <p className="text-muted-foreground">
              All provisions of these Terms which by their nature should survive termination shall survive, including without 
              limitation the disclaimers of warranties (Section 11), limitations of liability (Sections 12, 12A, 12B), 
              indemnification (Section 13), data ownership (Section 14), governing law (Section 16), assumption of risk 
              (Section 21), and severability (Section 23).
            </p>
          </section>

          {/* Section 20: ElevenLabs AI Agent Disclosure */}
          <section className="border-t border-border pt-8 mt-12">
            <h2 className="text-2xl font-semibold mb-4">20. ElevenLabs AI Agent Disclosure</h2>
            <p className="mb-4">
              Aura Intercept uses ElevenLabs Agents to power our AI customer service assistants, including "Talk to Aura" 
              (text-based chat) and "Proxy Voice Chat" (AI voice calling features). Your use of these features is subject 
              to the following disclosures:
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">Notice of AI Interaction</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">AI-Powered Agents:</strong> You are interacting with AI-powered agents, not human representatives. Our AI assistants are designed to provide helpful information and support, but they are artificial intelligence systems.</li>
              <li><strong className="text-foreground">Recording and Storage:</strong> Your conversations with our AI agents may be recorded, stored, and shared with ElevenLabs and its third-party large language model (LLM) providers.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Consent and Data Usage</h3>
            <p className="mb-4 text-muted-foreground">
              By clicking "Agree" or otherwise interacting with our AI agents (Talk to Aura or Proxy Voice Chat), you consent to the following:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Recording, viewing, storing, and sharing of your communications by Aura Intercept, ElevenLabs, and their respective service providers (including third-party LLM providers)</li>
              <li>Use of your interaction data to provide the requested service</li>
              <li>Use of anonymized data to improve products and services</li>
              <li>Use of data to train machine learning models</li>
              <li>Retention and processing as required to comply with applicable law</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Verbal Disclosure (Voice Calls)</h3>
            <p className="text-muted-foreground mb-4">
              When you interact with our AI voice calling feature (Proxy Voice Chat), you will hear a disclosure similar to: 
              "Hi, I'm an AI assistant. This call may be recorded and shared with service providers for quality assurance 
              and service improvement purposes."
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">Third-Party Terms</h3>
            <p className="text-muted-foreground">
              Your use of ElevenLabs-powered features is also subject to the{' '}
              <a 
                href="https://elevenlabs.io/agents-terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ElevenLabs Agents Platform Terms
              </a>.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">Legal Disclaimer</h3>
            <p className="text-muted-foreground text-sm">
              The information provided in this section is for general informational purposes only. Aura Intercept is 
              responsible for ensuring compliance with the ElevenLabs Agents Platform Terms and all applicable laws 
              and regulations. This guidance does not constitute legal advice.
            </p>
          </section>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}
