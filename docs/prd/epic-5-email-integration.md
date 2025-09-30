# Epic 5: Email Integration

**Epic Goal:** Extend Sophia's capabilities to email management by integrating Gmail API for sophia@zyprus.com workspace account, enabling agents to send and forward emails conversationally via WhatsApp. This epic transforms Sophia from an internal productivity tool to a client-facing communication assistant, allowing agents to handle email correspondence without switching applications or devices.

## Story 5.1: Gmail API Setup & OAuth Configuration

As a **developer**,
I want **Gmail API enabled and OAuth 2.0 configured for sophia@zyprus.com account**,
so that **Sophia can send and manage emails programmatically with proper authorization**.

### Acceptance Criteria

1. Gmail API enabled in Google Cloud Console for the project
2. OAuth 2.0 credentials created (Client ID and Client Secret) for service account access
3. sophia@zyprus.com workspace account granted necessary permissions for API access
4. OAuth consent screen configured with appropriate scopes: `gmail.send`, `gmail.modify`, `gmail.readonly`
5. Service account credentials stored securely in Vercel environment variables
6. Gmail API client library (Node.js) installed and configured
7. Successful test authentication and token generation
8. Token refresh logic implemented to handle expired tokens automatically

## Story 5.2: Email Database Schema & Logging

As a **developer**,
I want **database schema to log email sends and track email activity**,
so that **email communications are auditable and agents can reference sent emails**.

### Acceptance Criteria

1. `emails` table created with schema: `id` (UUID), `agent_id` (UUID FK), `recipient` (text), `cc` (text array), `bcc` (text array), `subject` (text), `body` (text), `sent_at` (timestamp), `gmail_message_id` (text), `status` (text), `error_message` (text)
2. Email status enum: `draft`, `sending`, `sent`, `failed`
3. `email_forwards` table tracks forwarded emails: `id` (UUID), `original_message_id` (text), `forwarded_to` (text), `agent_id` (UUID FK), `forwarded_at` (timestamp)
4. Database indexes on: `emails.agent_id`, `emails.sent_at`, `emails.status`, `emails.recipient`
5. RLS policies ensure agents see only their own email logs
6. Migration scripts committed for reproducible schema
7. Email body storage considers privacy/GDPR (optional: store hashed reference instead of full body)

## Story 5.3: Send Email via Conversational Interface

As an **agent**,
I want **to send emails to clients conversationally via WhatsApp**,
so that **I can handle client correspondence without switching to email applications**.

### Acceptance Criteria

1. AI recognizes email send requests: "send email to john@example.com", "email the property details to my client"
2. Conversation collects required fields: recipient email, subject, body
3. Agent can provide CC/BCC recipients: "also CC my manager at manager@zyprus.com"
4. AI extracts email addresses from natural language: "send to john" (if john's contact info in system) or requires full email
5. Email body can be drafted conversationally: AI asks "What should the email say?" and agent provides content
6. AI confirms email before sending: "Send email to john@example.com with subject 'Property Inquiry' and body [first 100 chars]... ?"
7. Email sent from sophia@zyprus.com with agent's name in signature
8. Confirmation sent to agent: "✉️ Email sent successfully to john@example.com"
9. Failed sends reported with error: "❌ Failed to send email: [reason]"

## Story 5.4: Forward Email Functionality

As an **agent**,
I want **to forward emails to clients or colleagues via Sophia**,
so that **I can quickly share information without manual email forwarding**.

### Acceptance Criteria

1. AI recognizes forward requests: "forward this email to client@example.com", "send this to my colleague"
2. Agent provides or references the original email (by subject, sender, or recent context)
3. Sophia retrieves original email from Gmail inbox (if available) or uses agent-provided content
4. Forward includes original email content with standard forward formatting: "---------- Forwarded message ---------"
5. Agent can add additional message/context: "forward with a note saying 'please review'"
6. Confirmation before sending: "Forward email from [sender] about [subject] to [recipient]?"
7. Email forwarded from sophia@zyprus.com
8. Forward logged to `email_forwards` table
9. Confirmation sent to agent: "✉️ Email forwarded successfully to client@example.com"

## Story 5.5: Email Templates & Quick Responses

As a **product owner**,
I want **common email templates available for quick sending**,
so that **agents can send standardized emails efficiently**.

### Acceptance Criteria

1. Email templates stored in database similar to document templates: `email_templates` table with `id`, `name`, `subject_template`, `body_template`, `variables`
2. At least 3 common email templates pre-loaded:
   - Property Inquiry Response
   - Viewing Appointment Confirmation
   - Follow-up After Viewing
3. Agent can request email template: "send property inquiry email to client@example.com"
4. AI identifies template and collects required variables (property address, viewing time, etc.)
5. Template populated with variables and preview shown to agent
6. Agent can modify template before sending: "change the viewing time to 3pm"
7. Templates support same variable substitution as document templates
8. Template-based emails logged with template reference for analytics

## Story 5.6: Email Sending Error Handling & Retry

As a **developer**,
I want **robust error handling for Gmail API failures**,
so that **email send failures are handled gracefully with retry logic**.

### Acceptance Criteria

1. Common Gmail API errors handled:
   - Authentication failure → "Unable to access email account. Please contact support."
   - Invalid recipient → "Email address [email] is invalid. Please check and try again."
   - Rate limit exceeded → "Too many emails sent. Please try again in a few minutes."
   - Network timeout → Automatic retry (max 3 attempts)
2. Transient errors automatically retried with exponential backoff
3. Permanent errors (invalid recipient, authentication) not retried
4. Agent can manually retry failed emails: "retry email to client@example.com"
5. All send attempts logged to database with status and error details
6. Failed emails remain in `failed` status for troubleshooting
7. Error notifications clear and actionable
8. All errors logged with full context for debugging

## Story 5.7: Email Activity History & Retrieval

As an **agent**,
I want **to see my recent email activity via Sophia**,
so that **I can verify emails were sent and reference previous correspondence**.

### Acceptance Criteria

1. Agent can request email history: "show my recent emails", "what emails did I send today?"
2. System retrieves last 10-20 emails from `emails` table for requesting agent
3. Each email displayed with: recipient, subject, timestamp, status
4. Status indicated with emojis: ✉️ sent, ⏳ sending, ❌ failed
5. Agent can request specific email details: "show me the email I sent to john@example.com yesterday"
6. Email body displayed on request (truncated to first 200 characters with option to see full content)
7. History retrieval completes in <500ms
8. Privacy ensured: agents see only emails they sent via Sophia (RLS enforcement)

## Story 5.8: Email Address Validation & Contact Management

As a **developer**,
I want **email address validation and optional contact storage**,
so that **invalid emails are rejected and agents can use contact shortcuts**.

### Acceptance Criteria

1. Email address format validation (RFC 5322 standard)
2. Basic domain validation (MX record check optional for MVP)
3. Invalid emails rejected with clear guidance: "john@example is not a valid email address. Did you mean john@example.com?"
4. Optional: `contacts` table stores frequently used contacts: `id`, `agent_id`, `name`, `email`, `relationship` (client/colleague/vendor)
5. Agent can reference contacts by name: "send email to john" → resolved to john@example.com from contacts
6. Multiple matches prompt clarification: "I found 2 contacts named John. Did you mean John Smith (john.smith@example.com) or John Doe (john.doe@example.com)?"
7. Contact storage optional for MVP (can defer to post-MVP if complexity too high)
8. Validation errors logged for improving recognition patterns
