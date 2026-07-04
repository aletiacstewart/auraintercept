import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      
      <main className="container max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy for Aura Intercept</h1>
        
        <p className="text-muted-foreground mb-8">Effective Date: April 28, 2026</p>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <p>
            At Aura Intercept ("we," "our," or "us"), we are committed to protecting the privacy of our users. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
            visit our website (the "Site") and use our services.
          </p>
          
          <p>
            By using Aura Intercept, you agree to the terms of this Privacy Policy. If you do not agree, please do not access the Site.
          </p>

          {/* Section 1: Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Personal Data:</strong> Voluntarily provided personally identifiable information, such as your name, email address, and contact details when you register or interact with the Site.</li>
              <li><strong className="text-foreground">Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, browser type, operating system, access times, and the pages you viewed.</li>
              <li><strong className="text-foreground">AI Interactions:</strong> If the project involves AI processing, we may collect the prompts or data you input to provide the service.</li>
              <li><strong className="text-foreground">Voice & Call Recording Data:</strong> When you use our AI voice calling features, we may record and transcribe voice calls for quality assurance, training purposes, and to provide accurate service records. Recordings may be stored for up to 90 days unless required longer for legal or dispute resolution purposes.</li>
              <li><strong className="text-foreground">SMS & Communication Data:</strong> We collect SMS message content, phone numbers, timestamps, and delivery status when you interact with our platform via text messaging. This data is used to provide customer service and maintain communication records.</li>
              <li><strong className="text-foreground">Location Data:</strong> For field operations and technician dispatch services, we may collect approximate location data to optimize scheduling and provide accurate arrival estimates. This includes service addresses and GPS coordinates during active job assignments.</li>
              <li><strong className="text-foreground">Payment Information:</strong> When you subscribe to our services, payment processing is handled by Stripe. We do not store complete credit card numbers. We may retain billing addresses, transaction history, and subscription status.</li>
              <li><strong className="text-foreground">AI Web Search Queries:</strong> When operatives use AI web search (powered by Tavily), we log the query text and timestamps to monitor monthly usage allowances and improve relevance.</li>
            </ul>
          </section>

          {/* Section 2: Cookies and Tracking Technologies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Cookies and Tracking Technologies</h2>
            <p className="mb-4">We use cookies and similar tracking technologies to enhance your experience:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Essential Cookies:</strong> Required for basic platform functionality, authentication, and security.</li>
              <li><strong className="text-foreground">Analytics Cookies:</strong> Help us understand how users interact with our platform to improve services.</li>
              <li><strong className="text-foreground">Preference Cookies:</strong> Remember your settings and preferences across sessions.</li>
            </ul>
            <p className="mt-4">
              You can control cookie preferences through your browser settings. Disabling certain cookies may limit platform functionality.
            </p>
          </section>

          {/* Section 3: Use of Your Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Use of Your Information</h2>
            <p className="mb-4">We use the information collected to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Operate, maintain, and improve the Aura Intercept platform.</li>
              <li>Respond to customer service requests and provide support.</li>
              <li>Send appointment reminders, confirmations, and service updates via email, SMS, and voice calls.</li>
              <li>Process payments and manage subscriptions.</li>
              <li>Optimize field technician dispatch and scheduling.</li>
              <li>Protect against fraudulent or illegal activity.</li>
              <li>Comply with legal obligations and protect our legal rights.</li>
            </ul>
          </section>

          {/* Section 4: Disclosure of Your Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Disclosure of Your Information</h2>
            <p className="mb-4">We may share information we have collected about you in certain situations:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
              <li><strong className="text-foreground">Third-Party Service Providers:</strong> We may share your data with third-party service providers (such as SignalWire for voice/SMS, ElevenLabs for AI voice synthesis, Tavily for AI web search, Stripe for payment processing, Resend for email delivery, Google for calendar integration, and our cloud infrastructure provider for application hosting, database, and authentication) that perform services for us or on our behalf.</li>
              <li><strong className="text-foreground">Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
            </ul>
          </section>

          {/* Section 5: Data Retention Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention Policy</h2>
            <p className="mb-4">We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Account Data:</strong> Retained for the duration of your account plus 30 days after deletion request.</li>
              <li><strong className="text-foreground">Communication Records:</strong> SMS and email logs retained for 2 years for service continuity and dispute resolution.</li>
              <li><strong className="text-foreground">Voice Recordings:</strong> Retained for 90 days unless required for ongoing support or legal matters.</li>
              <li><strong className="text-foreground">Transaction Data:</strong> Retained for 7 years to comply with financial reporting requirements.</li>
              <li><strong className="text-foreground">AI Interaction Logs:</strong> Retained for 1 year to improve service quality and train AI models.</li>
              <li><strong className="text-foreground">Search Query Logs:</strong> Retained for 90 days for usage allowance accounting and relevance tuning.</li>
            </ul>
            <p className="mt-4">
              Upon account termination, you may request data export before deletion. Anonymized, aggregated data may be retained indefinitely for analytics purposes.
            </p>
          </section>

          {/* Section 6: Multi-Tenant Data Architecture */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Multi-Tenant Data Architecture</h2>
            <p className="mb-4">
              Aura Intercept operates as a multi-tenant platform serving multiple business customers. Your data is logically separated and isolated from other tenants:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Each business customer's data is segregated using secure tenant identifiers.</li>
              <li>Company administrators can only access data within their organization.</li>
              <li>End customers interacting with multiple businesses on our platform will have separate profiles for each business relationship.</li>
              <li>We implement Row-Level Security (RLS) to ensure strict data isolation between tenants.</li>
            </ul>
          </section>

          {/* Section 7: Limitation of Liability & Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability & Indemnification</h2>
            <p className="mb-4">
              To the maximum extent permitted by applicable law, in no event shall Aura Intercept, its founders, employees, agents, 
              or affiliates be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages arising 
              out of or relating to the use of, or inability to use, this service.
            </p>
            <p>
              You agree to defend, indemnify, and hold harmless Aura Intercept and its representatives from and against any and all 
              claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees) 
              arising from your use of the Site or your violation of any term of this Privacy Policy.
            </p>
          </section>

          {/* Section 8: Security of Your Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. 
              While we have taken reasonable steps to secure the personal information you provide to us, please be aware that 
              despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be 
              guaranteed against any interception or other type of misuse.
            </p>
          </section>

          {/* Section 9: Your Privacy Rights (TEXAS TDPSA, CCPA, GDPR) */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Your Privacy Rights</h2>
            <p className="mb-4">Depending on your location, you may have the following rights:</p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">For Texas Residents (Texas Data Privacy and Security Act - TDPSA)</h3>
            <p className="mb-4">Effective July 1, 2024, Texas residents have the following rights under the TDPSA:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Right to Confirm:</strong> You have the right to confirm whether we are processing your personal data.</li>
              <li><strong className="text-foreground">Right to Access:</strong> You have the right to access your personal data.</li>
              <li><strong className="text-foreground">Right to Correct:</strong> You have the right to correct inaccuracies in your personal data.</li>
              <li><strong className="text-foreground">Right to Delete:</strong> You have the right to delete your personal data.</li>
              <li><strong className="text-foreground">Right to Data Portability:</strong> You have the right to obtain a portable copy of your personal data in a readily usable format.</li>
              <li><strong className="text-foreground">Right to Opt Out of Targeted Advertising:</strong> You may opt out of the processing of personal data for purposes of targeted advertising.</li>
              <li><strong className="text-foreground">Right to Opt Out of Sale:</strong> You may opt out of the sale of personal data. <em>Note: We do not sell personal data.</em></li>
              <li><strong className="text-foreground">Right to Opt Out of Profiling:</strong> You may opt out of profiling that produces legal or similarly significant effects.</li>
            </ul>
            
            <h4 className="text-lg font-semibold mt-4 mb-2">How to Exercise Your TDPSA Rights</h4>
            <p className="text-muted-foreground mb-4">
              Contact us via our AI Agent Chat or email. We will respond within 45 days as required by the TDPSA. 
              We may request verification of your identity before processing your request.
            </p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Universal Opt-Out Signals</h4>
            <p className="text-muted-foreground mb-4">
              We honor Global Privacy Control (GPC) and similar universal opt-out preference signals. 
              When detected, these signals are processed immediately without additional action required from you.
            </p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Sensitive Personal Data</h4>
            <p className="text-muted-foreground mb-4">
              Under the TDPSA, certain data categories require explicit consent before processing. This includes: 
              precise geolocation data, health information, biometric data, racial/ethnic origin, religious beliefs, 
              sexual orientation, citizenship status, and data from known children. We obtain explicit consent before 
              collecting or processing any sensitive personal data.
            </p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Enforcement Notice</h4>
            <p className="text-muted-foreground mb-4">
              The TDPSA is enforced exclusively by the Texas Attorney General. There is no private right of action. 
              Penalties for violations may reach $7,500 per violation.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">For California Residents (CCPA)</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Right to know what personal information is collected, used, and shared.</li>
              <li>Right to delete personal information held by us.</li>
              <li>Right to opt-out of the sale of personal information. <em>Note: We do not sell personal information.</em></li>
              <li>Right to non-discrimination for exercising your privacy rights.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">For EU/UK Residents (GDPR)</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Right of access to your personal data.</li>
              <li>Right to rectification of inaccurate data.</li>
              <li>Right to erasure ("right to be forgotten").</li>
              <li>Right to restrict processing.</li>
              <li>Right to data portability.</li>
              <li>Right to object to processing.</li>
              <li>Right to withdraw consent at any time.</li>
            </ul>

            <p className="mt-4">
              To exercise any of these rights, contact us via our AI Agent Chat or email. We will respond within 
              45 days (TDPSA), 30 days (CCPA), or 30 days (GDPR).
            </p>
          </section>

          {/* Section 10: Third-Party Websites */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Third-Party Websites</h2>
            <p>
              The Site may contain links to third-party websites and applications of interest, including the Lovable Cloud platform. 
              This Privacy Policy does not apply to third-party websites. We are not responsible for the content or privacy and 
              security practices of any third parties.
            </p>
          </section>

          {/* Section 11: Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
            <p>
              We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any 
              data we have collected from children under age 13, please contact us using the contact information provided below.
            </p>
          </section>

          {/* Section 12: Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
            <p>
              We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about 
              any changes by updating the "Effective Date" of this Privacy Policy. Material changes will be communicated through 
              email notification or prominent notice on our platform.
            </p>
          </section>

          {/* Section 13: Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us via our AI Agent Chat.
            </p>
          </section>

          {/* Section 14: Platform Privacy Policy */}
          <section className="border-t border-border pt-8 mt-12">
            <h2 className="text-2xl font-semibold mb-4">14. Platform Privacy Policy</h2>
            <p>
              Aura Intercept operates on a managed cloud backend. Infrastructure
              providers process data strictly as sub-processors under our
              instructions, and never use Customer Data for their own purposes.
              For questions about sub-processors or to request our current
              vendor list, contact{' '}
              <a
                href="mailto:privacy@auraintercept.ai"
                className="text-primary hover:underline"
              >
                privacy@auraintercept.ai
              </a>.
            </p>
          </section>

          {/* Section 15: ElevenLabs AI Agent Disclosure */}
          <section className="border-t border-border pt-8 mt-12">
            <h2 className="text-2xl font-semibold mb-4">15. ElevenLabs AI Agent Disclosure</h2>
            <p className="mb-4">
              Aura Intercept uses ElevenLabs Agents to power our AI customer service assistants. This section describes 
              how data is collected, processed, and shared when you interact with these AI features.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">Data Collected</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Text Conversations:</strong> When you use "Message Aura (Text)" (text-based chat), we collect the text content of your messages, timestamps, and session identifiers.</li>
              <li><strong className="text-foreground">Voice Conversations:</strong> When you use "Talk to Aura (Voice)" (AI voice calling), we collect voice audio recordings, transcriptions, call duration, and call metadata.</li>
              <li><strong className="text-foreground">Interaction Metadata:</strong> Device information, IP address, and interaction patterns may be collected to improve service quality.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Third-Party Data Sharing</h3>
            <p className="mb-4 text-muted-foreground">
              Your AI agent interactions are shared with the following third parties:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">ElevenLabs Inc.:</strong> Provides the AI voice synthesis and conversational AI platform that powers our AI agents.</li>
              <li><strong className="text-foreground">Third-Party LLM Providers:</strong> ElevenLabs may share data with large language model providers (such as OpenAI, Anthropic, or similar) to process and respond to your queries.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Purpose of Data Processing</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Providing AI customer service and support</li>
              <li>Improving the quality and accuracy of AI responses</li>
              <li>Training and improving machine learning models</li>
              <li>Ensuring compliance with applicable laws and platform terms</li>
              <li>Detecting and preventing misuse or abuse of the service</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">User Consent</h3>
            <p className="text-muted-foreground mb-4">
              By interacting with our AI agents, you acknowledge that you are communicating with artificial intelligence 
              (not human representatives) and you consent to the recording, storage, and sharing of your communications 
              as described in this section.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">Data Retention</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Text Chat Logs:</strong> Retained for 1 year for service improvement and support purposes.</li>
              <li><strong className="text-foreground">Voice Recordings:</strong> Retained for 90 days unless required longer for legal purposes.</li>
              <li><strong className="text-foreground">Third-Party Retention:</strong> ElevenLabs and their service providers may retain data according to their own privacy policies.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Third-Party Privacy Policies</h3>
            <p className="text-muted-foreground">
              For information about how ElevenLabs handles your data, please review the{' '}
              <a 
                href="https://elevenlabs.io/agents-terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ElevenLabs Agents Platform Terms
              </a>{' '}
              and{' '}
              <a 
                href="https://elevenlabs.io/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ElevenLabs Privacy Policy
              </a>.
            </p>
          </section>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}
