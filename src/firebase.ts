import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import {
  Lead,
  Task,
  Project,
  SiteVisit,
  Deal,
  Client,
  Activity,
  AutomationRule,
  CRMUser,
  CRMSettings,
  WhatsAppTemplate,
  TaskStatus,
  SiteVisitStatus,
  DealStage
} from './types';

// Check if we are running with dummy credentials
export const isDummyConfig =
  !firebaseConfig ||
  firebaseConfig.apiKey === 'dummy-api-key' ||
  firebaseConfig.projectId === 'dummy-project';

let app;
let auth: any = null;
let db: any = null;

if (!isDummyConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || 'default');
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization failed, falling back to local simulation:', error);
  }
}

export { auth, db };

// Firestore Error Logging / Catching as mandated by the skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Ensure connection validation is performable if firebase is enabled
async function testConnection() {
  if (db && !isDummyConfig) {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration or internet connection.');
      }
    }
  }
}
testConnection();

// ==========================================
// LOCAL STORAGE BACKEND SIMULATOR (MOCK ENGINE)
// ==========================================
// Prepares highly realistic real estate data for a premium Dream Investment experience

const MOCK_USERS: CRMUser[] = [
  { id: 'u1', name: 'Alok Sharma', email: 'alok.sharma@dreaminvestment.com', role: 'Super Admin', isActive: true, createdAt: '2026-01-10T10:00:00Z' },
  { id: 'u2', name: 'Rajesh Patel', email: 'rajesh.patel@dreaminvestment.com', role: 'Admin', isActive: true, createdAt: '2026-01-15T12:00:00Z' },
  { id: 'u3', name: 'Priya Nair', email: 'priya.nair@dreaminvestment.com', role: 'Manager', isActive: true, createdAt: '2026-02-01T09:30:00Z' },
  { id: 'u4', name: 'Siddharth Mehta', email: 'siddharth@dreaminvestment.com', role: 'Sales Executive', isActive: true, createdAt: '2026-02-15T14:00:00Z' },
  { id: 'u5', name: 'Neha Rao', email: 'neha.rao@dreaminvestment.com', role: 'Telecaller', isActive: true, createdAt: '2026-03-01T11:00:00Z' },
  { id: 'u6', name: 'Sconsett Media', email: 'sconsett.media@gmail.com', role: 'Super Admin', isActive: true, createdAt: '2026-03-10T10:00:00Z' }
];

const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Godrej Horizon',
    builderName: 'Godrej Properties',
    location: 'Wadala',
    city: 'Mumbai',
    area: 'South Mumbai',
    propertyType: ['Flat'],
    bhkOptions: ['2BHK', '3BHK'],
    priceMin: 22000000,
    priceMax: 38000000,
    possessionStatus: 'Under Construction',
    reraNumber: 'P51900034821',
    amenities: ['Swimmimg Pool', 'Gym', 'Sky Lounge', 'Kids Play Area', 'Clubhouse'],
    googleMapLink: 'https://maps.google.com/?q=Godrej+Horizon+Wadala',
    commissionStructure: '2.5% on agreement value',
    availableInventory: '14 Units remaining',
    status: 'Active',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'p2',
    name: 'Lodha Crown',
    builderName: 'Lodha Group',
    location: 'Thane West',
    city: 'Mumbai',
    area: 'Thane',
    propertyType: ['Flat', 'Shop'],
    bhkOptions: ['1BHK', '2BHK'],
    priceMin: 5500000,
    priceMax: 9500000,
    possessionStatus: 'Ready to Move',
    reraNumber: 'P5170022354',
    amenities: ['Security', 'Garden', 'Power Backup', 'Retail Shops'],
    googleMapLink: 'https://maps.google.com/?q=Lodha+Crown+Thane',
    commissionStructure: '3% standard commission',
    availableInventory: '45 Units remaining',
    status: 'Active',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  },
  {
    id: 'p3',
    name: 'Prestige Lakeside Habitat',
    builderName: 'Prestige Group',
    location: 'Whitefield',
    city: 'Bangalore',
    area: 'East Bangalore',
    propertyType: ['Flat', 'Villa'],
    bhkOptions: ['2BHK', '3BHK', '4BHK'],
    priceMin: 9500000,
    priceMax: 29000000,
    possessionStatus: 'Ready to Move',
    reraNumber: 'PRM/KA/RERA/1251/446',
    amenities: ['Golf Course', 'Lake View', 'Clubhouse', 'Tennis Court', 'High Security'],
    googleMapLink: 'https://maps.google.com/?q=Prestige+Lakeside+Habitat',
    commissionStructure: '2% standard referral',
    availableInventory: '6 Luxury Villas, 12 Apartments',
    status: 'Active',
    createdAt: '2026-02-05T11:00:00Z',
    updatedAt: '2026-02-05T11:00:00Z'
  },
  {
    id: 'p4',
    name: 'Sobha Royal Pavilion',
    builderName: 'Sobha Developers',
    location: 'Sarjapur Road',
    city: 'Bangalore',
    area: 'East Bangalore',
    propertyType: ['Flat'],
    bhkOptions: ['3BHK', '4BHK'],
    priceMin: 14000000,
    priceMax: 24000000,
    possessionStatus: 'Under Construction',
    reraNumber: 'PRM/KA/RERA/1251/310/PR/190204',
    commissionStructure: '2.5%',
    availableInventory: 'Sold Out soon',
    status: 'Upcoming',
    createdAt: '2026-03-01T15:00:00Z',
    updatedAt: '2026-03-01T15:00:00Z'
  }
];

const MOCK_LEADS: Lead[] = [
  {
    id: 'L001',
    name: 'Amit Deshmukh',
    mobile: '9876543210',
    email: 'amit.desh@gmail.com',
    city: 'Mumbai',
    locality: 'Wadala or Dadar',
    propertyRequirement: 'Looking for premium 2BHK with balcony',
    buyRentResale: 'Buy',
    budgetMin: 20000000,
    budgetMax: 28000000,
    propertyType: 'Flat',
    bhk: '2BHK',
    purpose: 'Own Use',
    source: 'Meta Ads',
    projectInterested: 'Godrej Horizon',
    status: 'Site Visit Scheduled',
    priority: 'Hot',
    assignedTo: 'u4',
    assignedToName: 'Siddharth Mehta',
    createdBy: 'u5',
    createdByName: 'Neha Rao',
    createdAt: '2026-06-05T10:00:00Z',
    updatedAt: '2026-06-10T12:30:00Z',
    nextFollowUpDate: '2026-06-12',
    notes: 'Very interested in Godrej Horizon Wadala. Scheduled morning site visit.',
    tags: ['Premium', 'Wadala', 'ReadyCash']
  },
  {
    id: 'L002',
    name: 'Sandhya Raman',
    mobile: '9123456789',
    email: 'sandhya.r@yahoo.com',
    city: 'Bangalore',
    locality: 'Whitefield',
    propertyRequirement: 'Wants a private villa with good landscape',
    buyRentResale: 'Buy',
    budgetMin: 22000000,
    budgetMax: 30000000,
    propertyType: 'Villa',
    bhk: '4BHK',
    purpose: 'Own Use',
    source: 'Google Ads',
    projectInterested: 'Prestige Lakeside Habitat',
    status: 'Interested',
    priority: 'Hot',
    assignedTo: 'u4',
    assignedToName: 'Siddharth Mehta',
    createdBy: 'u3',
    createdByName: 'Priya Nair',
    createdAt: '2026-06-08T11:15:00Z',
    updatedAt: '2026-06-09T16:00:00Z',
    nextFollowUpDate: '2026-06-11',
    notes: 'Discussed Prestige lakeside villa. She asked for master floor plans.',
    tags: ['HNI', 'Villa', 'Whitefield']
  },
  {
    id: 'L003',
    name: 'Vikram Grover',
    mobile: '9888776655',
    email: 'vikgrover@outlook.com',
    city: 'Mumbai',
    locality: 'Thane',
    propertyRequirement: 'Affordable 1 or 2BHK',
    buyRentResale: 'Buy',
    budgetMin: 5000000,
    budgetMax: 7500000,
    propertyType: 'Flat',
    bhk: '1BHK',
    purpose: 'Investment',
    source: 'Website',
    projectInterested: 'Lodha Crown',
    status: 'Contacted',
    priority: 'Warm',
    assignedTo: 'u4',
    assignedToName: 'Siddharth Mehta',
    createdBy: 'u4',
    createdByName: 'Siddharth Mehta',
    createdAt: '2026-06-09T08:30:00Z',
    updatedAt: '2026-06-09T08:35:00Z',
    nextFollowUpDate: '2026-06-15',
    notes: 'Called, wants to invest for rental yields. Sent price sheets.',
    tags: ['Investor', 'Thane']
  },
  {
    id: 'L004',
    name: 'Rajesh Singhal',
    mobile: '9999888877',
    email: 'rajesh.singhal@rediffmail.com',
    city: 'Mumbai',
    locality: 'Wadala',
    propertyRequirement: '3BHK spacious apartment',
    buyRentResale: 'Buy',
    budgetMin: 30000000,
    budgetMax: 40000000,
    propertyType: 'Flat',
    bhk: '3BHK',
    purpose: 'Own Use',
    source: 'Referral',
    projectInterested: 'Godrej Horizon',
    status: 'Booking Done',
    priority: 'Hot',
    assignedTo: 'u3',
    assignedToName: 'Priya Nair',
    createdBy: 'u2',
    createdByName: 'Rajesh Patel',
    createdAt: '2026-05-20T14:00:00Z',
    updatedAt: '2026-06-10T11:00:00Z',
    notes: 'Booking advance taken. Under paperwork.',
    tags: ['ClosedProperty', 'Dadar']
  },
  {
    id: 'L005',
    name: 'Kshitij Saxena',
    mobile: '9777666555',
    city: 'Bangalore',
    locality: 'Sarjapur Road',
    buyRentResale: 'Buy',
    budgetMin: 12000000,
    budgetMax: 18000000,
    propertyType: 'Flat',
    bhk: '3BHK',
    purpose: 'Investment',
    source: 'Walk-in',
    status: 'Fresh',
    priority: 'Cold',
    assignedTo: 'u5',
    assignedToName: 'Neha Rao',
    createdBy: 'u5',
    createdByName: 'Neha Rao',
    createdAt: '2026-06-11T09:00:00Z',
    updatedAt: '2026-06-11T09:00:00Z',
    nextFollowUpDate: '2026-06-12',
    notes: 'Walked in to discuss investment opportunities.'
  },
  {
    id: 'L006',
    name: 'Meena Iyer',
    mobile: '9666555444',
    city: 'Mumbai',
    buyRentResale: 'Rent',
    budgetMin: 30000,
    budgetMax: 50000,
    propertyType: 'Flat',
    bhk: '2BHK',
    source: 'Other',
    status: 'Lost',
    priority: 'Cold',
    assignedTo: 'u5',
    assignedToName: 'Neha Rao',
    createdBy: 'u5',
    createdByName: 'Neha Rao',
    createdAt: '2026-05-15T12:00:00Z',
    updatedAt: '2026-05-20T10:00:00Z',
    lostReason: 'Low Budget',
    notes: 'Budget is too low for current rentals in Wadala. Lost.'
  }
];

const MOCK_TASKS: Task[] = [
  {
    id: 'T001',
    leadId: 'L001',
    clientName: 'Amit Deshmukh',
    mobile: '9876543210',
    type: 'Site Visit',
    dueDate: '2026-06-12',
    dueTime: '11:00',
    priority: 'High',
    assignedTo: 'u4',
    assignedToName: 'Siddharth Mehta',
    status: 'Pending',
    notes: 'Conduct Wadala site tour showing tower-B sample flat.',
    createdAt: '2026-06-10T12:30:00Z',
    updatedAt: '2026-06-10T12:30:00Z'
  },
  {
    id: 'T002',
    leadId: 'L002',
    clientName: 'Sandhya Raman',
    mobile: '9123456789',
    type: 'Call',
    dueDate: '2026-06-11',
    dueTime: '17:00',
    priority: 'High',
    assignedTo: 'u4',
    assignedToName: 'Siddharth Mehta',
    status: 'Pending',
    notes: 'Followup regarding villa layout plans of Prestige Lakeside.',
    createdAt: '2026-06-09T16:00:00Z',
    updatedAt: '2026-06-09T16:00:00Z'
  },
  {
    id: 'T003',
    leadId: 'L003',
    clientName: 'Vikram Grover',
    mobile: '9888776655',
    type: 'WhatsApp',
    dueDate: '2026-06-09',
    dueTime: '12:00',
    priority: 'Medium',
    assignedTo: 'u4',
    assignedToName: 'Siddharth Mehta',
    status: 'Overdue',
    notes: 'WhatsApp the location map and brochure of Lodha Crown Thane.',
    createdAt: '2026-06-09T08:35:00Z',
    updatedAt: '2026-06-09T08:35:00Z'
  },
  {
    id: 'T004',
    leadId: 'L004',
    clientName: 'Rajesh Singhal',
    mobile: '9999888877',
    type: 'Document',
    dueDate: '2026-06-10',
    dueTime: '14:00',
    priority: 'High',
    assignedTo: 'u3',
    assignedToName: 'Priya Nair',
    status: 'Completed',
    outcome: 'Completed registration paperwork. Handed over draft agreement.',
    notes: 'Collect PAN/Aadhaar copies for agreement listing.',
    createdAt: '2026-06-09T11:00:00Z',
    updatedAt: '2026-06-10T11:00:00Z'
  }
];

const MOCK_SITE_VISITS: SiteVisit[] = [
  {
    id: 'V001',
    leadId: 'L001',
    clientName: 'Amit Deshmukh',
    mobile: '9876543210',
    projectName: 'Godrej Horizon',
    visitDate: '2026-06-12',
    visitTime: '11:00',
    salesPerson: 'Siddharth Mehta',
    status: 'Scheduled',
    pickupRequired: 'Yes',
    meetingLocation: 'Dadar Station near Post Office',
    notes: 'Arrange vehicle pickup from Dadar for client.',
    createdAt: '2026-06-10T12:30:00Z',
    updatedAt: '2026-06-10T12:30:00Z'
  }
];

const MOCK_DEALS: Deal[] = [
  {
    id: 'D001',
    leadId: 'L004',
    clientName: 'Rajesh Singhal',
    projectName: 'Godrej Horizon',
    unitDetails: 'Tower B, Flat 2402, 3BHK',
    dealValue: 34000000,
    bookingAmount: 1000000,
    commissionPercent: 2.5,
    expectedCommission: 850000,
    receivedCommission: 400000,
    pendingCommission: 450000,
    stage: 'Booking',
    closingDate: '2026-06-05',
    salesPerson: 'u3',
    salesPersonName: 'Priya Nair',
    notes: 'First installment of 4 Lakhs commission received. Slabs agreement pending.',
    createdAt: '2026-05-20T14:00:00Z',
    updatedAt: '2026-06-10T11:00:00Z'
  }
];

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'A001',
    leadId: 'L001',
    type: 'Lead Created',
    description: 'Lead uploaded via Meta Ads and assigned to Siddharth Mehta round-robin',
    performedBy: 'u2',
    createdAt: '2026-06-05T10:00:00Z'
  },
  {
    id: 'A002',
    leadId: 'L001',
    type: 'Status Updated',
    description: 'Status changed from Fresh to Site Visit Scheduled. Assigned to Siddharth Mehta.',
    performedBy: 'u4',
    createdAt: '2026-06-10T12:30:00Z'
  }
];

const DEFAULT_SETTINGS: CRMSettings = {
  companyName: 'Dream Investment',
  companyPhone: '+91 99999 11111',
  companyAddress: 'Suite 404, Godrej One, Vikhroli East, Mumbai, MH - 400079',
  logoUrl: '',
  leadStatuses: [
    'Fresh',
    'Assigned',
    'Contacted',
    'Interested',
    'Follow-up',
    'Site Visit Scheduled',
    'Site Visit Done',
    'Negotiation',
    'Booking Done',
    'Deal Closed',
    'Not Interested',
    'Wrong Number',
    'CNR / Not Reachable',
    'Busy',
    'Low Budget',
    'Duplicate',
    'Lost'
  ],
  leadSources: [
    'Meta Ads',
    'Google Ads',
    'Website',
    'WhatsApp',
    'Walk-in',
    'Referral',
    'Magicbricks',
    '99acres',
    'Housing',
    'Manual',
    'Other'
  ],
  propertyTypes: ['Flat', 'Villa', 'Plot', 'Office', 'Shop', 'Warehouse', 'Land'],
  lostReasons: [
    'Low Budget',
    'Not Interested',
    'Bought Elsewhere',
    'Wrong Number',
    'Location Mismatch',
    'Project Mismatch',
    'No Response',
    'Duplicate',
    'Other'
  ],
  taskTypes: ['Call', 'WhatsApp', 'Site Visit', 'Meeting', 'Payment', 'Document', 'Other'],
  whatsappTemplates: [
    {
      id: 'wt1',
      name: 'New Lead Welcome',
      category: 'Greeting',
      content: 'Hello {client_name}, thank you for showing interest in real estate opportunities with {company_name}. Our senior agent {sales_person_name} will get in touch with you shortly. Keep hunting!'
    },
    {
      id: 'wt2',
      name: 'Project Details Brochure',
      category: 'Information',
      content: 'Hi {client_name}, here are the premium layouts and details for {project_name}. We have customized options fitting your budget criteria. Please let us know when we can arrange a quick walkthrough!'
    },
    {
      id: 'wt3',
      name: 'Site Visit Confirmation',
      category: 'Appointment',
      content: 'Hello {client_name}, your site visit for {project_name} is successfully scheduled on {site_visit_date} with our representative {sales_person_name}. See you there!'
    },
    {
      id: 'wt4',
      name: 'Follow-up / Not Reachable',
      category: 'Follow-up',
      content: 'Hello {client_name}, we tried contacting you regarding your property requirement but were unable to connect. Please let us know a suitable time to callback. - {company_name}'
    }
  ]
};

const MOCK_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'r1',
    name: 'Auto Round-Robin Lead Assignment',
    trigger: 'New Lead Created',
    action: 'Assign User',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'r2',
    name: 'Auto-Task on New Lead Upload',
    trigger: 'New Lead Created',
    action: 'Create Task',
    actionValue: 'Introduction Callback',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'r3',
    name: 'Welcome auto-WhatsApp',
    trigger: 'New Lead Created',
    action: 'Send WhatsApp Message',
    actionValue: 'wt1',
    isActive: false,
    createdAt: '2026-02-01T00:00:00Z'
  }
];

// Helper to initialize local storage mock data if empty
export function initMockStorage() {
  if (typeof window === 'undefined') return;

  const checkAndInit = (key: string, initialData: any) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(initialData));
    }
  };

  checkAndInit('di_crm_users', MOCK_USERS);
  checkAndInit('di_crm_projects', MOCK_PROJECTS);
  checkAndInit('di_crm_leads', MOCK_LEADS);
  checkAndInit('di_crm_tasks', MOCK_TASKS);
  checkAndInit('di_crm_site_visits', MOCK_SITE_VISITS);
  checkAndInit('di_crm_deals', MOCK_DEALS);
  checkAndInit('di_crm_activities', MOCK_ACTIVITIES);
  checkAndInit('di_crm_settings', DEFAULT_SETTINGS);
  checkAndInit('di_crm_automations', MOCK_AUTOMATIONS);
}

// Global active user simulator
export function getActiveUser(): CRMUser {
  if (typeof window !== 'undefined') {
    const active = localStorage.getItem('di_crm_active_user');
    if (active) {
      try {
        return JSON.parse(active);
      } catch (e) {
        // Fallback
      }
    }
    // Default to Super Admin (Sconsett Media)
    const defUser = MOCK_USERS.find(u => u.email === 'sconsett.media@gmail.com') || MOCK_USERS[0];
    localStorage.setItem('di_crm_active_user', JSON.stringify(defUser));
    return defUser;
  }
  return MOCK_USERS[0];
}

export function setActiveUser(user: CRMUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('di_crm_active_user', JSON.stringify(user));
  }
}

// Core DB operations that bridge real Firebase and the Local simulator
export const CrmDb = {
  // Configured check - returns true ONLY if real Firebase is configured AND there is an authenticated user session
  isFirebase: (): boolean => {
    return !isDummyConfig && db !== null && auth !== null && auth.currentUser !== null;
  },

  // ------------------ USERS ------------------
  getUsers: async (): Promise<CRMUser[]> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (snap.empty) {
          const lData = localStorage.getItem('di_crm_users');
          const mockUsers: CRMUser[] = lData ? JSON.parse(lData) : [];
          for (const u of mockUsers) {
            await setDoc(doc(db, 'users', u.id), u);
          }
          return mockUsers;
        }
        return snap.docs.map(d => d.data() as CRMUser);
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'users');
      }
    }
    const data = localStorage.getItem('di_crm_users');
    return data ? JSON.parse(data) : [];
  },

  saveUser: async (user: CRMUser): Promise<void> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'users', user.id), user);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
      }
    }
    const users = await CrmDb.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem('di_crm_users', JSON.stringify(users));
  },

  // ------------------ LEADS ------------------
  getLeads: async (): Promise<Lead[]> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        const snap = await getDocs(collection(db, 'leads'));
        if (snap.empty) {
          const lData = localStorage.getItem('di_crm_leads');
          const mockLeads: Lead[] = lData ? JSON.parse(lData) : [];
          for (const l of mockLeads) {
            await setDoc(doc(db, 'leads', l.id), l);
          }
          return mockLeads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }
        const leads = snap.docs.map(d => d.data() as Lead);
        return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'leads');
      }
    }
    const data = localStorage.getItem('di_crm_leads');
    const leads: Lead[] = data ? JSON.parse(data) : [];
    return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  addLead: async (lead: Omit<Lead, 'id'>): Promise<Lead> => {
    initMockStorage();
    const leads = await CrmDb.getLeads();
    // Validate duplicate phone
    const duplicate = leads.find(l => l.mobile === lead.mobile);
    if (duplicate) {
      throw new Error(`DUPLICATE_PHONE: A customer lead with phone number "${lead.mobile}" is already registered (Assigned to: ${duplicate.assignedToName || 'Unassigned'}).`);
    }

    const newId = `L${String(leads.length + 1).padStart(3, '0')}-${Math.floor(Math.random() * 1000)}`;
    const newLead: Lead = {
      ...lead,
      id: newId,
      createdAt: lead.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'leads', newLead.id), newLead);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `leads/${newLead.id}`);
      }
    }

    leads.unshift(newLead);
    localStorage.setItem('di_crm_leads', JSON.stringify(leads));

    // Register Timeline Activity Log
    await CrmDb.addActivity({
      leadId: newLead.id,
      clientName: newLead.name,
      type: 'Lead Created',
      description: `New lead profile registered for ${newLead.propertyType} in ${newLead.city}. Source: "${newLead.source}". Representative assigned: [${newLead.assignedToName || 'Unassigned'}].`,
      performedBy: lead.createdBy || 'system',
      performedByName: lead.createdByName || 'Dream CRM'
    });

    // Fire triggered background automations
    await CrmDb.executeAutomations('New Lead Created', newLead);

    return newLead;
  },

  updateLead: async (id: string, updates: Partial<Lead>): Promise<Lead> => {
    initMockStorage();
    const leads = await CrmDb.getLeads();
    const idx = leads.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lead not found');

    const original = leads[idx];
    const mergedLead: Lead = {
      ...original,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'leads', id), mergedLead);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `leads/${id}`);
      }
    }

    leads[idx] = mergedLead;
    localStorage.setItem('di_crm_leads', JSON.stringify(leads));

    // Compile description of changes
    const changes: string[] = [];
    if (updates.status && updates.status !== original.status) {
      changes.push(`status changed from "${original.status}" to "${updates.status}"`);
      // Trigger status automation if closed or updated
      if (updates.status === 'Deal Closed') {
        await CrmDb.executeAutomations('Deal Closed', mergedLead);
      } else {
        await CrmDb.executeAutomations('Lead Status Changed', mergedLead);
      }
    }
    if (updates.assignedTo && updates.assignedTo !== original.assignedTo) {
      changes.push(`assigned agent changed to "${updates.assignedToName || updates.assignedTo}"`);
    }
    if (updates.notes && updates.notes !== original.notes) {
      changes.push('note added');
    }

    if (changes.length > 0) {
      await CrmDb.addActivity({
        leadId: id,
        clientName: mergedLead.name,
        type: 'Lead Updated',
        description: `Lead updated: ${changes.join(', ')}.`,
        performedBy: getActiveUser().id,
        performedByName: getActiveUser().name
      });
    }

    return mergedLead;
  },

  deleteLead: async (id: string): Promise<void> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        await deleteDoc(doc(db, 'leads', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `leads/${id}`);
      }
    }
    const leads = await CrmDb.getLeads();
    const filtered = leads.filter(l => l.id !== id);
    localStorage.setItem('di_crm_leads', JSON.stringify(filtered));
  },

  // ------------------ PROJECTS ------------------
  getProjects: async (): Promise<Project[]> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        const snap = await getDocs(collection(db, 'projects'));
        if (snap.empty) {
          const lData = localStorage.getItem('di_crm_projects');
          const mockProjects: Project[] = lData ? JSON.parse(lData) : [];
          for (const p of mockProjects) {
            await setDoc(doc(db, 'projects', p.id), p);
          }
          return mockProjects;
        }
        return snap.docs.map(d => d.data() as Project);
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'projects');
      }
    }
    const data = localStorage.getItem('di_crm_projects');
    return data ? JSON.parse(data) : [];
  },

  saveProject: async (project: Project): Promise<void> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'projects', project.id), project);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `projects/${project.id}`);
      }
    }
    const projects = await CrmDb.getProjects();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      projects.push({ ...project, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem('di_crm_projects', JSON.stringify(projects));
  },

  deleteProject: async (id: string): Promise<void> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        await deleteDoc(doc(db, 'projects', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `projects/${id}`);
      }
    }
    const projects = await CrmDb.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem('di_crm_projects', JSON.stringify(filtered));
  },

  // ------------------ TASKS / FOLLOW-UPS ------------------
  getTasks: async (): Promise<Task[]> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        const snap = await getDocs(collection(db, 'tasks'));
        if (snap.empty) {
          const lData = localStorage.getItem('di_crm_tasks');
          const mockTasks: Task[] = lData ? JSON.parse(lData) : [];
          for (const t of mockTasks) {
            await setDoc(doc(db, 'tasks', t.id), t);
          }
          return mockTasks;
        }
        return snap.docs.map(d => d.data() as Task);
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'tasks');
      }
    }
    const data = localStorage.getItem('di_crm_tasks');
    return data ? JSON.parse(data) : [];
  },

  addTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    initMockStorage();
    const tasks = await CrmDb.getTasks();
    const newId = `T${String(tasks.length + 1).padStart(3, '0')}-${Math.floor(Math.random() * 1000)}`;
    const fullTask: Task = {
      ...task,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'tasks', newId), fullTask);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tasks/${newId}`);
      }
    }

    tasks.push(fullTask);
    localStorage.setItem('di_crm_tasks', JSON.stringify(tasks));

    // Add activity log
    await CrmDb.addActivity({
      leadId: task.leadId,
      clientName: task.clientName,
      type: 'Follow-up Scheduled',
      description: `New ${task.type} follow-up scheduled for ${task.dueDate} at ${task.dueTime} (Priority: ${task.priority}).`,
      performedBy: getActiveUser().id,
      performedByName: getActiveUser().name
    });

    return fullTask;
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus, outcome?: string): Promise<Task> => {
    initMockStorage();
    const tasks = await CrmDb.getTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error('Task not found');

    const original = tasks[idx];
    const updated: Task = {
      ...original,
      status,
      outcome: outcome || original.outcome,
      updatedAt: new Date().toISOString()
    };

    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'tasks', taskId), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
      }
    }

    tasks[idx] = updated;
    localStorage.setItem('di_crm_tasks', JSON.stringify(tasks));

    // Log Activity
    await CrmDb.addActivity({
      leadId: original.leadId,
      clientName: original.clientName,
      type: 'Follow-up Updated',
      description: `Follow-up ${original.type} marked as ${status}.${outcome ? ` Outcome: "${outcome}"` : ''}`,
      performedBy: getActiveUser().id,
      performedByName: getActiveUser().name
    });

    return updated;
  },

  checkAndUpdateOverdueTasks: () => {
    const data = localStorage.getItem('di_crm_tasks');
    if (!data) return;
    const tasks: Task[] = JSON.parse(data);
    const now = new Date();
    let hasChanges = false;

    tasks.forEach(t => {
      if (t.status === 'Pending') {
        const dueDateTime = new Date(`${t.dueDate}T${t.dueTime || '23:59'}:00`);
        if (dueDateTime < now) {
          t.status = 'Overdue';
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      localStorage.setItem('di_crm_tasks', JSON.stringify(tasks));
    }
  },

  // ------------------ SITE VISITS ------------------
  getSiteVisits: async (): Promise<SiteVisit[]> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        const snap = await getDocs(collection(db, 'site_visits'));
        if (snap.empty) {
          const lData = localStorage.getItem('di_crm_site_visits');
          const mockVisits: SiteVisit[] = lData ? JSON.parse(lData) : [];
          for (const s of mockVisits) {
            await setDoc(doc(db, 'site_visits', s.id), s);
          }
          return mockVisits;
        }
        return snap.docs.map(d => d.data() as SiteVisit);
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'site_visits');
      }
    }
    const data = localStorage.getItem('di_crm_site_visits');
    return data ? JSON.parse(data) : [];
  },

  scheduleSiteVisit: async (visit: Omit<SiteVisit, 'id' | 'createdAt' | 'updatedAt'>): Promise<SiteVisit> => {
    initMockStorage();
    const visits = await CrmDb.getSiteVisits();
    const newId = `V${String(visits.length + 1).padStart(3, '0')}-${Math.floor(Math.random() * 1000)}`;
    const fullVisit: SiteVisit = {
      ...visit,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'site_visits', newId), fullVisit);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `site_visits/${newId}`);
      }
    }

    visits.push(fullVisit);
    localStorage.setItem('di_crm_site_visits', JSON.stringify(visits));

    // Generate task reminder automatically as requested: "Auto-reminder before site visit" or create task
    await CrmDb.addTask({
      leadId: visit.leadId,
      clientName: visit.clientName,
      mobile: visit.mobile,
      type: 'Site Visit',
      dueDate: visit.visitDate,
      dueTime: visit.visitTime,
      priority: 'High',
      assignedTo: getActiveUser().id,
      assignedToName: getActiveUser().name,
      status: 'Pending',
      notes: `Site visit for ${visit.projectName}. Pickup: ${visit.pickupRequired}. Meeting spot: ${visit.meetingLocation || 'N/A'}`
    });

    // Update lead's status to reflects scheduled visit
    await CrmDb.updateLead(visit.leadId, {
      status: 'Site Visit Scheduled',
      nextFollowUpDate: visit.visitDate,
      siteVisitStatus: 'Scheduled'
    });

    // Log Activity
    await CrmDb.addActivity({
      leadId: visit.leadId,
      clientName: visit.clientName,
      type: 'Site Visit Scheduled',
      description: `Site visit scheduled for project ${visit.projectName} on ${visit.visitDate} at ${visit.visitTime}. Pickup: ${visit.pickupRequired}.`,
      performedBy: getActiveUser().id,
      performedByName: getActiveUser().name
    });

    return fullVisit;
  },

  updateSiteVisitStatus: async (visitId: string, status: SiteVisitStatus, feedback?: string): Promise<SiteVisit> => {
    initMockStorage();
    const visits = await CrmDb.getSiteVisits();
    const idx = visits.findIndex(v => v.id === visitId);
    if (idx === -1) throw new Error('Site visit not found');

    const original = visits[idx];
    const updated: SiteVisit = {
      ...original,
      status,
      clientFeedback: feedback || original.clientFeedback,
      updatedAt: new Date().toISOString()
    };

    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'site_visits', visitId), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `site_visits/${visitId}`);
      }
    }

    visits[idx] = updated;
    localStorage.setItem('di_crm_site_visits', JSON.stringify(visits));

    // Update corresponding lead status if visit is done
    if (status === 'Done') {
      await CrmDb.updateLead(original.leadId, {
        status: 'Site Visit Done',
        siteVisitStatus: 'Done'
      });

      // Suggest follow up task automatically: "Auto-create follow-up after site visit"
      await CrmDb.addTask({
        leadId: original.leadId,
        clientName: original.clientName,
        mobile: original.mobile,
        type: 'Call',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        dueTime: '12:00',
        priority: 'High',
        assignedTo: getActiveUser().id,
        assignedToName: getActiveUser().name,
        status: 'Pending',
        notes: `Post site visit feedback follow-up. Collect booking token details if affirmative.`
      });
    } else {
      await CrmDb.updateLead(original.leadId, {
        siteVisitStatus: status
      });
    }

    // Add activity log
    await CrmDb.addActivity({
      leadId: original.leadId,
      clientName: original.clientName,
      type: 'Site Visit Status Updated',
      description: `Site visit for ${original.projectName} marked as ${status}.${feedback ? ` Feedback: "${feedback}"` : ''}`,
      performedBy: getActiveUser().id,
      performedByName: getActiveUser().name
    });

    return updated;
  },

  // ------------------ DEALS ------------------
  getDeals: async (): Promise<Deal[]> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        const snap = await getDocs(collection(db, 'deals'));
        if (snap.empty) {
          const lData = localStorage.getItem('di_crm_deals');
          const mockDeals: Deal[] = lData ? JSON.parse(lData) : [];
          for (const d of mockDeals) {
            await setDoc(doc(db, 'deals', d.id), d);
          }
          return mockDeals;
        }
        return snap.docs.map(d => d.data() as Deal);
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'deals');
      }
    }
    const data = localStorage.getItem('di_crm_deals');
    return data ? JSON.parse(data) : [];
  },

  createDeal: async (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> => {
    initMockStorage();
    const deals = await CrmDb.getDeals();
    const newId = `D${String(deals.length + 1).padStart(3, '0')}-${Math.floor(Math.random() * 1000)}`;

    const fullDeal: Deal = {
      ...deal,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'deals', newId), fullDeal);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `deals/${newId}`);
      }
    }

    deals.push(fullDeal);
    localStorage.setItem('di_crm_deals', JSON.stringify(deals));

    // Synchronously alter the Lead's status to Booking Done / Deal Closed
    await CrmDb.updateLead(deal.leadId, {
      status: 'Booking Done',
      dealStatus: deal.stage
    });

    const parentLeads = await CrmDb.getLeads();
    const parent = parentLeads.find(l => l.id === deal.leadId);
    const mobile = parent ? parent.mobile : '';

    // Synthesize or update Client record automatically from Lead and Deal
    await CrmDb.updateClientProfileFromDeal(deal.leadId, deal.clientName, mobile, fullDeal);

    // Add activity log
    await CrmDb.addActivity({
      leadId: deal.leadId,
      clientName: deal.clientName,
      type: 'Deal Logged',
      description: `Converted lead to transaction deal. Value: ₹${deal.dealValue.toLocaleString()}, Booking Token: ₹${deal.bookingAmount.toLocaleString()}, Expected Brokerage Commission: ₹${deal.expectedCommission.toLocaleString()}`,
      performedBy: getActiveUser().id,
      performedByName: getActiveUser().name
    });

    return fullDeal;
  },

  updateDealStage: async (dealId: string, stage: DealStage, receivedComm?: number): Promise<Deal> => {
    initMockStorage();
    const deals = await CrmDb.getDeals();
    const idx = deals.findIndex(d => d.id === dealId);
    if (idx === -1) throw new Error('Deal not found');

    const original = deals[idx];
    const comm = receivedComm !== undefined ? receivedComm : original.receivedCommission;
    const pendingComm = original.expectedCommission - comm;
    const updated: Deal = {
      ...original,
      stage,
      receivedCommission: comm,
      pendingCommission: pendingComm,
      updatedAt: new Date().toISOString()
    };

    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'deals', dealId), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `deals/${dealId}`);
      }
    }

    deals[idx] = updated;
    localStorage.setItem('di_crm_deals', JSON.stringify(deals));

    if (stage === 'Closed') {
      await CrmDb.updateLead(original.leadId, {
        status: 'Deal Closed',
        dealStatus: 'Closed'
      });
    }

    // Sync client total deal value recalculation
    await CrmDb.recalculateClientsData();

    await CrmDb.addActivity({
      leadId: original.leadId,
      clientName: original.clientName,
      type: 'Deal Updated',
      description: `Deal stage updated to ${stage}. Brokerage Received: ₹${(receivedComm || 0).toLocaleString()}, Pending: ₹${pendingComm.toLocaleString()}`,
      performedBy: getActiveUser().id,
      performedByName: getActiveUser().name
    });

    return updated;
  },

  // ------------------ CLIENTS MODULE ------------------
  getClients: async (): Promise<Client[]> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        const snap = await getDocs(collection(db, 'clients'));
        if (snap.empty) {
          const lData = localStorage.getItem('di_crm_clients');
          const mockClients: Client[] = lData ? JSON.parse(lData) : [];
          for (const c of mockClients) {
            await setDoc(doc(db, 'clients', c.id), c);
          }
          return mockClients;
        }
        return snap.docs.map(d => d.data() as Client);
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'clients');
      }
    }
    const data = localStorage.getItem('di_crm_clients');
    return data ? JSON.parse(data) : [];
  },

  updateClientProfileFromDeal: async (leadId: string, name: string, mobile: string, deal: Deal): Promise<void> => {
    initMockStorage();
    const clients = await CrmDb.getClients();
    const idx = clients.findIndex(c => c.mobile === mobile);
    const nowStr = new Date().toISOString();

    if (idx >= 0) {
      const current = clients[idx];
      const projects = current.projectsInterested || [];
      if (!projects.includes(deal.projectName)) {
        projects.push(deal.projectName);
      }
      const updatedClient = {
        ...current,
        name,
        dealsCount: current.dealsCount + 1,
        totalDealValue: current.totalDealValue + deal.dealValue,
        projectsInterested: projects,
        updatedAt: nowStr
      };

      if (CrmDb.isFirebase()) {
        try {
          await setDoc(doc(db, 'clients', current.id), updatedClient);
        } catch (e) {
          console.error(e);
        }
      }

      clients[idx] = updatedClient;
    } else {
      const newId = `C${String(clients.length + 1).padStart(3, '0')}`;
      const newClient = {
        id: newId,
        name,
        mobile,
        dealsCount: 1,
        totalDealValue: deal.dealValue,
        projectsInterested: [deal.projectName],
        createdAt: nowStr,
        updatedAt: nowStr
      };

      if (CrmDb.isFirebase()) {
        try {
          await setDoc(doc(db, 'clients', newId), newClient);
        } catch (e) {
          console.error(e);
        }
      }

      clients.push(newClient);
    }

    localStorage.setItem('di_crm_clients', JSON.stringify(clients));
  },

  recalculateClientsData: async () => {
    const dataLeads = localStorage.getItem('di_crm_leads');
    const dataDeals = localStorage.getItem('di_crm_deals');
    if (!dataLeads) return;

    const leads: Lead[] = JSON.parse(dataLeads);
    const deals: Deal[] = dataDeals ? JSON.parse(dataDeals) : [];
    const clientMap: { [mobile: string]: Client } = {};

    let index = 1;
    leads.forEach(l => {
      if (!clientMap[l.mobile]) {
        clientMap[l.mobile] = {
          id: `C${String(index++).padStart(3, '0')}`,
          name: l.name,
          mobile: l.mobile,
          email: l.email,
          dealsCount: 0,
          totalDealValue: 0,
          projectsInterested: l.projectInterested ? [l.projectInterested] : [],
          notes: l.notes,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt
        };
      } else {
        if (l.projectInterested && !clientMap[l.mobile].projectsInterested?.includes(l.projectInterested)) {
          clientMap[l.mobile].projectsInterested?.push(l.projectInterested);
        }
      }
    });

    deals.forEach(d => {
      const lead = leads.find(l => l.id === d.leadId);
      const mobile = lead ? lead.mobile : '';
      if (mobile && clientMap[mobile]) {
        clientMap[mobile].dealsCount += 1;
        clientMap[mobile].totalDealValue += d.dealValue;
        if (!clientMap[mobile].projectsInterested?.includes(d.projectName)) {
          clientMap[mobile].projectsInterested?.push(d.projectName);
        }
      }
    });

    const clientsList = Object.values(clientMap);
    localStorage.setItem('di_crm_clients', JSON.stringify(clientsList));

    if (CrmDb.isFirebase()) {
      try {
        for (const c of clientsList) {
          await setDoc(doc(db, 'clients', c.id), c);
        }
      } catch (e) {
        console.error('Clients cluster cloud recalculate error:', e);
      }
    }
  },

  // ------------------ ACTIVITIES ------------------
  getActivities: async (leadId?: string): Promise<Activity[]> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        const snap = await getDocs(collection(db, 'activities'));
        if (snap.empty) {
          const lData = localStorage.getItem('di_crm_activities');
          const mockAct: Activity[] = lData ? JSON.parse(lData) : [];
          for (const a of mockAct) {
            await setDoc(doc(db, 'activities', a.id), a);
          }
          const sortedMock = mockAct.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
          return leadId ? sortedMock.filter(a => a.leadId === leadId) : sortedMock;
        }
        const snapList = snap.docs.map(d => d.data() as Activity);
        const sortedReal = snapList.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
        return leadId ? sortedReal.filter(a => a.leadId === leadId) : sortedReal;
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'activities');
      }
    }
    const data = localStorage.getItem('di_crm_activities');
    const list: Activity[] = data ? JSON.parse(data) : [];
    if (leadId) {
      return list.filter(a => a.leadId === leadId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addActivity: async (activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> => {
    initMockStorage();
    const newAct: Activity = {
      ...activity,
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };

    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'activities', newAct.id), newAct);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `activities/${newAct.id}`);
      }
    }

    const data = localStorage.getItem('di_crm_activities');
    const list: Activity[] = data ? JSON.parse(data) : [];
    list.unshift(newAct);
    localStorage.setItem('di_crm_activities', JSON.stringify(list));
    return newAct;
  },

  // ------------------ SETTINGS ------------------
  getSettings: async (): Promise<CRMSettings> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'global'));
        if (docSnap.exists()) {
          return docSnap.data() as CRMSettings;
        } else {
          const lData = localStorage.getItem('di_crm_settings');
          const defaultSet: CRMSettings = lData ? JSON.parse(lData) : DEFAULT_SETTINGS;
          await setDoc(doc(db, 'settings', 'global'), defaultSet);
          return defaultSet;
        }
      } catch (err) {
        return handleFirestoreError(err, OperationType.GET, 'settings/global');
      }
    }
    const data = localStorage.getItem('di_crm_settings');
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  saveSettings: async (settings: CRMSettings): Promise<void> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'settings', 'global'), settings);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/global');
      }
    }
    localStorage.setItem('di_crm_settings', JSON.stringify(settings));
  },

  // ------------------ AUTOMATION LAUNCHER ------------------
  getAutomations: async (): Promise<AutomationRule[]> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        const snap = await getDocs(collection(db, 'automations'));
        if (snap.empty) {
          const lData = localStorage.getItem('di_crm_automations');
          const mockRules: AutomationRule[] = lData ? JSON.parse(lData) : [];
          for (const r of mockRules) {
            await setDoc(doc(db, 'automations', r.id), r);
          }
          return mockRules;
        }
        return snap.docs.map(d => d.data() as AutomationRule);
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'automations');
      }
    }
    const data = localStorage.getItem('di_crm_automations');
    return data ? JSON.parse(data) : [];
  },

  saveAutomation: async (rule: AutomationRule): Promise<void> => {
    initMockStorage();
    if (CrmDb.isFirebase()) {
      try {
        await setDoc(doc(db, 'automations', rule.id), rule);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `automations/${rule.id}`);
      }
    }
    const rules = await CrmDb.getAutomations();
    const idx = rules.findIndex(r => r.id === rule.id);
    if (idx >= 0) {
      rules[idx] = rule;
    } else {
      rules.push(rule);
    }
    localStorage.setItem('di_crm_automations', JSON.stringify(rules));
  },

  executeAutomations: async (trigger: string, lead: Lead) => {
    const rules = await CrmDb.getAutomations();
    const activeRules = rules.filter(r => r.isActive && r.trigger === trigger);
    const users = await CrmDb.getUsers();
    const executives = users.filter(u => (u.role === 'Sales Executive' || u.role === 'Telecaller') && u.isActive);

    for (const rule of activeRules) {
      try {
        if (rule.action === 'Assign User' && executives.length > 0) {
          const lastAssignIndex = parseInt(localStorage.getItem('di_crm_last_rr_index') || '0', 10);
          const nextIndex = (lastAssignIndex + 1) % executives.length;
          const assignedExec = executives[nextIndex];
          localStorage.setItem('di_crm_last_rr_index', String(nextIndex));

          await CrmDb.updateLead(lead.id, {
            assignedTo: assignedExec.id,
            assignedToName: assignedExec.name,
            status: 'Assigned'
          });
        }

        if (rule.action === 'Create Task') {
          await CrmDb.addTask({
            leadId: lead.id,
            clientName: lead.name,
            mobile: lead.mobile,
            type: 'Call',
            dueDate: new Date().toISOString().split('T')[0],
            dueTime: '15:00',
            priority: 'High',
            assignedTo: lead.assignedTo,
            assignedToName: lead.assignedToName || 'Unassigned',
            status: 'Pending',
            notes: rule.actionValue || 'Automation triggered callback task.'
          });
        }

        if (rule.action === 'Send WhatsApp Message' && rule.actionValue) {
          const settings = await CrmDb.getSettings();
          const template = settings.whatsappTemplates.find(t => t.id === rule.actionValue);
          if (template) {
            let message = template.content
              .replace('{client_name}', lead.name)
              .replace('{company_name}', settings.companyName)
              .replace('{sales_person_name}', lead.assignedToName || 'Our executive')
              .replace('{project_name}', lead.projectInterested || 'our project');

            await CrmDb.addActivity({
              leadId: lead.id,
              clientName: lead.name,
              type: 'WhatsApp Outbox Log',
              description: `[Auto WhatsApp Sent] Template: "${template.name}". Message: "${message}"`,
              performedBy: 'system',
              performedByName: 'Dream BOT'
            });
          }
        }
      } catch (error) {
        console.error('Automation action failure:', error);
      }
    }
  },

  updateAutomationRuleStatus: async (id: string, isActive: boolean): Promise<void> => {
    initMockStorage();
    const rules = await CrmDb.getAutomations();
    const idx = rules.findIndex(r => r.id === id);
    if (idx !== -1) {
      rules[idx].isActive = isActive;
      if (CrmDb.isFirebase()) {
        try {
          await setDoc(doc(db, 'automations', id), rules[idx]);
        } catch (e) {
          console.error(e);
        }
      }
      localStorage.setItem('di_crm_automations', JSON.stringify(rules));
    }
  },

  updateUserStatus: async (userId: string, isActive: boolean): Promise<void> => {
    initMockStorage();
    const users = await CrmDb.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].isActive = isActive;
      if (CrmDb.isFirebase()) {
        try {
          await setDoc(doc(db, 'users', userId), users[idx]);
        } catch (e) {
          console.error(e);
        }
      }
      localStorage.setItem('di_crm_users', JSON.stringify(users));
    }
  },

  getWhatsAppTemplates: async (): Promise<any[]> => {
    initMockStorage();
    const data = localStorage.getItem('di_crm_whatsapp_templates_custom');
    let templates: any[] = [];
    if (data) {
      templates = JSON.parse(data);
    } else {
      templates = [
        { id: 'wt1', name: 'Welcome Brochure Pitch', category: 'Utility', content: 'Dear {ClientName}, glad to connect! Here is the latest luxury project {ProjectName} layout. Please check.', body: 'Dear {ClientName}, glad to connect! Here is the latest luxury project {ProjectName} layout. Please check.' },
        { id: 'wt2', name: 'Confirm Site Walkthrough', category: 'Utility', content: 'Hi {ClientName}, your custom site tour for {ProjectName} is locked in for {SiteVisitDate}. Accompanied by {SalesPerson}. See you!', body: 'Hi {ClientName}, your custom site tour for {ProjectName} is locked in for {SiteVisitDate}. Accompanied by {SalesPerson}. See you!' }
      ];
      localStorage.setItem('di_crm_whatsapp_templates_custom', JSON.stringify(templates));
    }
    return templates;
  },

  addWhatsAppTemplate: async (payload: any): Promise<void> => {
    const list = await CrmDb.getWhatsAppTemplates();
    const brandNew = {
      id: `wt_${Date.now()}`,
      name: payload.name,
      category: payload.category || 'Utility',
      content: payload.body || payload.content,
      body: payload.body || payload.content
    };
    list.push(brandNew);
    localStorage.setItem('di_crm_whatsapp_templates_custom', JSON.stringify(list));
  },

  updateSiteVisitFeedback: async (visitId: string, rating: number, feedback: string): Promise<void> => {
    initMockStorage();
    const visits = await CrmDb.getSiteVisits();
    const idx = visits.findIndex(v => v.id === visitId);
    if (idx !== -1) {
      visits[idx].status = 'Done';
      visits[idx].clientFeedback = feedback;
      (visits[idx] as any).clientRating = rating;
      localStorage.setItem('di_crm_site_visits', JSON.stringify(visits));
      await CrmDb.updateSiteVisitStatus(visitId, 'Done', feedback);
    }
  },

  receiveDealCommission: async (dealId: string, amount: number): Promise<void> => {
    initMockStorage();
    const deals = await CrmDb.getDeals();
    const idx = deals.findIndex(d => d.id === dealId);
    if (idx !== -1) {
      deals[idx].receivedCommission = amount;
      deals[idx].pendingCommission = deals[idx].expectedCommission - amount;

      if (CrmDb.isFirebase()) {
        try {
          await setDoc(doc(db, 'deals', dealId), deals[idx]);
        } catch (e) {
          console.error(e);
        }
      }

      localStorage.setItem('di_crm_deals', JSON.stringify(deals));
    }
  },

  getAutomationRules: async (): Promise<AutomationRule[]> => {
    return CrmDb.getAutomations();
  },

  saveAutomationRule: async (rulePayload: any): Promise<void> => {
    const mappedRule: AutomationRule = {
      id: rulePayload.id || `rule_${Date.now()}`,
      name: rulePayload.name,
      trigger: rulePayload.triggerEvent === 'On Lead Created' ? 'New Lead Created' : rulePayload.triggerEvent === 'On Site Visit Scheduled' ? 'Site Visit Scheduled' : 'Deal Closed',
      action: rulePayload.actionType === 'Auto Assign Users' ? 'Assign User' : rulePayload.actionType === 'Auto WhatsApp Link' ? 'Send WhatsApp Message' : 'Create Task',
      isActive: rulePayload.isActive,
      createdAt: new Date().toISOString()
    };
    await CrmDb.saveAutomation(mappedRule);
  },

  resetSimulatorData: () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      initMockStorage();
    }
  }
};
