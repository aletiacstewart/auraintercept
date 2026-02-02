import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      
      <main className="container max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">Terms of Service for Aura Intercept</h1>
        
        <p className="text-muted-foreground mb-8">Effective Date: January 11, 2026</p>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <p>
            Welcome to Aura Intercept. These Terms of Service ("Terms") govern your access to and use of the 
            Aura Intercept website, services, and applications (the "Service"). By accessing or using the Service, 
            you agree to be bound by these Terms.
          </p>

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
              for service-based businesses in the trades industry. The platform provides 24 specialized AI operatives across 
              seven Control Centers (Consoles): Customer Portal, Field Operations, Business Management, Outreach & Sales Ops, 
              Social Media & Web Presence, Analytics & Reports, and AI Operatives Hub. These automate appointment scheduling, 
              customer communications, field technician dispatch, invoicing, marketing campaigns, social media content, 
              web presence management, and business analytics. Services are delivered through multiple communication channels 
              including AI voice calls, SMS, email, and an embeddable chat widget.
            </p>
            <p className="mt-4">
              The Service is currently hosted via the Lovable.dev platform. We reserve the right to withdraw or amend 
              this Service, and any material we provide on the Service, in our sole discretion without notice.
            </p>
          </section>

          {/* Section 3: Subscription and Payment Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Subscription and Payment Terms</h2>
            
            <h3 className="text-xl font-semibold mt-4 mb-3">Billing & Subscription</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>The Enterprise subscription plan is billed at $250 per month.</li>
              <li>Subscriptions include 10 employee accounts. Additional employees are $10/month each.</li>
              <li>New accounts receive a 30-day free trial with full platform access.</li>
              <li>Payment is processed securely through Stripe. By subscribing, you authorize recurring charges to your designated payment method.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Usage-Based Charges</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>SMS messages and voice minutes may incur additional charges based on usage.</li>
              <li>Usage fees are billed monthly in arrears and added to your subscription invoice.</li>
              <li>Current usage rates are available on our pricing page.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Auto-Renewal</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Subscriptions automatically renew at the end of each billing period.</li>
              <li>You may cancel auto-renewal at any time through your account settings.</li>
              <li>Cancellation takes effect at the end of the current billing period.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">Refund Policy</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Trial Period:</strong> Full refund if cancelled within 30 days.</li>
              <li><strong className="text-foreground">After Trial:</strong> No refunds for partial billing periods.</li>
              <li><strong className="text-foreground">Usage Charges:</strong> Usage charges are non-refundable.</li>
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
            
            <h3 className="text-xl font-semibold mt-4 mb-3">AI Accuracy Disclaimer</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Our AI agents are designed to assist with scheduling, customer service, and business operations but may not always provide accurate or complete information.</li>
              <li>AI-generated responses should not be relied upon as professional, legal, medical, or financial advice.</li>
              <li>You are responsible for verifying any critical information provided by AI agents.</li>
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
              <li><strong className="text-foreground">Twilio:</strong> Voice calling and SMS messaging</li>
              <li><strong className="text-foreground">ElevenLabs:</strong> AI voice synthesis</li>
              <li><strong className="text-foreground">Stripe:</strong> Payment processing</li>
              <li><strong className="text-foreground">Resend:</strong> Email delivery</li>
              <li><strong className="text-foreground">Google Calendar:</strong> Calendar synchronization</li>
            </ul>
            <p className="mt-4">By connecting third-party accounts:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You authorize data sharing necessary for integration functionality.</li>
              <li>You agree to comply with each third party's terms of service.</li>
              <li>We are not responsible for third-party service outages or data handling practices.</li>
              <li>You may disconnect integrations at any time through your settings.</li>
            </ul>
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
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. AURA INTERCEPT, ITS FOUNDERS, EMPLOYEES, 
              AND AFFILIATES EXPRESSLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT 
              LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. 
              WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE. AI-GENERATED CONTENT 
              IS PROVIDED WITHOUT WARRANTY OF ACCURACY OR COMPLETENESS.
            </p>
          </section>

          {/* Section 12: Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
            <p className="uppercase text-sm leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL AURA INTERCEPT, ITS FOUNDERS, EMPLOYEES, OR AGENTS 
              BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, 
              LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (I) YOUR USE OR INABILITY TO 
              USE THE SERVICE; (II) ANY UNAUTHORIZED ACCESS TO OUR SERVERS; (III) ANY CONTENT OBTAINED FROM THE SERVICE; 
              (IV) ERRORS, INACCURACIES, OR OMISSIONS IN AI-GENERATED CONTENT; OR (V) ACTIONS TAKEN BASED ON AI RECOMMENDATIONS.
            </p>
          </section>

          {/* Section 13: Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Indemnification (The "Hold Harmless" Clause)</h2>
            <p className="mb-4">
              You agree to defend, indemnify, and hold harmless Aura Intercept, its founders, officers, directors, employees, 
              and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and 
              expenses (including but not limited to attorney's fees) resulting from or arising out of:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your use and access of the Service.</li>
              <li>A breach of these Terms.</li>
              <li>Any content uploaded by you to the Service.</li>
              <li>Your violation of applicable communications laws (including TCPA and Texas TTSA).</li>
              <li>Claims from third parties arising from communications you initiated through the platform.</li>
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

          {/* Section 19: Platform Terms of Service */}
          <section className="border-t border-border pt-8 mt-12">
            <h2 className="text-2xl font-semibold mb-4">19. Platform Terms of Service</h2>
            <p>
              This application is built on Lovable. For information about Lovable's terms, please review the{' '}
              <a 
                href="https://lovable.dev/tos" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Lovable Terms of Service
              </a>.
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
