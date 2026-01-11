import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      
      <main className="container max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy for Aura Intercept</h1>
        
        <p className="text-muted-foreground mb-8">Effective Date: January 10, 2026</p>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <p>
            At Aura Intercept ("we," "our," or "us"), we are committed to protecting the privacy of our users. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
            visit our website (the "Site") and use our services.
          </p>
          
          <p>
            By using Aura Intercept, you agree to the terms of this Privacy Policy. If you do not agree, please do not access the Site.
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Personal Data:</strong> Voluntarily provided personally identifiable information, such as your name, email address, and contact details when you register or interact with the Site.</li>
              <li><strong className="text-foreground">Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, browser type, operating system, access times, and the pages you viewed.</li>
              <li><strong className="text-foreground">AI Interactions:</strong> If the project involves AI processing, we may collect the prompts or data you input to provide the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use of Your Information</h2>
            <p className="mb-4">We use the information collected to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Operate, maintain, and improve the Aura Intercept platform.</li>
              <li>Respond to customer service requests and provide support.</li>
              <li>Protect against fraudulent or illegal activity.</li>
              <li>Comply with legal obligations and protect our legal rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Disclosure of Your Information</h2>
            <p className="mb-4">We may share information we have collected about you in certain situations:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
              <li><strong className="text-foreground">Third-Party Service Providers:</strong> We may share your data with third-party service providers (such as Lovable, Supabase, or Stripe) that perform services for us or on our behalf.</li>
              <li><strong className="text-foreground">Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Limitation of Liability & Indemnification</h2>
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

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. 
              While we have taken reasonable steps to secure the personal information you provide to us, please be aware that 
              despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be 
              guaranteed against any interception or other type of misuse.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Third-Party Websites</h2>
            <p>
              The Site may contain links to third-party websites and applications of interest, including the Lovable platform. 
              This Privacy Policy does not apply to third-party websites. We are not responsible for the content or privacy and 
              security practices of any third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
            <p>
              We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any 
              data we have collected from children under age 13, please contact us using the contact information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
            <p>
              We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about 
              any changes by updating the "Effective Date" of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us via our AI Agent Chat.
            </p>
          </section>

          <section className="border-t border-border pt-8 mt-12">
            <h2 className="text-2xl font-semibold mb-4">Platform Privacy Policy</h2>
            <p>
              This application is built on Lovable. For information about how Lovable handles your data, please review the{' '}
              <a 
                href="https://lovable.dev/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Lovable Privacy Policy
              </a>.
            </p>
          </section>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}
