# Real-Time Chat - Troubleshooting & Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vite)                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Page Component (GroupDetail, ProjectPage, etc.)    │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │         ChatComponent.tsx                  │    │   │
│  │  │  ┌──────────────────────────────────────┐ │    │   │
│  │  │  │  State:                              │ │    │   │
│  │  │  │  - messages[]                        │ │    │   │
│  │  │  │  - typingUsers[]                     │ │    │   │
│  │  │  │  - inputValue                        │ │    │   │
│  │  │  │  - isLoading/isSending              │ │    │   │
│  │  │  │  - groupMembers[]                    │ │    │   │
│  │  │  └──────────────────────────────────────┘ │    │   │
│  │  │                                            │    │   │
│  │  │  Displays: Messages, Typing Indicator,    │    │   │
│  │  │            Input Box, Send Button         │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                      ↓                               │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │     socketService.ts                       │   │   │
│  │  │  ┌──────────────────────────────────────┐  │   │   │
│  │  │  │  Methods:                            │  │   │   │
│  │  │  │  - initialize(token)                │  │   │   │
│  │  │  │  - joinGroup(groupId)               │  │   │   │
│  │  │  │  - sendMessage(groupId, text)       │  │   │   │
│  │  │  │  - startTyping(groupId)             │  │   │   │
│  │  │  │  - onMessage(callback)              │  │   │   │
│  │  │  │  - onTyping(callback)               │  │   │   │
│  │  │  └──────────────────────────────────────┘  │   │   │
│  │  │  Event Emitters:                           │   │   │
│  │  │  - join_group                             │   │   │
│  │  │  - send_message                           │   │   │
│  │  │  - typing_start/stop                      │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                      ↓ (WebSocket)                           │
│              socket.io-client connection                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             ↓ WSS/WS
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Express)                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          socket.ts (Socket.io Server)              │   │
│  │                                                      │   │
│  │  On Connection:                                    │   │
│  │  1. Verify JWT Token                              │   │
│  │  2. Extract user from token                       │   │
│  │  3. Join user_${id} room                          │   │
│  │                                                      │   │
│  │  Event Handlers:                                   │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │ join_group                                   │ │   │
│  │  │ - Verify user access to group               │ │   │
│  │  │ - socket.join(`group_${groupId}`)           │ │   │
│  │  │ - io.to(`group_${groupId}`).emit()          │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │ send_message                                 │ │   │
│  │  │ - Validate input                             │ │   │
│  │  │ - Save to DB (INSERT)                        │ │   │
│  │  │ - Broadcast to group                         │ │   │
│  │  │ - Clear typing status                        │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │ typing_start/stop                            │ │   │
│  │  │ - Broadcast to group                         │ │   │
│  │  │ - Track in userTypingStatus map              │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        comms.controller.ts (API Routes)            │   │
│  │                                                      │   │
│  │  GET /api/comms/messages/group/:groupId            │   │
│  │  - Load message history from DB                    │   │
│  │  - Pagination support                             │   │
│  │  - Return: { messages, pagination }               │   │
│  │                                                      │   │
│  │  GET /api/comms/group/:groupId/details             │   │
│  │  - Load group info & members                       │   │
│  │  - Return: { id, name, guide, members }            │   │
│  └──────────────────────────────────────────────────────┘   │
│                      ↓ (REST API)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│                                                              │
│  messages table:                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ id | group_id | sender_id | text | created_at     │   │
│  │────────────────────────────────────────────────────│   │
│  │ 1  | 123      | 456       | "Hi" | 2026-05-04    │   │
│  │ 2  | 123      | 789       | "Ho" | 2026-05-04    │   │
│  │ 3  | 124      | 456       | "Yo" | 2026-05-04    │   │
│  │ ...                                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  groups table (existing)                                    │
│  group_members table (existing)                             │
│  users table (existing)                                     │
│  profiles table (existing)                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔴 Troubleshooting Guide

### Problem 1: Socket Connection Fails

**Error Message in Console:**
```
Error: Authentication error
WebSocket connection failed
```

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| JWT Token missing/expired | 1. Check `localStorage.getItem('authToken')` exists<br>2. Verify token hasn't expired<br>3. Re-login if needed |
| Wrong CLIENT_URL | Update `CLIENT_URL` in backend .env to match frontend URL |
| Socket.io not initialized | Check `initSocket(server)` called in server.ts |
| CORS misconfigured | Verify `cors` config in socket.ts allows your frontend URL |
| Backend not running | Run `npm start` in backend folder |

**Test Command:**
```javascript
// In browser console
localStorage.getItem('authToken') // Should return a token
```

---

### Problem 2: Messages Not Appearing

**Symptom:** Send message, nothing happens

**Debugging Steps:**

1. **Check Network Activity**
   - Open DevTools → Network tab
   - Filter by "WS" (WebSocket)
   - Send a message
   - Should see `emit` event with message data

2. **Check Backend Logs**
   ```
   Socket send_message error: Error...
   ```
   - Look for errors in terminal

3. **Check Database**
   ```sql
   SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;
   ```
   - Verify message is saved

4. **Check Socket Connection**
   ```javascript
   socketService.isConnected() // Should return true
   ```

**Common Causes:**

| Cause | Fix |
|-------|-----|
| Message is empty | Add validation before sending |
| User not in group | Verify group membership |
| Socket not connected | Initialize socket first |
| Database error | Check table/permissions |
| Group doesn't exist | Use valid group ID |

---

### Problem 3: Typing Indicators Not Showing

**Symptom:** Start typing, other user doesn't see "typing..."

**Solution Checklist:**

- [ ] Is `startTyping()` being called?
  ```javascript
  // Add console log
  console.log('Starting typing...');
  socketService.startTyping(groupId);
  ```

- [ ] Is `onTyping` callback registered?
  ```javascript
  const unsubscribe = socketService.onTyping((users) => {
    console.log('Typing users:', users);
    setTypingUsers(users);
  });
  ```

- [ ] Check component renders typing indicator
  ```jsx
  {typingUsers.length > 0 && (
    <div>Someone is typing...</div>
  )}
  ```

---

### Problem 4: "Access Denied" Error

**Error Message:**
```
Error: Access denied to this group
```

**Causes:**

- User not in group_members table
- User is not the group's guide
- Wrong role/permissions

**Solution:**

```sql
-- Check if user is in group
SELECT * FROM group_members 
WHERE group_id = 123 AND student_id = 456;

-- Check if user is guide
SELECT * FROM groups 
WHERE id = 123 AND guide_id = 456;

-- Add user if missing
INSERT INTO group_members (group_id, student_id) 
VALUES (123, 456);
```

---

### Problem 5: Messages Table Not Found

**Error:**
```
relation "messages" does not exist
```

**Solution:**

1. Create the table:
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

2. Verify:
```sql
SELECT COUNT(*) FROM messages;
```

---

### Problem 6: CORS Error

**Error:**
```
Access to XMLHttpRequest at 'http://localhost:5000' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

**Solution:**

Update backend .env:
```env
CLIENT_URL=http://localhost:5173
```

Or update socket.ts:
```typescript
io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://yourdomain.com"],
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
```

---

### Problem 7: Messages Won't Load (API Error)

**Error when fetching chat history:**
```
GET /api/comms/messages/group/123 400 Bad Request
```

**Solutions:**

1. Verify group ID is valid:
```javascript
console.log('Group ID:', groupId); // Should be a number
```

2. Check Authorization header:
```javascript
const token = localStorage.getItem('authToken');
console.log('Token exists:', !!token);
```

3. Verify endpoint format:
```
// Correct
GET /api/comms/messages/group/123?page=1&limit=50

// Wrong
GET /api/comms/messages/group?groupId=123
```

---

### Problem 8: Performance Issues

**Symptom:** Chat gets slow with many messages

**Solutions:**

1. **Implement Pagination**
   - Load only last 50 messages initially
   - Implement infinite scroll for older messages

2. **Optimize Database**
   - Verify indexes exist
   - Monitor query performance

3. **Reduce Component Re-renders**
   - Use React.memo for MessageList
   - Implement useCallback for handlers

---

## 🔍 Quick Debug Commands

### Browser Console
```javascript
// Check socket connection
import socketService from './services/socketService';
socketService.isConnected()

// Manually send message
socketService.sendMessage(123, 'test')

// Check stored token
localStorage.getItem('authToken')

// Decode JWT (if available)
import jwt_decode from 'jwt-decode';
jwt_decode(localStorage.getItem('authToken'))
```

### Backend Terminal
```bash
# See socket connections
grep "Socket connected" console.log

# View database messages
psql -c "SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;"

# Check for errors
npm start 2>&1 | grep -i error
```

### Database
```sql
-- Check all messages
SELECT COUNT(*) FROM messages;

-- Check specific group
SELECT * FROM messages WHERE group_id = 123;

-- Check user access
SELECT gm.group_id FROM group_members gm WHERE gm.student_id = 456;
SELECT id FROM groups WHERE guide_id = 456;

-- Debug foreign key issues
SELECT * FROM messages m 
LEFT JOIN groups g ON m.group_id = g.id 
WHERE g.id IS NULL;
```

---

## 📊 Performance Monitoring

### Key Metrics to Watch

1. **Socket Connection Time**
   - Should be < 500ms
   - Check Network tab

2. **Message Send Latency**
   - Should be < 100ms
   - Track with timestamps

3. **Database Query Time**
   - Use `EXPLAIN ANALYZE` for queries
   - Optimize slow queries

4. **Memory Usage**
   - Monitor in DevTools
   - Check for memory leaks

### Example Monitoring
```javascript
// Measure send latency
const startTime = performance.now();
socketService.sendMessage(groupId, text);
// When new_message received:
const latency = performance.now() - startTime;
console.log(`Message latency: ${latency}ms`);
```

---

## 🆘 Getting Help

### Check These Files
1. Browser Console (F12) - Client-side errors
2. Backend Terminal - Server logs
3. Database (psql) - Data integrity
4. Network Tab - Request/response details

### Information to Provide When Asking for Help
1. Exact error message
2. Browser console screenshot
3. Backend logs
4. Steps to reproduce
5. Environment (OS, Node version, etc.)

---

## ✅ Verification Checklist

Before considering implementation complete:

- [ ] Socket connects without errors
- [ ] Messages send and appear in real-time
- [ ] Messages persist in database
- [ ] Typing indicators show
- [ ] Users can't access unauthorized groups
- [ ] API endpoints return correct data
- [ ] Works on multiple browsers
- [ ] Works on mobile devices
- [ ] Handles disconnection/reconnection
- [ ] No console errors or warnings

---

## 🚀 Performance Optimization Tips

1. **Message Pagination**
   - Load 50 messages at a time
   - Implement virtual scrolling for thousands of messages

2. **Database Indexing**
   - Indexes already created
   - Consider composite index on (group_id, created_at)

3. **Connection Pooling**
   - Configured in database setup
   - Monitor pool size

4. **Client-Side Caching**
   - Cache group members
   - Cache message history

5. **Compression**
   - Socket.io handles compression
   - Enable gzip in production

---

This completes the troubleshooting guide. Start from Problem 1 and work down until you find your issue!
