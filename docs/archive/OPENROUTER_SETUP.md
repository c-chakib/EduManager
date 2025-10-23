# 🚀 OpenRouter AI - Setup Complete!

**Date:** October 18, 2025  
**Status:** ✅ LIVE & WORKING  
**Provider:** OpenRouter  
**Model:** Claude 3.5 Sonnet

---

## ✅ Current Status

Your EduManager chatbot is now powered by **OpenRouter** using your pro API key!

```json
{
  "configured": true,
  "provider": "OpenRouter",
  "model": "anthropic/claude-3.5-sonnet",
  "fallback": "MongoDB"
}
```

### Test Results ✅

**Question:** "Bonjour, comment ajouter un étudiant dans EduManager?"

**AI Response:** Detailed step-by-step guide in French with:
- ✅ Structured formatting (numbered steps)
- ✅ Emojis (📝 ✅ 😊)
- ✅ Contextual suggestions
- ✅ Professional tone

**Provider:** `openrouter`  
**Model:** `anthropic/claude-3.5-sonnet`  
**Response Source:** AI (not database fallback)

---

## 🔧 Configuration

### Environment Variables (`.env`)

```properties
PORT=3000
NODE_ENV=dev
JWT_SECRET=chakib2025

# OpenRouter AI Configuration (currently active)
OPENROUTER_API_KEY=sk-or-v1-[YOUR_KEY]
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_SITE_URL=http://localhost:3000
```

### Files Modified

1. **`BACKEND/services/aiService.js`**
   - Uses OpenAI SDK with `baseURL: 'https://openrouter.ai/api/v1'`
   - Adds headers: `HTTP-Referer`, `X-Title`
   - Methods: `initializeAI()`, `getAIResponse()`, `getResponse()`, `getStatus()`

2. **`BACKEND/.env`**
   - Added `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_SITE_URL`

3. **`BACKEND/.gitignore`**
   - Added `.env` protection (prevents API key from being committed to Git)

---

## 🎯 Available Models

Switch models by changing `OPENROUTER_MODEL` in `.env`:

### Anthropic (Claude)
- **`anthropic/claude-3.5-sonnet`** ⭐ (current - best quality)
  - Context: 200K tokens
  - Cost: ~$3 input / $15 output per 1M tokens
  - Best for: Complex reasoning, long conversations

- **`anthropic/claude-3.5-haiku`** (faster & cheaper)
  - Context: 200K tokens
  - Cost: ~$0.80 input / $4 output per 1M tokens
  - Best for: Quick responses, high volume

- **`anthropic/claude-3-opus`** (most powerful)
  - Context: 200K tokens
  - Cost: ~$15 input / $75 output per 1M tokens
  - Best for: Mission-critical, complex tasks

### OpenAI (GPT)
- **`openai/gpt-4o`** (latest flagship)
- **`openai/gpt-4o-mini`** (budget-friendly)
- **`openai/gpt-4-turbo`**

### Google (Gemini)
- **`google/gemini-1.5-pro`** (massive context: 2M tokens!)
- **`google/gemini-1.5-flash`** (fast & cheap)

### Meta (Llama)
- **`meta-llama/llama-3.1-405b`** (open-source, powerful)
- **`meta-llama/llama-3.1-70b`**

**Full list:** https://openrouter.ai/models

---

## 🧪 Testing Commands

### Check Status
```powershell
curl http://localhost:3000/chatbot/ai/status
```

Expected:
```json
{"configured":true,"provider":"OpenRouter","model":"anthropic/claude-3.5-sonnet","fallback":"MongoDB"}
```

### Test Simple Message
```powershell
$body = @{ 
  message = "Bonjour!"; 
  conversationHistory = @() 
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/chatbot/ai" `
  -Method Post `
  -Body $body `
  -ContentType "application/json" | 
  Select-Object -ExpandProperty Content
```

### Test Complex Question with Context
```powershell
# First message
$body1 = @{ 
  message = "Comment modifier un étudiant?"; 
  conversationHistory = @() 
} | ConvertTo-Json

$response1 = (Invoke-WebRequest -Uri "http://localhost:3000/chatbot/ai" `
  -Method Post -Body $body1 -ContentType "application/json").Content | 
  ConvertFrom-Json

# Second message with context
$history = @(
  @{ role = "user"; content = "Comment modifier un étudiant?" },
  @{ role = "assistant"; content = $response1.answer }
)

$body2 = @{ 
  message = "Et pour le supprimer?"; 
  conversationHistory = $history 
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:3000/chatbot/ai" `
  -Method Post -Body $body2 -ContentType "application/json" |
  Select-Object -ExpandProperty Content
```

Expected: AI remembers the context and understands "le" refers to the student.

---

## 💰 Cost Management

### Your OpenRouter Pro Account
- ✅ You have a pro version - no free tier limits!
- ✅ Pay-as-you-go pricing
- ✅ Access to all models

### Current Configuration Costs
**Model:** `anthropic/claude-3.5-sonnet`

**Estimated per message:**
- Average input: 350 tokens (system prompt + history + user message)
- Average output: 200 tokens (AI response)
- **Cost per message:** ~$0.0041

**Monthly estimates:**
- 1,000 messages: ~$4.10
- 10,000 messages: ~$41.00
- 100,000 messages: ~$410.00

### Cost Optimization Tips

1. **Switch to Haiku for simple questions**
   ```properties
   OPENROUTER_MODEL=anthropic/claude-3.5-haiku
   ```
   Saves ~75% on costs!

2. **Reduce max_tokens** (currently 1024)
   Edit `aiService.js` line ~105:
   ```javascript
   max_tokens: 512,  // Reduce from 1024
   ```

3. **Limit conversation history** (currently keeps all)
   Already implemented: only last 10 messages sent to API

4. **Use MongoDB fallback for basic questions**
   Already implemented: falls back automatically on AI errors

### Monitor Usage
- Dashboard: https://openrouter.ai/activity
- View costs per model
- Set spending alerts

---

## 🔐 Security

### ✅ Protected
- `.env` file added to `.gitignore`
- API key never logged in full
- Debug logs only show key presence & length

### ⚠️ Important
- **Never commit `.env` to Git**
- **Never share your API key in chat/email**
- **Rotate key if exposed:** https://openrouter.ai/keys

### Check Protection
```powershell
cd BACKEND
git status
```

If `.env` appears in red, it's **NOT** ignored! Run:
```powershell
git rm --cached .env
git add .gitignore
git commit -m "Protect API keys"
```

---

## 🚀 Advanced Features

### 1. Dynamic Model Selection

Edit `aiService.js` to choose model based on question complexity:

```javascript
async getAIResponse(userMessage, conversationHistory = []) {
  // Use Haiku for simple questions
  const isSimple = userMessage.length < 50 && conversationHistory.length === 0;
  const model = isSimple 
    ? 'anthropic/claude-3.5-haiku' 
    : this.model;

  const response = await this.client.chat.completions.create({
    model: model,  // Dynamic!
    // ... rest of config
  });
}
```

### 2. Multiple Providers

Keep backup providers in `.env`:

```properties
# Primary
OPENROUTER_API_KEY=sk-or-v1-...

# Backup (if OpenRouter down)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

Then implement fallback logic in `aiService.js`.

### 3. Streaming Responses

For real-time typing effect:

```javascript
const stream = await this.client.chat.completions.create({
  model: this.model,
  messages,
  stream: true  // Enable streaming!
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  // Send to frontend via WebSocket
}
```

---

## 🆘 Troubleshooting

### Issue: "configured": false

**Solution:**
1. Check `.env` has `OPENROUTER_API_KEY`
2. Restart backend: `npm run dev`
3. Verify key starts with `sk-or-v1-`

### Issue: AI responses are from database

**Cause:** API error or invalid key

**Solution:**
1. Check terminal logs for error messages
2. Verify key at https://openrouter.ai/keys
3. Test status: `curl http://localhost:3000/chatbot/ai/status`

### Issue: "Rate limit exceeded"

**Cause:** Too many requests too fast

**Solution:**
1. OpenRouter has generous limits on pro accounts
2. Check usage: https://openrouter.ai/activity
3. Implement rate limiting in frontend if needed

### Issue: Responses in wrong language

**Cause:** Model ignoring system prompt

**Solution:**
1. Add language instruction to user message:
   ```javascript
   message = `Réponds en français: ${userMessage}`;
   ```

2. Or switch to Claude models (better French support)

### Issue: High costs

**Solution:**
1. Switch to Haiku: `OPENROUTER_MODEL=anthropic/claude-3.5-haiku`
2. Reduce `max_tokens` from 1024 to 512
3. Use MongoDB fallback for FAQ questions
4. Monitor usage dashboard

---

## 📊 Comparison: Before vs After

| Feature | Before (No AI) | After (OpenRouter) |
|---------|----------------|-------------------|
| **Responses** | Static database | Dynamic AI |
| **Context** | None | Full conversation |
| **Languages** | French only | Multilingual |
| **Personalization** | Generic | User-aware |
| **Learning** | Never improves | Uses latest models |
| **Cost** | Free | ~$0.004/message |
| **Quality** | Basic | Professional |

---

## 📞 Support

**OpenRouter:**
- Dashboard: https://openrouter.ai/
- Docs: https://openrouter.ai/docs
- Models: https://openrouter.ai/models
- Activity: https://openrouter.ai/activity
- Discord: https://discord.gg/openrouter

**EduManager:**
- Email: contact@edumanager.com
- Phone: +212 662 12 7709
- Hours: Mon-Fri 9am-6pm

---

## 🎉 Success!

Your chatbot is now powered by OpenRouter's AI marketplace with access to:
- ✅ Claude 3.5 Sonnet (current)
- ✅ GPT-4, Gemini, Llama, and 100+ other models
- ✅ Single API key for all providers
- ✅ Automatic fallback to MongoDB
- ✅ Professional, context-aware responses
- ✅ Cost tracking and optimization

**Next Steps:**
1. Test with real users
2. Monitor costs in dashboard
3. Fine-tune system prompt for your use cases
4. Consider switching to Haiku if volume increases

---

*Integration completed: October 18, 2025*  
*Backend: http://localhost:3000*  
*Status: ✅ All systems operational*
