/**
 * Helper functions to format form data into natural language for AI agents.
 * This ensures AI receives well-structured requests instead of raw JSON.
 */

export interface FeedbackData {
  rating: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  note?: string;
  customerName: string;
  customerPhone?: string;
  serviceDate?: Date;
}

export interface ReviewData {
  rating: number;
  comment?: string;
  customerName: string;
  customerPhone?: string;
  selectedPlatforms: string[];
}

export interface QuoteRequestData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  selectedServices: string[];
  serviceNames: string[];
  issueDescription?: string;
}

export interface BookingRequestData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  selectedServices: string[];
  serviceNames: string[];
  date: Date;
  time: string;
}

export interface TrackingRequestData {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface BillingLookupData {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  invoiceNumber?: string;
}

export interface CampaignData {
  name: string;
  campaignType: string;
  targetSegment?: string;
  channels: string[];
  promoCode?: string;
  discountType?: string;
  discountValue?: number;
  startDate?: string;
  endDate?: string;
  emailSubject?: string;
  messageTemplate?: string;
}

/**
 * Format feedback data into a natural language message
 */
export function formatFeedbackMessage(data: FeedbackData): string {
  const parts = [
    `I'd like to leave feedback.`,
    `My name is ${data.customerName}`,
  ];
  
  if (data.customerPhone) {
    parts.push(`and my phone number is ${data.customerPhone}`);
  }
  
  if (data.serviceDate) {
    parts.push(`for my appointment on ${data.serviceDate.toLocaleDateString()}`);
  }
  
  parts.push(`. My rating is ${data.rating} stars and my experience was ${data.sentiment}.`);
  
  if (data.note) {
    parts.push(` Additional comments: ${data.note}`);
  }
  
  return parts.join('');
}

/**
 * Format review data into a natural language message
 */
export function formatReviewMessage(data: ReviewData): string {
  const platformsText = data.selectedPlatforms.join(' and ');
  const parts = [
    `I've submitted a review.`,
    `My name is ${data.customerName}`,
  ];
  
  if (data.customerPhone) {
    parts.push(` and my phone number is ${data.customerPhone}`);
  }
  
  parts.push(`. I gave ${data.rating} stars and left a review on ${platformsText}.`);
  
  if (data.comment) {
    parts.push(` My comment: ${data.comment}`);
  }
  
  return parts.join('');
}

/**
 * Format quote request data into a natural language message
 */
export function formatQuoteMessage(data: QuoteRequestData): string {
  const servicesText = data.serviceNames.join(', ') || 'your services';
  const parts = [
    `I'd like to request a quote.`,
    ` My name is ${data.customerName}`,
    `, my phone number is ${data.customerPhone}`,
  ];
  
  if (data.customerEmail) {
    parts.push(`, email: ${data.customerEmail}`);
  }
  
  if (data.customerAddress) {
    parts.push(`, address: ${data.customerAddress}`);
  }
  
  parts.push(`. I'm interested in: ${servicesText}.`);
  
  if (data.issueDescription) {
    parts.push(` Issue description: ${data.issueDescription}`);
  }
  
  return parts.join('');
}

/**
 * Format booking request data into a natural language message
 */
export function formatBookingMessage(data: BookingRequestData): string {
  const servicesText = data.serviceNames.join(', ') || 'service';
  const formattedDate = data.date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const [hours, minutes] = data.time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const formattedTime = `${displayHour}:${minutes} ${period}`;
  
  return `I'd like to book an appointment. My name is ${data.customerName}, my phone number is ${data.customerPhone}, and I need service at ${data.customerAddress}. I'm interested in: ${servicesText}. I'd like to schedule for ${formattedDate} at ${formattedTime}.`;
}

/**
 * Format tracking request data into a natural language message
 */
export function formatTrackingMessage(data: TrackingRequestData): string {
  const parts = [
    `I'd like to track my appointment.`,
    ` My name is ${data.customerName}`,
  ];
  
  if (data.customerPhone) {
    parts.push(`, phone: ${data.customerPhone}`);
  }
  
  if (data.customerEmail) {
    parts.push(`, email: ${data.customerEmail}`);
  }
  
  parts.push('.');
  
  return parts.join('');
}

/**
 * Format billing lookup data into a natural language message
 */
export function formatBillingLookupMessage(data: BillingLookupData): string {
  const parts = [`I need to look up my billing information.`];
  
  if (data.invoiceNumber) {
    parts.push(` Invoice number: ${data.invoiceNumber}.`);
  }
  
  if (data.customerName) {
    parts.push(` My name is ${data.customerName}.`);
  }
  
  if (data.customerEmail) {
    parts.push(` My email is ${data.customerEmail}.`);
  }
  
  if (data.customerPhone) {
    parts.push(` My phone number is ${data.customerPhone}.`);
  }
  
  return parts.join('');
}

/**
 * Format campaign data into a natural language message for AI analysis
 */
export function formatCampaignMessage(data: CampaignData): string {
  const parts = [
    `I'm creating a ${data.campaignType} campaign called "${data.name}".`,
  ];
  
  if (data.targetSegment) {
    parts.push(` Target audience: ${data.targetSegment}.`);
  }
  
  if (data.channels.length > 0) {
    parts.push(` Channels: ${data.channels.join(', ')}.`);
  }
  
  if (data.promoCode) {
    parts.push(` Promo code: ${data.promoCode}.`);
  }
  
  if (data.discountType && data.discountValue) {
    parts.push(` Discount: ${data.discountValue}${data.discountType === 'percentage' ? '%' : ' dollars'} off.`);
  }
  
  if (data.startDate) {
    parts.push(` Start date: ${data.startDate}.`);
  }
  
  if (data.endDate) {
    parts.push(` End date: ${data.endDate}.`);
  }
  
  if (data.emailSubject) {
    parts.push(` Email subject: "${data.emailSubject}".`);
  }
  
  if (data.messageTemplate) {
    parts.push(` Message template: "${data.messageTemplate}".`);
  }
  
  return parts.join('');
}

/**
 * Format a generic form object into a readable message
 */
export function formatGenericFormMessage(formType: string, data: Record<string, unknown>): string {
  const cleanEntries = Object.entries(data)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      // Convert camelCase to readable format
      const readableKey = key.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      
      // Format arrays
      if (Array.isArray(value)) {
        return `${readableKey}: ${value.join(', ')}`;
      }
      
      // Format dates
      if (value instanceof Date) {
        return `${readableKey}: ${value.toLocaleDateString()}`;
      }
      
      return `${readableKey}: ${value}`;
    });
  
  return `I'm submitting a ${formType} form with the following information: ${cleanEntries.join(', ')}.`;
}
