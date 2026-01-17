// Tooltips for professional terms used in onboarding
// Ensures non-technical administrators can navigate the platform easily

export const onboardingTooltips: Record<string, string> = {
  // AI & Agents
  'AI Agent': 'An automated assistant that handles customer calls, chats, and messages on your behalf',
  'Triage Agent': 'The main agent that greets customers and routes them to the right service',
  'Booking Agent': 'Handles appointment scheduling and calendar management automatically',
  'Voice Agent': 'Answers phone calls and can speak with customers using AI voice technology',
  'Agent Activation': 'Turning on your AI assistants so they can start helping customers',
  
  // Knowledge Base
  'Knowledge Base': 'The information your AI uses to answer questions about your business',
  'FAQ': 'Frequently Asked Questions - common questions and answers about your services',
  'Services Catalog': 'A list of all services you offer with descriptions and pricing',
  'Business Hours': 'The times when your business is open and available',
  
  // Business Profile
  'Business Profile': 'Your company information including name, contact details, and branding',
  'Brand Colors': 'The colors that represent your company, used in your AI chat widget',
  'Primary Color': 'Your main brand color, used for buttons and highlights',
  'Secondary Color': 'A complementary color used for accents and gradients',
  
  // Features
  'Smart Website': 'A professional one-page website created automatically for your business',
  'Customer Portal': 'A place where your customers can book appointments and view their history',
  'Widget': 'A chat button that can be added to your existing website',
  'Integration': 'A connection to external services like phone, email, or calendar providers',
  
  // Technical (simplified)
  'Dashboard': 'Your control center for managing all aspects of your AI assistant',
  'Analytics': 'Reports and statistics about how your AI is helping customers',
  'Complexity Score': 'A measure of remaining setup tasks - lower is better!',
  'Quick Start': 'A guided setup wizard to get your AI running in minutes',
};

// Helper function to get tooltip or return undefined if not found
export function getTooltip(term: string): string | undefined {
  return onboardingTooltips[term];
}

// Check if a term has a tooltip
export function hasTooltip(term: string): boolean {
  return term in onboardingTooltips;
}
