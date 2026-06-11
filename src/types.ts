export type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'Sales Executive' | 'Telecaller' | 'Viewer';

export type LeadStatus =
  | 'Fresh'
  | 'Assigned'
  | 'Contacted'
  | 'Interested'
  | 'Follow-up'
  | 'Site Visit Scheduled'
  | 'Site Visit Done'
  | 'Negotiation'
  | 'Booking Done'
  | 'Deal Closed'
  | 'Not Interested'
  | 'Wrong Number'
  | 'CNR / Not Reachable'
  | 'Busy'
  | 'Low Budget'
  | 'Duplicate'
  | 'Lost';

export type LeadPriority = 'Hot' | 'Warm' | 'Cold';

export type LeadSource =
  | 'Meta Ads'
  | 'Google Ads'
  | 'Website'
  | 'WhatsApp'
  | 'Walk-in'
  | 'Referral'
  | 'Magicbricks'
  | '99acres'
  | 'Housing'
  | 'Manual'
  | 'Other';

export type PropertyType = 'Flat' | 'Villa' | 'Plot' | 'Office' | 'Shop' | 'Warehouse' | 'Land';

export type BHKOption = '1BHK' | '2BHK' | '3BHK' | '4BHK' | '5BHK+';

export type PurposeOption = 'Investment' | 'Own Use' | 'Rental Income';

export type TaskType = 'Call' | 'WhatsApp' | 'Site Visit' | 'Meeting' | 'Payment' | 'Document' | 'Other';

export type TaskStatus = 'Pending' | 'Completed' | 'Overdue' | 'Rescheduled' | 'Cancelled';

export type SiteVisitStatus = 'Scheduled' | 'Done' | 'Cancelled' | 'Rescheduled' | 'No Show';

export type DealStage = 'Booking' | 'Agreement' | 'Payment Pending' | 'Commission Pending' | 'Closed' | 'Cancelled';

export interface Lead {
  id: string; // Document ID (e.g. L001, or auto-generated but pref. sequential or string)
  name: string;
  mobile: string;
  alternateNumber?: string;
  email?: string;
  city: string;
  locality?: string;
  propertyRequirement?: string;
  buyRentResale: 'Buy' | 'Rent' | 'Resale';
  budgetMin: number;
  budgetMax: number;
  propertyType: PropertyType;
  bhk?: BHKOption;
  purpose?: PurposeOption;
  source: LeadSource;
  projectInterested?: string;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo: string; // User ID or Name
  assignedToName?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  lastContactedAt?: string;
  nextFollowUpDate?: string;
  notes?: string;
  tags?: string[];
  callOutcome?: string;
  lostReason?: string;
  siteVisitStatus?: SiteVisitStatus;
  dealStatus?: DealStage;
}

export interface Task {
  id: string;
  leadId: string;
  clientName: string;
  mobile: string;
  type: TaskType;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
  assignedToName?: string;
  status: TaskStatus;
  notes: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  builderName: string;
  location: string;
  city: string;
  area?: string;
  propertyType: PropertyType[];
  bhkOptions: BHKOption[];
  priceMin: number;
  priceMax: number;
  possessionStatus: 'Ready to Move' | 'Under Construction' | 'Newly Launched' | 'On Hold';
  reraNumber?: string;
  amenities?: string[];
  brochureUrl?: string;
  photosUrls?: string[];
  googleMapLink?: string;
  commissionStructure?: string;
  availableInventory?: string; // Number or text explanation
  status: 'Active' | 'Sold Out' | 'Hold' | 'Upcoming';
  createdAt: string;
  updatedAt: string;
}

export interface SiteVisit {
  id: string;
  leadId: string;
  clientName: string;
  mobile: string;
  projectName: string;
  visitDate: string; // YYYY-MM-DD
  visitTime: string; // HH:MM
  salesPerson: string; // User ID / Name
  status: SiteVisitStatus;
  clientFeedback?: string;
  nextAction?: string;
  pickupRequired: 'Yes' | 'No';
  meetingLocation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  leadId: string;
  clientName: string;
  projectName: string;
  unitDetails: string;
  dealValue: number;
  bookingAmount: number;
  commissionPercent: number; // e.g. 2 for 2%
  expectedCommission: number;
  receivedCommission: number;
  pendingCommission: number;
  stage: DealStage;
  closingDate: string; // YYYY-MM-DD
  salesPerson: string;
  salesPersonName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string; // Document ID (usually same mobile or unique key)
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  requirement?: string;
  projectsInterested?: string[];
  dealsCount: number;
  totalDealValue: number;
  documents?: { name: string; url: string; uploadedAt: string }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Communication {
  id: string;
  leadId: string;
  clientName: string;
  mobile: string;
  type: 'WhatsApp' | 'Call' | 'Email';
  templateName?: string;
  message: string;
  sentBy: string;
  sentByName?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  leadId: string;
  clientName?: string;
  type: string; // 'Lead Created', 'Status Updated', 'Note Added', 'Follow-up Scheduled', 'Site Visit Done', 'Converted to Deal', etc.
  description: string;
  performedBy: string;
  performedByName?: string;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'New Lead Created' | 'Lead Status Changed' | 'Follow-up Due' | 'Site Visit Scheduled' | 'Deal Closed';
  conditionField?: string;
  conditionValue?: string;
  action: 'Assign User' | 'Create Task' | 'Send WhatsApp Message' | 'Send Notification' | 'Update Status';
  actionValue?: string; // target user id, template id, task notes, or new status
  isActive: boolean;
  createdAt: string;
}

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  isActive: boolean;
  dailyTarget?: number;
  createdAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

export interface CRMSettings {
  companyName: string;
  companyPhone?: string;
  companyAddress?: string;
  logoUrl?: string;
  leadStatuses: string[];
  leadSources: string[];
  propertyTypes: string[];
  lostReasons: string[];
  taskTypes: string[];
  whatsappTemplates: WhatsAppTemplate[];
}
