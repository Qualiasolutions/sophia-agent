# 🤖 Sophia AI Telegram Bot - Complete Testing Guide

## 🚀 Quick Start Test

1. **Open Telegram** and search for `@Sophia_zyprus_bot`
2. **Send**: `hello`
3. **Expected Response**: Registration prompt asking for your zyprus.com email
4. **Send**: `yourname@zyprus.com` (use your actual agent email)
5. **Expected Response**: Success confirmation and welcome message

---

## 📋 Feature Testing Checklist

### ✅ **1. Registration Flow**
```
📤 Message: "hello"
🔁 Expected: "👋 Welcome to Sophia AI! To get started, please provide your registered email address."

📤 Message: "test@zyprus.com" (use your real email)
🔁 Expected: "✅ Registration successful! Welcome to Sophia AI, [Your Name]!"
```

### ✅ **2. AI Chat Capabilities**
```
📤 Message: "What can you help me with?"
🔁 Expected: List of capabilities (AI assistance, documents, calculators, forwarding)

📤 Message: "Tell me about Cyprus property transfer fees"
🔁 Expected: Detailed explanation of transfer fee structure

📤 Message: "How does capital gains tax work in Cyprus?"
🔁 Expected: Comprehensive capital gains tax information
```

### ✅ **3. Document Generation Tests**

#### **Registration Documents:**
```
📤 Message: "I need a seller registration"
🔁 Expected: Asks for required fields (client name, property details, etc.)

📤 Message: "Generate a standard seller registration for John Doe, property Reg No. 123/456"
🔁 Expected: Complete seller registration document

📤 Message: "Bank property registration for Remu property"
🔁 Expected: Bank property registration with proper Remu branding

📤 Message: "Rental property registration"
🔁 Expected: Landlord/tenant registration form
```

#### **Viewing Forms:**
```
📤 Message: "Create a viewing form"
🔁 Expected: Asks for viewing details (date, client name, property info)

📤 Message: "Standard viewing form for Jane Smith, tomorrow at 15:00"
🔁 Expected: Complete viewing form with proper formatting
```

#### **Marketing Documents:**
```
📤 Message: "Marketing agreement needed"
🔁 Expected: Asks for marketing details (price, duration, terms)

📤 Message: "Social media post for luxury apartment in Limassol"
🔁 Expected: Professional social media content
```

### ✅ **4. Calculator Tests**
```
📤 Message: "Calculate transfer fees for €300,000"
🔁 Expected: Detailed transfer fee breakdown

📤 Message: "Capital gains tax calculator: bought €200k in 2020, selling €350k in 2025"
🔁 Expected: Capital gains tax calculation with explanation

📤 Message: "VAT calculator for €400k apartment, first home"
🔁 Expected: VAT calculation with first-home benefits

📤 Message: "List calculators"
🔁 Expected: Menu of all available calculators
```

### ✅ **5. Message Forwarding Tests**
```
📤 Message: "forward to +35799123456: Client is interested in viewing the property tomorrow"
🔁 Expected: "✅ Message forwarded successfully to +35799123456 via WhatsApp!"

📤 Message: "/forward +35799123456 Please prepare documents for our meeting"
🔁 Expected: Confirmation of successful forwarding
```

### ✅ **6. Error Handling Tests**
```
📤 Message: "forward to invalid-number: test message"
🔁 Expected: "❌ Invalid phone number format"

📤 Message: "invalid-email@domain"
🔁 Expected: "❌ Invalid email format" (during registration)

📤 Message: "Calculate something impossible"
🔁 Expected: Error message or clarification request
```

---

## 🔍 **Advanced Testing Scenarios**

### **Multi-turn Document Generation:**
1. `📤 Message: "seller registration"`
2. `🔁 Expected: Bot asks for client information`
3. `📤 Message: "John Doe"`
4. `🔁 Expected: Bot asks for property details`
5. `📤 Message: "Reg No. 123/456, Tala, Paphos"`
6. `🔁 Expected: Complete document generation

### **Complex Calculator Queries:**
1. `📤 Message: "I'm buying a €500k property in Cyprus, what fees should I expect?"`
2. `🔁 Expected: Comprehensive fee breakdown including transfer fees, VAT, and other costs

### **Document Customization:**
1. `📤 Message: "Create a marketing agreement for €450k property with 5% fee"`
2. `🔁 Expected: Customized marketing agreement with specific terms

---

## 📊 **Success Indicators**

✅ **Working Correctly When:**
- Bot responds within 2-3 seconds
- Registration flow completes successfully
- Documents generate with proper formatting
- Calculators provide accurate results
- WhatsApp forwarding works immediately
- Error messages are helpful and clear

❌ **Needs Attention When:**
- Bot takes more than 10 seconds to respond
- Registration fails with database errors
- Documents have formatting issues
- Calculators return error messages
- Forwarding fails repeatedly

---

## 🚨 **Troubleshooting Common Issues**

### **Bot Not Responding:**
1. Check if you're registered with a valid zyprus.com email
2. Ensure message contains clear intent
3. Try a simple message like "hello" first

### **Document Generation Fails:**
1. Provide all required information in one message
2. Be specific about document type
3. Include property details (registration number, location)

### **Calculator Errors:**
1. Use proper format: "Calculate [type] for [amount]"
2. Include all relevant details (purchase price, sale price, dates)
3. Specify property type when applicable

### **Forwarding Issues:**
1. Use international phone format: +35799123456
2. Include recipient and message in same request
3. Ensure phone number is valid

---

## 🎯 **Pro Tips for Testing**

1. **Be Specific**: Instead of "help me", say "generate a seller registration"
2. **Provide Context**: Include property details when requesting documents
3. **Use Full Sentences**: Complete sentences work better than single words
4. **Test Progressive**: Start with simple requests, then try complex ones
5. **Check Formatting**: Verify generated documents look professional

---

## 📞 **Getting Help**

If you encounter issues during testing:
1. Check this guide first
2. Ensure you're using a valid zyprus.com agent email
3. Try the basic "hello" test to verify bot is responding
4. Test with different message formats if one doesn't work

The bot is designed to be flexible and understand various ways of asking for the same thing!