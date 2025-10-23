# 🚀 Claude AI Quick Reference

## Current Status: ✅ ACTIVE

**Provider:** Anthropic (Claude)  
**Model:** claude-3-5-sonnet-20241022  
**Server:** http://localhost:3000  
**Status:** Running with placeholder key

---

## 🔑 Get Your API Key (5 minutes)

1. Visit: https://console.anthropic.com/
2. Sign up (free $5 credits!)
3. Add payment method (required but FREE to start)
4. Create API key
5. Update `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```
6. Restart server (auto-restarts with nodemon)

---

## 🧪 Test Commands (PowerShell)

### Check Status
```powershell
curl http://localhost:3000/chatbot/ai/status
```

### Test Simple Question
```powershell
$body = @{ message = "Bonjour!"; conversationHistory = @() } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/chatbot/ai" -Method Post -Body $body -ContentType "application/json"
```

---

## 💰 Costs

| Model | Per Message | 10K msgs/month |
|-------|-------------|----------------|
| Sonnet (current) | $0.0045 | $45 |
| Haiku (cheaper) | $0.0012 | $12 |

**Free credits:** $5 = ~1,000-5,000 messages

---

## 📁 Key Files

- `BACKEND/services/aiService.js` - Main AI service (Claude)
- `BACKEND/services/aiServiceClaude.js` - Backup copy
- `BACKEND/.env` - API key configuration
- `CLAUDE_MIGRATION_GUIDE.md` - Full documentation
- `CLAUDE_INTEGRATION_SUCCESS.md` - Success report

---

## 🆘 Quick Fixes

**Server not starting?**
```powershell
cd BACKEND
npm install
npm run dev
```

**AI not responding?**
- Check `.env` has real API key (not placeholder)
- Restart server
- Check https://status.anthropic.com/

**Costs too high?**
- Switch to Haiku model in `aiService.js`
- Reduce `max_tokens` from 1024 to 512
- Limit history to 5 messages

---

## 📞 Support

**Claude:** https://docs.anthropic.com/  
**EduManager:** contact@edumanager.com | +212 662 12 7709

---

## ✅ TODO
- [ ] Get real API key
- [ ] Update .env
- [ ] Test live AI responses
- [ ] Monitor usage

*Last updated: October 18, 2025*
