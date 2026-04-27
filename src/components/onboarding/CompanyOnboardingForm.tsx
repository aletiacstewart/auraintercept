import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Building2, User, Clock, Settings, MessageSquare, Calendar, Star, Globe, BarChart3, Users, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { QUESTIONS, SECTION_ORDER, AuditQuestion } from '@/components/audit/types';
import { toast } from 'sonner';

// Section labels for display
const SECTION_LABELS: Record<string, string> = {
  basics: 'Business Basics',
  industry: 'Industry & Services',
  leads: 'Lead Intake & Response',
  communication: 'Communication Preferences',
  scheduling: 'Scheduling & Operations',
  retention: 'Customer Retention & Reviews',
  social: 'Social Media & Web Presence',
  operations: 'Business Operations',
  analytics: 'Analytics & Growth',
};

// Section icons
const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  basics: Building2,
  industry: Settings,
  leads: MessageSquare,
  communication: MessageSquare,
  scheduling: Calendar,
  retention: Star,
  social: Globe,
  operations: Settings,
  analytics: BarChart3,
};

interface FormData {
  // Company Profile
  companyName: string;
  dba: string;
  websiteUrl: string;
  industryType: string;
  yearsInBusiness: string;
  
  // Primary Contact
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  
  // Business Address
  streetAddress: string;
  cityStateZip: string;
  
  // Branding
  primaryColor: string;
  secondaryColor: string;
  
  // Business Operations
  totalEmployees: string;
  fieldTechnicians: string;
  officeStaff: string;
  numLocations: string;
  annualRevenue: string;
  avgTicketValue: string;
  
  // Business Hours
  businessHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  
  // Emergency Contact
  emergencyContact: string;
  emergencyPhone: string;
  
  // Service Areas
  serviceCities: string;
  serviceZipCodes: string;
  serviceCategories: string;
  
  // Audit Answers
  auditAnswers: Record<string, string>;
  
  // Integration Checklist
  integrations: {
    twilio: string;
    elevenlabs: string;
    resend: string;
    stripe: string;
    googleCalendar: string;
    socialMedia: string;
  };
  
  // Knowledge Base
  services: { name: string; description: string; duration: string; price: string }[];
  faqs: { question: string; answer: string }[];
  commonQuestions: string;
  differentiators: string;
  
  // Employee Info
  employees: { name: string; email: string; phone: string; role: string; jobType: string; auraSmsOptIn: boolean }[];
  
  // Goals
  painPoints: string;
  successGoals: string;
  excitedFeatures: string;
  additionalNotes: string;
  
  // Signature
  signatureName: string;
  signatureDate: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const initialFormData: FormData = {
  companyName: '',
  dba: '',
  websiteUrl: '',
  industryType: '',
  yearsInBusiness: '',
  contactName: '',
  contactTitle: '',
  contactEmail: '',
  contactPhone: '',
  streetAddress: '',
  cityStateZip: '',
  primaryColor: '',
  secondaryColor: '',
  totalEmployees: '',
  fieldTechnicians: '',
  officeStaff: '',
  numLocations: '',
  annualRevenue: '',
  avgTicketValue: '',
  businessHours: DAYS_OF_WEEK.reduce((acc, day) => ({
    ...acc,
    [day]: { open: '09:00', close: '17:00', closed: day === 'Saturday' || day === 'Sunday' }
  }), {}),
  emergencyContact: '',
  emergencyPhone: '',
  serviceCities: '',
  serviceZipCodes: '',
  serviceCategories: '',
  auditAnswers: {},
  integrations: {
    twilio: '',
    elevenlabs: '',
    resend: '',
    stripe: '',
    googleCalendar: '',
    socialMedia: '',
  },
  services: Array(5).fill({ name: '', description: '', duration: '', price: '' }),
  faqs: Array(5).fill({ question: '', answer: '' }),
  commonQuestions: '',
  differentiators: '',
  employees: Array(5).fill(null).map(() => ({ name: '', email: '', phone: '', role: '', jobType: '', auraSmsOptIn: false })),
  painPoints: '',
  successGoals: '',
  excitedFeatures: '',
  additionalNotes: '',
  signatureName: '',
  signatureDate: new Date().toISOString().split('T')[0],
};

// Form sections for pagination
const FORM_SECTIONS = [
  'company-profile',
  'business-operations',
  'audit-questions',
  'integrations',
  'knowledge-base',
  'employees',
  'goals-signature',
];

export function CompanyOnboardingForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentSection + 1) / FORM_SECTIONS.length) * 100;

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAuditAnswer = (questionId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      auditAnswers: { ...prev.auditAnswers, [questionId]: value }
    }));
  };

  const updateBusinessHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: { ...prev.businessHours[day], [field]: value }
      }
    }));
  };

  const updateService = (index: number, field: keyof FormData['services'][0], value: string) => {
    const newServices = [...formData.services];
    newServices[index] = { ...newServices[index], [field]: value };
    updateField('services', newServices);
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    updateField('faqs', newFaqs);
  };

  const updateEmployee = (index: number, field: keyof FormData['employees'][0], value: string) => {
    const newEmployees = [...formData.employees];
    newEmployees[index] = { ...newEmployees[index], [field]: value };
    updateField('employees', newEmployees);
  };

  const updateIntegration = (key: keyof FormData['integrations'], value: string) => {
    setFormData(prev => ({
      ...prev,
      integrations: { ...prev.integrations, [key]: value }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Create a mailto link with form data summary
      const subject = encodeURIComponent(`Company Onboarding - ${formData.companyName}`);
      const body = encodeURIComponent(generateEmailBody());
      window.location.href = `mailto:onboarding@auraintercept.com?subject=${subject}&body=${body}`;
      toast.success('Opening your email client to send the form...');
    } catch (error) {
      toast.error('Failed to process form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateEmailBody = () => {
    let body = '=== COMPANY ONBOARDING QUESTIONNAIRE ===\n\n';
    
    body += '--- COMPANY PROFILE ---\n';
    body += `Company Name: ${formData.companyName}\n`;
    body += `DBA: ${formData.dba}\n`;
    body += `Website: ${formData.websiteUrl}\n`;
    body += `Industry: ${formData.industryType}\n`;
    body += `Years in Business: ${formData.yearsInBusiness}\n\n`;
    
    body += '--- PRIMARY CONTACT ---\n';
    body += `Name: ${formData.contactName}\n`;
    body += `Title: ${formData.contactTitle}\n`;
    body += `Email: ${formData.contactEmail}\n`;
    body += `Phone: ${formData.contactPhone}\n\n`;
    
    body += '--- BUSINESS ADDRESS ---\n';
    body += `${formData.streetAddress}\n`;
    body += `${formData.cityStateZip}\n\n`;
    
    body += '--- BRANDING ---\n';
    body += `Primary Color: ${formData.primaryColor}\n`;
    body += `Secondary Color: ${formData.secondaryColor}\n\n`;
    
    body += '--- BUSINESS OPERATIONS ---\n';
    body += `Total Employees: ${formData.totalEmployees}\n`;
    body += `Field Technicians: ${formData.fieldTechnicians}\n`;
    body += `Office Staff: ${formData.officeStaff}\n`;
    body += `Locations: ${formData.numLocations}\n`;
    body += `Annual Revenue: ${formData.annualRevenue}\n`;
    body += `Avg Ticket Value: ${formData.avgTicketValue}\n\n`;
    
    body += '--- BUSINESS HOURS ---\n';
    DAYS_OF_WEEK.forEach(day => {
      const hours = formData.businessHours[day];
      body += `${day}: ${hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}\n`;
    });
    body += '\n';
    
    body += '--- SERVICE AREAS ---\n';
    body += `Cities: ${formData.serviceCities}\n`;
    body += `ZIP Codes: ${formData.serviceZipCodes}\n`;
    body += `Categories: ${formData.serviceCategories}\n\n`;
    
    body += '--- AI OPPORTUNITY AUDIT ANSWERS ---\n';
    QUESTIONS.forEach(q => {
      const answer = formData.auditAnswers[q.id];
      if (answer) {
        const option = q.options.find(o => o.label === answer);
        body += `Q: ${q.question}\n`;
        body += `A: ${option?.label || answer}\n\n`;
      }
    });
    
    body += '--- INTEGRATION STATUS ---\n';
    Object.entries(formData.integrations).forEach(([key, value]) => {
      body += `${key}: ${value || 'Not specified'}\n`;
    });
    body += '\n';
    
    body += '--- SERVICES ---\n';
    formData.services.filter(s => s.name).forEach((s, i) => {
      body += `${i + 1}. ${s.name} - ${s.description} (${s.duration}, ${s.price})\n`;
    });
    body += '\n';
    
    body += '--- FAQS ---\n';
    formData.faqs.filter(f => f.question).forEach((f, i) => {
      body += `${i + 1}. Q: ${f.question}\n   A: ${f.answer}\n`;
    });
    body += '\n';
    
    body += '--- EMPLOYEES ---\n';
    formData.employees.filter(e => e.name).forEach((e, i) => {
      body += `${i + 1}. ${e.name} | ${e.email} | ${e.phone} | ${e.role} | ${e.jobType}\n`;
    });
    body += '\n';
    
    body += '--- GOALS & NOTES ---\n';
    body += `Pain Points: ${formData.painPoints}\n`;
    body += `Success Goals: ${formData.successGoals}\n`;
    body += `Excited Features: ${formData.excitedFeatures}\n`;
    body += `Additional Notes: ${formData.additionalNotes}\n\n`;
    
    body += '--- SIGNATURE ---\n';
    body += `Name: ${formData.signatureName}\n`;
    body += `Date: ${formData.signatureDate}\n`;
    
    return body;
  };

  const renderCompanyProfile = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company Profile
          </CardTitle>
          <CardDescription>Basic company information for dashboard setup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="Acme Services Inc."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dba">DBA (if different)</Label>
              <Input
                id="dba"
                value={formData.dba}
                onChange={(e) => updateField('dba', e.target.value)}
                placeholder="Acme Pro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                value={formData.websiteUrl}
                onChange={(e) => updateField('websiteUrl', e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industryType">Industry/Business Type *</Label>
              <Input
                id="industryType"
                value={formData.industryType}
                onChange={(e) => updateField('industryType', e.target.value)}
                placeholder="HVAC, Plumbing, Salon, etc."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsInBusiness">Years in Business</Label>
              <Input
                id="yearsInBusiness"
                value={formData.yearsInBusiness}
                onChange={(e) => updateField('yearsInBusiness', e.target.value)}
                placeholder="5"
                type="number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Primary Contact (Admin Account)
          </CardTitle>
          <CardDescription>This person will have admin access to the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Full Name *</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => updateField('contactName', e.target.value)}
                placeholder="John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactTitle">Job Title</Label>
              <Input
                id="contactTitle"
                value={formData.contactTitle}
                onChange={(e) => updateField('contactTitle', e.target.value)}
                placeholder="Owner, Manager, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email Address *</Label>
              <Input
                id="contactEmail"
                value={formData.contactEmail}
                onChange={(e) => updateField('contactEmail', e.target.value)}
                placeholder="john@company.com"
                type="email"
                required
              />
              <p className="text-xs text-muted-foreground">This will be the login email</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone Number *</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => updateField('contactPhone', e.target.value)}
                placeholder="(555) 123-4567"
                type="tel"
                required
              />
              <p className="text-xs text-muted-foreground">For SMS notifications and 2FA</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input
              id="streetAddress"
              value={formData.streetAddress}
              onChange={(e) => updateField('streetAddress', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cityStateZip">City, State, ZIP</Label>
            <Input
              id="cityStateZip"
              value={formData.cityStateZip}
              onChange={(e) => updateField('cityStateZip', e.target.value)}
              placeholder="Los Angeles, CA 90001"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Colors for dashboard customization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  value={formData.primaryColor}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  placeholder="#6366f1 or Blue"
                />
                <input
                  type="color"
                  value={formData.primaryColor.startsWith('#') ? formData.primaryColor : '#6366f1'}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={(e) => updateField('secondaryColor', e.target.value)}
                  placeholder="#8b5cf6 or Purple"
                />
                <input
                  type="color"
                  value={formData.secondaryColor.startsWith('#') ? formData.secondaryColor : '#8b5cf6'}
                  onChange={(e) => updateField('secondaryColor', e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBusinessOperations = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Size & Structure
          </CardTitle>
          <CardDescription>Helps configure subscription tier and employee limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalEmployees">Total Employee Count *</Label>
              <Input
                id="totalEmployees"
                value={formData.totalEmployees}
                onChange={(e) => updateField('totalEmployees', e.target.value)}
                placeholder="10"
                type="number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldTechnicians">Field Technicians/Staff</Label>
              <Input
                id="fieldTechnicians"
                value={formData.fieldTechnicians}
                onChange={(e) => updateField('fieldTechnicians', e.target.value)}
                placeholder="6"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officeStaff">Office/Admin Staff</Label>
              <Input
                id="officeStaff"
                value={formData.officeStaff}
                onChange={(e) => updateField('officeStaff', e.target.value)}
                placeholder="4"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numLocations">Number of Locations</Label>
              <Input
                id="numLocations"
                value={formData.numLocations}
                onChange={(e) => updateField('numLocations', e.target.value)}
                placeholder="1"
                type="number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
          <CardDescription>For tier recommendations and ROI estimates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annualRevenue">Approximate Annual Revenue</Label>
              <Select value={formData.annualRevenue} onValueChange={(v) => updateField('annualRevenue', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-100k">Under $100K</SelectItem>
                  <SelectItem value="100k-250k">$100K - $250K</SelectItem>
                  <SelectItem value="250k-500k">$250K - $500K</SelectItem>
                  <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                  <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                  <SelectItem value="over-5m">Over $5M</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avgTicketValue">Average Service Ticket Value</Label>
              <Input
                id="avgTicketValue"
                value={formData.avgTicketValue}
                onChange={(e) => updateField('avgTicketValue', e.target.value)}
                placeholder="$250"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="flex items-center gap-4 py-2 border-b last:border-0">
                <div className="w-24 font-medium">{day}</div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.businessHours[day]?.closed}
                    onCheckedChange={(checked) => updateBusinessHours(day, 'closed', !!checked)}
                  />
                  <Label className="text-sm text-muted-foreground">Closed</Label>
                </div>
                {!formData.businessHours[day]?.closed && (
                  <>
                    <Input
                      type="time"
                      value={formData.businessHours[day]?.open || '09:00'}
                      onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={formData.businessHours[day]?.close || '17:00'}
                      onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                      className="w-32"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency / After-Hours Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => updateField('emergencyContact', e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Phone</Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => updateField('emergencyPhone', e.target.value)}
                placeholder="(555) 987-6543"
                type="tel"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceCities">Cities Served</Label>
            <Textarea
              id="serviceCities"
              value={formData.serviceCities}
              onChange={(e) => updateField('serviceCities', e.target.value)}
              placeholder="Los Angeles, Santa Monica, Beverly Hills..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceZipCodes">ZIP Codes Covered</Label>
            <Textarea
              id="serviceZipCodes"
              value={formData.serviceZipCodes}
              onChange={(e) => updateField('serviceZipCodes', e.target.value)}
              placeholder="90001, 90002, 90003..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceCategories">Service Categories</Label>
            <Textarea
              id="serviceCategories"
              value={formData.serviceCategories}
              onChange={(e) => updateField('serviceCategories', e.target.value)}
              placeholder="HVAC Repair, Installation, Maintenance..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAuditQuestions = () => {
    const questionsBySection: Record<string, AuditQuestion[]> = {};
    SECTION_ORDER.forEach(section => {
      questionsBySection[section] = QUESTIONS.filter(q => q.section === section);
    });

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              AI Opportunity Audit
            </CardTitle>
            <CardDescription>
              Answer these 30 questions to help us recommend the best tier and configure your AI operatives
            </CardDescription>
          </CardHeader>
        </Card>

        {SECTION_ORDER.map((section) => {
          const questions = questionsBySection[section];
          if (!questions?.length) return null;
          
          const Icon = SECTION_ICONS[section] || Settings;
          
          return (
            <Card key={section}>
              <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-primary" />
                  {SECTION_LABELS[section] || section}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {questions.map((question, qIndex) => (
                  <div key={question.id} className="space-y-3 pb-4 border-b last:border-0">
                    <Label className="text-sm font-semibold">
                      {qIndex + 1}. {question.question}
                    </Label>
                    {question.description && (
                      <p className="text-sm text-muted-foreground italic">{question.description}</p>
                    )}
                    <RadioGroup
                      value={formData.auditAnswers[question.id] || ''}
                      onValueChange={(value) => updateAuditAnswer(question.id, value)}
                      className="space-y-2"
                    >
                      {question.options.map((option) => (
                        <div key={option.label} className="flex items-start space-x-3">
                          <RadioGroupItem value={option.label} id={`${question.id}-${option.label}`} />
                          <Label 
                            htmlFor={`${question.id}-${option.label}`} 
                            className="font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderIntegrations = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Integration Requirements
          </CardTitle>
          <CardDescription>
            Pre-onboarding checklist for third-party accounts. Let us know if you need help setting these up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { key: 'twilio', name: 'Twilio', purpose: 'Voice calls & SMS messaging' },
            { key: 'elevenlabs', name: 'ElevenLabs', purpose: 'AI voice synthesis' },
            { key: 'resend', name: 'Resend', purpose: 'Email delivery' },
            { key: 'stripe', name: 'Stripe', purpose: 'Payment processing' },
            { key: 'googleCalendar', name: 'Google Calendar', purpose: 'Calendar sync' },
            { key: 'socialMedia', name: 'Social Media Accounts', purpose: 'Social posting & engagement' },
          ].map((integration) => (
            <div key={integration.key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <div className="font-medium">{integration.name}</div>
                <div className="text-sm text-muted-foreground">{integration.purpose}</div>
              </div>
              <RadioGroup
                value={formData.integrations[integration.key as keyof FormData['integrations']]}
                onValueChange={(v) => updateIntegration(integration.key as keyof FormData['integrations'], v)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id={`${integration.key}-yes`} />
                  <Label htmlFor={`${integration.key}-yes`} className="text-sm">Have Account</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`${integration.key}-no`} />
                  <Label htmlFor={`${integration.key}-no`} className="text-sm">Don't Have</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="help" id={`${integration.key}-help`} />
                  <Label htmlFor={`${integration.key}-help`} className="text-sm">Need Help</Label>
                </div>
              </RadioGroup>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderKnowledgeBase = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Services Offered</CardTitle>
          <CardDescription>List your main services for the AI knowledge base</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.services.map((service, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 pb-3 border-b last:border-0">
                <Input
                  placeholder="Service Name"
                  value={service.name}
                  onChange={(e) => updateService(index, 'name', e.target.value)}
                />
                <Input
                  placeholder="Description"
                  value={service.description}
                  onChange={(e) => updateService(index, 'description', e.target.value)}
                />
                <Input
                  placeholder="Duration (e.g., 1 hour)"
                  value={service.duration}
                  onChange={(e) => updateService(index, 'duration', e.target.value)}
                />
                <Input
                  placeholder="Price (e.g., $150)"
                  value={service.price}
                  onChange={(e) => updateService(index, 'price', e.target.value)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Common questions the AI should be able to answer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.faqs.map((faq, index) => (
              <div key={index} className="space-y-2 pb-4 border-b last:border-0">
                <Input
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => updateFaq(index, 'question', e.target.value)}
                />
                <Textarea
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                  rows={2}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Knowledge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commonQuestions">Other Common Customer Questions</Label>
            <Textarea
              id="commonQuestions"
              value={formData.commonQuestions}
              onChange={(e) => updateField('commonQuestions', e.target.value)}
              placeholder="What other questions do customers frequently ask?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="differentiators">What Makes You Different?</Label>
            <Textarea
              id="differentiators"
              value={formData.differentiators}
              onChange={(e) => updateField('differentiators', e.target.value)}
              placeholder="What sets your business apart from competitors?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Employee Information
          </CardTitle>
          <CardDescription>
            Initial employee accounts to set up in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 pb-2 border-b font-medium text-sm text-muted-foreground">
              <div>Name</div>
              <div>Email</div>
              <div>Phone</div>
              <div>Role</div>
              <div>Job Type</div>
            </div>
            {formData.employees.map((employee, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input
                  placeholder="Full Name"
                  value={employee.name}
                  onChange={(e) => updateEmployee(index, 'name', e.target.value)}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={employee.email}
                  onChange={(e) => updateEmployee(index, 'email', e.target.value)}
                />
                <Input
                  placeholder="Phone"
                  type="tel"
                  value={employee.phone}
                  onChange={(e) => updateEmployee(index, 'phone', e.target.value)}
                />
                <Select value={employee.role} onValueChange={(v) => updateEmployee(index, 'role', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={employee.jobType} onValueChange={(v) => updateEmployee(index, 'jobType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="dispatcher">Dispatcher</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGoalsSignature = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Goals & Expectations</CardTitle>
          <CardDescription>Help us understand what success looks like for you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="painPoints">What are your top 3 pain points?</Label>
            <Textarea
              id="painPoints"
              value={formData.painPoints}
              onChange={(e) => updateField('painPoints', e.target.value)}
              placeholder="1. Missing too many calls after hours&#10;2. Spending too much time on scheduling&#10;3. No-shows and cancellations"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="successGoals">What would success look like in 90 days?</Label>
            <Textarea
              id="successGoals"
              value={formData.successGoals}
              onChange={(e) => updateField('successGoals', e.target.value)}
              placeholder="Capture all incoming leads, reduce admin time by 50%, improve customer satisfaction..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excitedFeatures">Which features are you most excited about?</Label>
            <Textarea
              id="excitedFeatures"
              value={formData.excitedFeatures}
              onChange={(e) => updateField('excitedFeatures', e.target.value)}
              placeholder="AI receptionist, automated reminders, dispatch optimization..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Any additional notes or questions?</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => updateField('additionalNotes', e.target.value)}
              placeholder="Anything else we should know..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Signature</CardTitle>
          <CardDescription>By signing below, you confirm the information is accurate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signatureName">Full Name *</Label>
              <Input
                id="signatureName"
                value={formData.signatureName}
                onChange={(e) => updateField('signatureName', e.target.value)}
                placeholder="John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signatureDate">Date *</Label>
              <Input
                id="signatureDate"
                type="date"
                value={formData.signatureDate}
                onChange={(e) => updateField('signatureDate', e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentSection = () => {
    switch (FORM_SECTIONS[currentSection]) {
      case 'company-profile':
        return renderCompanyProfile();
      case 'business-operations':
        return renderBusinessOperations();
      case 'audit-questions':
        return renderAuditQuestions();
      case 'integrations':
        return renderIntegrations();
      case 'knowledge-base':
        return renderKnowledgeBase();
      case 'employees':
        return renderEmployees();
      case 'goals-signature':
        return renderGoalsSignature();
      default:
        return null;
    }
  };

  const sectionLabels = [
    'Company Profile',
    'Business Operations',
    'AI Audit Questions',
    'Integrations',
    'Knowledge Base',
    'Employees',
    'Goals & Submit',
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Company Onboarding Questionnaire</h1>
        <p className="text-muted-foreground">
          Complete this form to help us configure your Aura Intercept platform
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentSection + 1} of {FORM_SECTIONS.length}</span>
          <span>{sectionLabels[currentSection]}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Section */}
      {renderCurrentSection()}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        {currentSection < FORM_SECTIONS.length - 1 ? (
          <Button
            onClick={() => setCurrentSection(Math.min(FORM_SECTIONS.length - 1, currentSection + 1))}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Processing...' : 'Submit via Email'}
          </Button>
        )}
      </div>
    </div>
  );
}
