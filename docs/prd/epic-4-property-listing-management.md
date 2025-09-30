# Epic 4: Property Listing Management

**Epic Goal:** Enable agents to create and publish property listings to zyprus.com through conversational WhatsApp interface by implementing a multi-turn listing creation workflow, integrating with zyprus.com API, and automating the listing upload process. This epic delivers the highest-value productivity feature, eliminating desktop dependency for listing creation and dramatically reducing time-to-publish for new properties.

## Story 4.1: Listing Database Schema & Data Models

As a **developer**,
I want **database schema to store property listing data and upload status**,
so that **listing information is persisted and upload workflows can be tracked**.

### Acceptance Criteria

1. `property_listings` table created with schema: `id` (UUID), `agent_id` (UUID FK), `property_name` (text), `location` (text), `price` (numeric), `bedrooms` (integer), `bathrooms` (numeric), `square_footage` (numeric), `features` (jsonb array), `description` (text), `listing_status` (text), `zyprus_listing_id` (text), `created_at` (timestamp), `updated_at` (timestamp), `published_at` (timestamp)
2. Listing status enum: `draft`, `pending_upload`, `uploaded`, `failed`, `published`
3. Features stored as JSON array: `["sea view", "swimming pool", "parking", "balcony"]`
4. `listing_upload_attempts` table tracks upload history: `id` (UUID), `listing_id` (UUID FK), `attempt_timestamp` (timestamp), `status` (text), `error_message` (text), `api_response` (jsonb)
5. Database indexes on: `property_listings.agent_id`, `property_listings.listing_status`, `property_listings.created_at`
6. RLS policies applied to both tables
7. Migration scripts committed for reproducible schema

## Story 4.2: zyprus.com API Discovery & Integration Setup

As a **developer**,
I want **zyprus.com API integration configured with authentication and endpoint documentation**,
so that **Sophia can programmatically create listings on the platform**.

### Acceptance Criteria

1. zyprus.com API documentation reviewed and endpoints identified for: create listing, update listing, get listing status
2. API authentication method determined (API key, OAuth, token-based) and configured in environment variables
3. API client library or HTTP client configured for zyprus.com integration
4. Test API credentials obtained from zyprus.com technical team
5. Successful test API call made to zyprus.com (e.g., health check, list properties, or create test listing)
6. API rate limits documented and respected in implementation
7. Error handling framework defined for common API errors (authentication failed, rate limit exceeded, invalid data, server errors)
8. Integration approach documented including: base URL, authentication headers, required fields, response formats

## Story 4.3: Conversational Listing Creation Workflow

As a **developer**,
I want **multi-turn conversation flow that guides agents through property listing creation**,
so that **agents can provide listing details naturally via WhatsApp without structured forms**.

### Acceptance Criteria

1. AI recognizes listing creation requests: "create a new listing", "add property to zyprus", "list property at 123 Main St"
2. Conversation state tracks: required fields collected, optional fields, current step, listing draft ID
3. AI asks for required fields sequentially: property name, location, price, bedrooms, bathrooms, square footage, features, description
4. Agent can provide multiple fields in single message: "3 bedroom villa in Limassol, 500k, 200sqm"
5. AI extracts structured data from natural language responses (e.g., "500k" → €500,000, "3br" → 3 bedrooms)
6. AI confirms ambiguous inputs: "Did you mean €500,000 or €50,000?" when "50k" could be interpreted differently
7. Agent can skip optional fields: "no special features" or "skip"
8. AI provides summary of collected information before upload: "Property: Luxury Villa, Location: Limassol, Price: €500,000, 3 bed, 2 bath, 200m², Features: sea view, pool. Ready to upload?"

## Story 4.4: Listing Data Validation & Enrichment

As a **developer**,
I want **validation and enrichment of listing data before upload**,
so that **data quality is ensured and common errors are prevented**.

### Acceptance Criteria

1. Required field validation: property name, location, price, bedrooms, bathrooms, square footage
2. Data type validation: price is numeric, bedrooms/bathrooms are positive numbers, square footage is realistic
3. Range validation: price > €0 and < €100M, bedrooms 1-20, bathrooms 1-10, square footage 10-10,000 sqm
4. Location validation: recognizes Cyprus cities/regions (Limassol, Nicosia, Paphos, Larnaca, Famagusta, etc.)
5. Feature standardization: "pool" → "swimming pool", "seaview" → "sea view" (consistent terminology)
6. Description quality check: minimum 20 characters, flag generic descriptions for agent review
7. Validation errors returned with specific guidance: "Price must be between €10,000 and €100,000,000"
8. Draft listing saved to database with status='draft' before validation passes

## Story 4.5: zyprus.com Listing Upload Integration

As a **developer**,
I want **function to upload validated listing data to zyprus.com via API**,
so that **listings created via Sophia appear on zyprus.com platform**.

### Acceptance Criteria

1. Upload function accepts validated listing data and agent authentication credentials
2. Listing data mapped to zyprus.com API format/schema
3. API call made to zyprus.com create listing endpoint with proper authentication
4. Response parsed for: success status, listing ID, error messages
5. Successful upload updates database: `listing_status='uploaded'`, `zyprus_listing_id` populated, `published_at` timestamp set
6. Failed upload logs error to `listing_upload_attempts` table and updates `listing_status='failed'`
7. Retry logic implemented for transient failures (network timeout, temporary server error) - max 3 attempts
8. Upload attempt logged to `listing_upload_attempts` regardless of outcome

## Story 4.6: End-to-End Listing Creation & Upload

As an **agent**,
I want **to create a property listing conversationally via WhatsApp and have it published to zyprus.com**,
so that **I can list properties from the field without desktop access**.

### Acceptance Criteria

1. Agent initiates: "sophia create a new listing"
2. Sophia guides agent through all required fields via multi-turn conversation
3. Agent provides property details: "Luxury villa in Limassol, 3 bed 2 bath, 200sqm, €500k, sea view and pool, modern renovated villa with stunning views"
4. Sophia confirms collected data and asks for upload approval
5. Agent confirms: "yes publish it"
6. Sophia uploads listing to zyprus.com and reports status: "✅ Listing created successfully! Your property 'Luxury Villa' is now live on zyprus.com. Listing ID: #12345"
7. If upload fails, Sophia reports error and offers retry: "❌ Upload failed: [reason]. Would you like me to try again?"
8. Entire workflow completes within 60 seconds (excluding conversation time)
9. Listing visible on zyprus.com platform within 2 minutes of successful upload

## Story 4.7: Listing Status Tracking & Retrieval

As an **agent**,
I want **to check the status of my recent listings**,
so that **I can verify listings were published and troubleshoot failures**.

### Acceptance Criteria

1. Agent can request listing history: "show my recent listings", "what listings did I create today?"
2. System retrieves last 10 listings for requesting agent from `property_listings` table
3. Each listing displayed with: property name, location, price, status, timestamp
4. Status indicated with emojis: ✅ published, ⏳ pending, ❌ failed, 📝 draft
5. Agent can request specific listing details: "show me details for listing #12345"
6. Failed listings show error message and offer retry option
7. Listing retrieval completes in <500ms
8. Privacy ensured: agents see only their own listings (RLS enforcement)

## Story 4.8: Listing Upload Error Handling & Retry

As a **developer**,
I want **robust error handling for listing upload failures with user-friendly messaging**,
so that **agents understand failures and can take corrective action**.

### Acceptance Criteria

1. Common API errors translated to user-friendly messages:
   - Authentication failed → "Unable to authenticate with zyprus.com. Please contact support."
   - Invalid data → "Some listing information is invalid: [specific field errors]"
   - Rate limit exceeded → "Too many requests. Please try again in a few minutes."
   - Server error → "zyprus.com is experiencing issues. Retrying automatically..."
2. Transient errors automatically retried (max 3 attempts with exponential backoff)
3. Permanent errors (authentication, invalid data) not retried automatically
4. Agent can manually retry failed listings: "retry listing #12345"
5. Each retry attempt logged to `listing_upload_attempts` table
6. If all retries fail, listing remains in `failed` status with error details stored
7. Agent notified of final failure with support contact information
8. All errors logged with full context for troubleshooting

## Story 4.9: Listing Conversation Interruption & Resume

As a **developer**,
I want **ability to pause and resume listing creation conversations**,
so that **agents can handle interruptions without losing progress**.

### Acceptance Criteria

1. Agent can pause listing creation: "pause", "hold on", "wait"
2. Partial listing data saved to database with status='draft'
3. Redis conversation state persists for 30 minutes after last activity
4. Agent can resume listing: "continue with the listing", "finish that property listing"
5. Sophia recalls previously collected fields and asks for remaining information
6. Agent can review/modify previously provided fields: "change the price to 450k"
7. If conversation times out (30 min inactivity), draft saved with notification: "I've saved your draft listing. Just ask me to 'resume listing' when you're ready."
8. Multiple draft listings supported (agent can have several in-progress listings)
