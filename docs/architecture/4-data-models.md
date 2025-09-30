# 4. Data Models

## 4.1 Core Domain Models

```typescript
// packages/shared/src/types/agent.ts

export interface Agent {
  id: string;
  phoneNumber: string;              // E.164 format: +35799123456
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'viewer';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 4.2 Conversation Models

```typescript
// packages/shared/src/types/conversation.ts

export type Intent =
  | 'GENERATE_DOCUMENT'
  | 'UPLOAD_LISTING'
  | 'CALCULATE'
  | 'SEND_EMAIL'
  | 'UNKNOWN';

export interface Conversation {
  id: string;
  agentId: string;
  platform: 'whatsapp' | 'telegram';
  startedAt: Date;
  lastMessageAt: Date;
  isActive: boolean;
  currentIntent: Intent | null;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  sender: 'agent' | 'sophia';
  content: string;
  timestamp: Date;
  metadata: Record<string, unknown> | null;
}

export interface ConversationState {
  agentId: string;
  currentIntent: Intent;
  collectedData: Record<string, unknown>;
  conversationHistory: ConversationMessage[];
  templateId?: string | null;
  listingDraftId?: string | null;
  lastActivity: Date;
  expiresAt: Date;
}
```

## 4.3 Document Models

```typescript
// packages/shared/src/types/document.ts

export interface DocumentTemplate {
  id: string;
  name: string;
  category: 'contracts' | 'marketing' | 'legal' | 'financial';
  description: string;
  templateContent: string;          // Handlebars template
  requiredFields: string[];         // JSON array of field names
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentGeneration {
  id: string;
  agentId: string;
  templateId: string;
  templateData: Record<string, unknown>;
  generatedFileUrl: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  errorMessage: string | null;
  generatedAt: Date | null;
  createdAt: Date;
}
```

## 4.4 Listing Models

```typescript
// packages/shared/src/types/listing.ts

export interface ListingDraft {
  id: string;
  agentId: string;
  propertyType: 'apartment' | 'villa' | 'office' | 'land';
  location: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  price: number | null;
  description: string | null;
  photoUrls: string[];
  status: 'draft' | 'ready' | 'uploaded';
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingUpload {
  id: string;
  listingDraftId: string;
  agentId: string;
  externalListingId: string | null;
  uploadedAt: Date;
  status: 'pending' | 'success' | 'failed';
  errorMessage: string | null;
}

export interface ListingUploadAttempt {
  id: string;
  listingId: string;
  attemptTimestamp: Date;
  status: 'success' | 'failed';
  errorMessage: string | null;
  apiResponse: Record<string, unknown> | null;
  attemptNumber: number;
}
```

## 4.5 Calculator Models

```typescript
// packages/shared/src/types/calculator.ts

export interface Calculator {
  id: string;
  name: string;
  description: string;
  formula: string;                  // JavaScript expression
  inputFields: CalculatorField[];
  outputFormat: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalculatorField {
  name: string;
  label: string;
  type: 'number' | 'percentage' | 'currency';
  required: boolean;
  defaultValue?: number;
}

export interface CalculatorHistory {
  id: string;
  agentId: string;
  calculatorId: string;
  inputs: Record<string, number>;
  result: number;
  calculatedAt: Date;
}
```

## 4.6 Email Models

```typescript
// packages/shared/src/types/email.ts

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyTemplate: string;             // Handlebars template
  category: 'follow_up' | 'listing_promotion' | 'contract_reminder' | 'other';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailLog {
  id: string;
  agentId: string;
  templateId: string | null;
  recipient: string;
  subject: string;
  body: string;
  status: 'scheduled' | 'sent' | 'failed';
  sentAt: Date | null;
  scheduledFor: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface EmailForward {
  id: string;
  agentId: string;
  fromAddress: string;
  forwardToAddress: string;
  isActive: boolean;
  createdAt: Date;
}
```

---
