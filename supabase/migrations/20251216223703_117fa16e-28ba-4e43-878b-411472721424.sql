-- Add review request settings to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS review_request_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS review_request_delay_hours integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS review_google_url text,
ADD COLUMN IF NOT EXISTS review_yelp_url text,
ADD COLUMN IF NOT EXISTS review_facebook_url text,
ADD COLUMN IF NOT EXISTS review_sms_template text DEFAULT 'Hi {customer_name}! Thank you for choosing {company_name}. We hope {technician_name} provided excellent {service_type} service. Would you take a moment to leave us a 5-star review? It helps our small business grow! ⭐⭐⭐⭐⭐',
ADD COLUMN IF NOT EXISTS review_email_subject text DEFAULT 'How was your experience? - {company_name}',
ADD COLUMN IF NOT EXISTS review_email_template text DEFAULT 'Hi {customer_name},

We hope {technician_name} provided you with excellent {service_type} service today!

Your feedback means the world to us. If you were happy with our service, we''d really appreciate it if you could take a moment to leave us a review.

⭐⭐⭐⭐⭐

Your 5-star review helps our small business grow and allows us to continue providing great service to customers like you.

Thank you again for your business!

Best regards,
The {company_name} Team';