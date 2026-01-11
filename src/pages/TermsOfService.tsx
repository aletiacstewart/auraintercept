import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      
      <main className="container max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">Terms of Service for Aura Intercept</h1>
        
        <p className="text-muted-foreground mb-8">Effective Date: January 2026</p>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <p>
            Welcome to Aura Intercept. These Terms of Service ("Terms") govern your access to and use of the 
            Aura Intercept website, services, and applications (the "Service"). By accessing or using the Service, 
            you agree to be bound by these Terms.
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing Aura Intercept, you confirm that you can form a binding contract with us and that you agree 
              to comply with these Terms. If you are using the Service on behalf of a company or organization, you 
              represent that you have the authority to bind them to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              Aura Intercept is a multi-tenant, AI-powered customer service and appointment management platform designed 
              for service-based businesses in the trades industry. The platform provides 14 specialized AI agents across 
              three operational consoles (Business Management, Customer Portal, and Field Operations) that automate 
              appointment scheduling, customer communications, field technician dispatch, invoicing, and business analytics. 
              Services are delivered through multiple communication channels including AI voice calls, SMS, email, and an 
              embeddable chat widget.
            </p>
            <p className="mt-4">
              The Service is currently hosted via the Lovable.dev platform. We reserve the right to withdraw or amend 
              this Service, and any material we provide on the Service, in our sole discretion without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Security</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You may be required to create an account to access certain features.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to notify us immediately of any unauthorized access to or use of your account.</li>
              <li>Aura Intercept, its founders, and employees will not be liable for any loss or damage arising from your failure to protect your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property Rights</h2>
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

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Prohibited Conduct</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law.</li>
              <li>Attempt to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service.</li>
              <li>Engage in "scraping" or "crawling" the Service for unauthorized purposes.</li>
              <li>Use the Service to generate or distribute malicious software, spam, or defamatory content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Disclaimer of Warranties</h2>
            <p className="uppercase text-sm leading-relaxed">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. AURA INTERCEPT, ITS FOUNDERS, EMPLOYEES, 
              AND AFFILIATES EXPRESSLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT 
              LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. 
              WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="uppercase text-sm leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL AURA INTERCEPT, ITS FOUNDERS, EMPLOYEES, OR AGENTS 
              BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, 
              LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (I) YOUR USE OR INABILITY TO 
              USE THE SERVICE; (II) ANY UNAUTHORIZED ACCESS TO OUR SERVERS; OR (III) ANY CONTENT OBTAINED FROM THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Indemnification (The "Hold Harmless" Clause)</h2>
            <p className="mb-4">
              You agree to defend, indemnify, and hold harmless Aura Intercept, its founders, officers, directors, employees, 
              and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and 
              expenses (including but not limited to attorney's fees) resulting from or arising out of:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your use and access of the Service.</li>
              <li>A breach of these Terms.</li>
              <li>Any content uploaded by you to the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, 
              under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the United States, without regard to 
              its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice 
              of any changes by posting the new Terms on this page. Your continued use of the Service after any changes constitute 
              your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p>
              For any questions about these Terms, please contact us via our AI Agent Chat.
            </p>
          </section>

          <section className="border-t border-border pt-8 mt-12">
            <h2 className="text-2xl font-semibold mb-4">Platform Terms of Service</h2>
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
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}