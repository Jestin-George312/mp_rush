# Real-Time Chat Implementation Checklist

## ✅ BACKEND SETUP

### 1. Environment Variables
- [ ] Add `CLIENT_URL` to `.env`
- [ ] Verify `JWT_SECRET` is set
- [ ] Verify `PORT` is set (default: 5000)

### 2. Database
- [ ] Run the SQL migration to create `messages` table
```sql
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
```

### 3. Backend Files - Already Updated ✅
- [x] `backend/src/socket.ts` - Enhanced with typing indicators
- [x] `backend/src/modules/communication/comms.routes.ts` - Added new endpoints
- [x] `backend/src/modules/communication/comms.controller.ts` - Added API handlers
- [ ] Verify `backend/src/server.ts` still has `initSocket(server)` call

### 4. Backend Dependencies - Already Installed ✅
- [x] `socket.io` (check package.json)
- [x] `jsonwebtoken` (for JWT auth)
- [x] `pg` (database client)

### 5. Test Backend Socket Connection
```bash
cd backend
npm start
# Should see: 🚀 APMS Server running on http://localhost:5000
```

---

## ✅ FRONTEND SETUP

### 1. Environment Variables
- [ ] Create `.env.local` in frontend folder with:
```env
VITE_API_URL=http://localhost:5000
```

### 2. Frontend Files - Created ✅
- [x] `frontend/src/services/socketService.ts` - Socket.io client service
- [x] `frontend/src/components/ChatComponent.tsx` - Chat UI component
- [x] `frontend/src/pages/examples/ChatIntegrationExample.tsx` - Usage examples

### 3. Frontend Dependencies - Already Installed ✅
- [x] `socket.io-client` (check package.json)
- [x] `axios` (HTTP requests)
- [x] `react` (React framework)

### 4. Initialize Socket in App Component
- [ ] Import socketService in your main App.tsx
- [ ] Call `socketService.initialize(token)` after user logs in
- [ ] Example:
```typescript
import socketService from './services/socketService';

function App() {
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      socketService.initialize(token);
    }
    return () => socketService.disconnect();
  }, []);

  return (/* your app */);
}
```

### 5. Add Chat Component to Pages
- [ ] Choose integration pattern:
  - Option 1: Sidebar chat (see ChatIntegrationExample.tsx)
  - Option 2: Modal/popup chat
  - Option 3: Full-page chat
- [ ] Import ChatComponent in your group/project page
- [ ] Pass required props: `groupId`, `currentUserId`, `currentUserRole`
- [ ] Example:
```tsx
<ChatComponent
  groupId={123}
  currentUserId={user.id}
  currentUserRole={user.role}
/>
```

### 6. Test Frontend Socket Connection
```bash
cd frontend
npm run dev
# Should see app running on http://localhost:5173
# Open browser console (F12) - should not see socket errors
```

---

## 🧪 TESTING

### 1. Unit Tests
- [ ] Test socket connection with valid token
- [ ] Test socket connection with invalid token
- [ ] Test message sending and receiving
- [ ] Test typing indicators

### 2. Manual Testing
- [ ] Open two browser windows/tabs
- [ ] Log in as two different users
- [ ] Join same group
- [ ] Send messages - verify real-time update
- [ ] Check typing indicators appear
- [ ] Verify messages persist in database
- [ ] Close browser - verify reconnection

### 3. API Testing (Postman/Insomnia)
```
1. GET /api/comms/messages/group/123?page=1&limit=50
   - Add Authorization header: Bearer {token}
   - Should return list of messages

2. GET /api/comms/group/123/details
   - Add Authorization header: Bearer {token}
   - Should return group info and members
```

### 4. Database Testing
```sql
-- Check messages table
SELECT COUNT(*) FROM messages;

-- Check specific group messages
SELECT * FROM messages WHERE group_id = 123 ORDER BY created_at DESC LIMIT 10;

-- Check message with user details
SELECT m.*, u.email, p.full_name 
FROM messages m
JOIN users u ON m.sender_id = u.id
LEFT JOIN profiles p ON u.id = p.u_id
WHERE m.group_id = 123
ORDER BY m.created_at DESC;
```

---

## 📝 API ENDPOINTS CREATED

### New Endpoints
1. `GET /api/comms/messages/group/:groupId?page=1&limit=50`
   - Fetch paginated chat history
   - Requires: JWT token

2. `GET /api/comms/group/:groupId/details`
   - Get group info and members
   - Requires: JWT token

---

## 🔒 SECURITY VERIFICATION

- [ ] JWT token required for socket connection
- [ ] Users can only join groups they're in
- [ ] Users can only see messages from their groups
- [ ] CORS configured correctly
- [ ] No sensitive data in client-side storage (except token)
- [ ] Messages stored securely in database

---

## 📚 DOCUMENTATION CREATED

- [ ] `SOCKET_IO_SETUP_GUIDE.md` - Basic overview
- [ ] `SOCKET_IO_COMPLETE_SETUP.md` - Detailed setup guide
- [ ] `ChatIntegrationExample.tsx` - Code examples

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Update `CLIENT_URL` in backend .env
- [ ] Update `VITE_API_URL` in frontend .env.local
- [ ] Set strong `JWT_SECRET`
- [ ] Enable HTTPS/WSS (WebSocket Secure)
- [ ] Test on production environment
- [ ] Set up monitoring/logging
- [ ] Backup database
- [ ] Run database migration on production
- [ ] Clear browser cache

---

## 🆘 COMMON ISSUES & SOLUTIONS

### Socket Connection Fails
```
❌ Error: Authentication error
✅ Solution: Verify JWT token is valid and not expired

❌ Error: CORS error
✅ Solution: Check CLIENT_URL matches frontend URL in .env

❌ Error: Connection refused
✅ Solution: Verify backend is running on correct port
```

### Messages Not Appearing
```
❌ Messages not showing up
✅ Check:
   1. Network tab - see message event?
   2. Database - message in table?
   3. Console - any errors?
   4. User permissions - in same group?
```

### Typing Indicators Not Working
```
❌ Typing indicator not showing
✅ Check:
   1. typing_start event being sent?
   2. onTyping callback registered?
   3. Socket connected?
   4. No console errors?
```

---

## ✨ NEXT STEPS

After basic chat works:

1. **Add Features**
   - [ ] File sharing in chat
   - [ ] Message search
   - [ ] Chat notifications
   - [ ] Voice/video call integration

2. **Optimize Performance**
   - [ ] Infinite scroll for messages
   - [ ] Message caching
   - [ ] Lazy load group details

3. **Improve UX**
   - [ ] Read receipts
   - [ ] User online status
   - [ ] Last message preview
   - [ ] Mention notifications

---

## 📞 QUICK REFERENCE

### Key Files
- Backend socket: `backend/src/socket.ts`
- Backend API: `backend/src/modules/communication/comms.controller.ts`
- Frontend service: `frontend/src/services/socketService.ts`
- Frontend component: `frontend/src/components/ChatComponent.tsx`

### Key Commands
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run dev

# Database migration
psql -U postgres -d apms -f migration.sql
```

### Key Environment Variables
```
Backend: CLIENT_URL, JWT_SECRET, PORT, DB_*
Frontend: VITE_API_URL
```

---

**Status**: ✅ Implementation Ready
**Last Updated**: May 4, 2026
**Estimated Setup Time**: 30-45 minutes
