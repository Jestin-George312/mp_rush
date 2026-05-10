# Real-Time Chat Implementation Guide (Socket.io)

## What You Need to Do

### 1. **Environment Variables (.env)**
Add these to your `.env` file:
```env
# Socket.io Configuration
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
JWT_SECRET=your_jwt_secret_key

# Database (already configured)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=apms

# Node
NODE_ENV=development
PORT=5000
```

### 2. **Database Schema**
Ensure you have a `messages` table:
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

CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
```

### 3. **Backend Changes Required**
- ✅ Socket.io server already initialized (socket.ts)
- ✅ Authentication middleware already in place
- ✅ Basic message events already implemented
- **NEW:** Create API endpoint for fetching chat history
- **NEW:** Add typing indicators and user online status
- **NEW:** Enhance socket events with more features

### 4. **Frontend Changes Required**
- **NEW:** Install Socket.io client (already in package.json)
- **NEW:** Create Chat service/hook
- **NEW:** Create Chat UI Component
- **NEW:** Handle socket connection and events
- **NEW:** Display messages in real-time

### 5. **API Endpoints Needed**

#### Get Chat History
```
GET /api/comms/messages/:groupId
- Returns: Array of messages with sender info
- Authentication: Required (JWT Token)
- Query Params: ?page=1&limit=50
```

#### Get Group Details
```
GET /api/comms/group/:groupId
- Returns: Group info with members list
- Authentication: Required
```

### 6. **Socket Events**

**Client → Server:**
- `join_group` - Join a group chat
- `leave_group` - Leave a group chat
- `send_message` - Send a message
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `mark_read` - Mark message as read

**Server → Client:**
- `new_message` - Receive new message
- `user_typing` - Someone is typing
- `user_stopped_typing` - Someone stopped typing
- `user_joined` - User joined group
- `user_left` - User left group

### 7. **Implementation Steps**
1. Update `.env` file with Socket.io variables
2. Create/update messages API endpoint in communication routes
3. Enhance socket.ts with typing indicators
4. Create socket service in frontend
5. Create Chat component in frontend
6. Integrate Chat component in group/project pages
7. Test with multiple users

### 8. **Testing Checklist**
- [ ] Users can connect to socket server
- [ ] Messages persist in database
- [ ] Messages display in real-time
- [ ] Typing indicators work
- [ ] Users can join/leave groups
- [ ] Authentication works properly
- [ ] Works in different browsers
- [ ] Handles disconnections gracefully
