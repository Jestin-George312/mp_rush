# Socket.io Real-Time Chat Setup - Complete Guide

## 📋 Prerequisites
- Node.js 14+
- PostgreSQL database
- JWT authentication already set up
- Socket.io already installed in both backend and frontend

## 🔧 Environment Variables (.env)

### Backend (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_NAME=apms

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=7d

# File Upload (if you have file sharing in chat)
UPLOAD_DIR=./uploads
UPLOAD_URL_PREFIX=/uploads
MAX_FILE_SIZE=10485760
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000
VITE_JWT_STORAGE_KEY=authToken
```

## 🗄️ Database Migration

Run this SQL to create the messages table if it doesn't exist:

```sql
-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Verify the table was created
SELECT * FROM information_schema.tables WHERE table_name = 'messages';
```

## 📡 API Endpoints Reference

### Get Chat History
```
GET /api/comms/messages/group/:groupId?page=1&limit=50
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "group_id": 123,
        "sender_id": 456,
        "sender_name": "John Doe",
        "role": "student",
        "text": "Hello everyone!",
        "created_at": "2026-05-04T10:30:00Z"
      },
      ...
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

### Get Group Details
```
GET /api/comms/group/:groupId/details
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "name": "AI Project Group A",
    "guide": {
      "id": 789,
      "name": "Dr. Smith"
    },
    "members": [
      {
        "id": 456,
        "full_name": "John Doe",
        "role": "student",
        "email": "john@example.com"
      },
      ...
    ],
    "memberCount": 5
  }
}
```

## 🔌 Socket Events Reference

### Events: Client → Server

#### `join_group`
```javascript
socketService.joinGroup(groupId);

// What happens:
// - User joins group chat room
// - Previous messages are still needed to be loaded via API
// - User receives real-time updates
```

#### `leave_group`
```javascript
socketService.leaveGroup(groupId);

// What happens:
// - User leaves group chat room
// - Typing indicators are cleared
// - Other users are notified
```

#### `send_message`
```javascript
socketService.sendMessage(groupId, messageText);

// Example:
socketService.sendMessage(123, "Hello everyone!");

// What happens:
// - Message is saved to database
// - Broadcast to all users in group
// - Typing indicator is cleared
```

#### `typing_start`
```javascript
socketService.startTyping(groupId);

// What happens:
// - Notifies other users that this user is typing
// - Shows typing indicator (animated dots)
```

#### `typing_stop`
```javascript
socketService.stopTyping(groupId);

// What happens:
// - Removes typing indicator for this user
// - Called automatically after 3 seconds of inactivity
```

### Events: Server → Client

#### `new_message`
```javascript
socketService.onMessage((message) => {
  console.log('Received message:', message);
  // message = {
  //   id, group_id, sender_id, sender_name, role, text, created_at
  // }
});
```

#### `user_typing`
```javascript
socketService.onTyping((typingUsers) => {
  console.log('Users typing:', typingUsers);
  // typingUsers = [
  //   { userId, userName, role },
  //   ...
  // ]
});
```

#### `user_joined`
```javascript
socketService.onUserJoined((data) => {
  console.log(data.userName + ' joined');
  // data = { userId, userName, role, timestamp }
});
```

#### `user_left`
```javascript
socketService.onUserLeft((data) => {
  console.log(data.userName + ' left');
  // data = { userId, userName, role, timestamp }
});
```

## 💻 Frontend Implementation

### 1. Initialize Socket Service in App Component

```typescript
import { useEffect } from 'react';
import socketService from './services/socketService';

function App() {
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      socketService
        .initialize(token)
        .catch((error) => {
          console.error('Failed to initialize socket:', error);
        });
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    // Your app content
  );
}
```

### 2. Use Chat Component in Your Pages

```typescript
import ChatComponent from './components/ChatComponent';
import { useAuth } from './hooks/useAuth';

function GroupPage({ groupId }) {
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        {/* Group content */}
      </div>
      <div className="md:col-span-1">
        <ChatComponent
          groupId={groupId}
          currentUserId={user.id}
          currentUserRole={user.role}
        />
      </div>
    </div>
  );
}
```

## 🔐 Security Features Implemented

1. **JWT Authentication**: All socket connections require valid JWT token
2. **Access Control**: Users can only chat in groups they belong to
3. **Role-Based Access**: Guides and students have appropriate permissions
4. **Message Persistence**: All messages saved to database
5. **Input Validation**: Empty messages are rejected
6. **CORS Protection**: Configured to only accept requests from allowed origins

## ⚠️ Troubleshooting

### Socket Connection Issues

**Problem**: Socket fails to connect
```
Solution:
1. Check JWT token is valid
2. Verify CLIENT_URL in .env matches frontend URL
3. Check CORS configuration in backend
4. Ensure socket.io server is running on correct port
```

**Problem**: Messages not persisting
```
Solution:
1. Verify messages table exists in database
2. Check foreign keys (group_id, sender_id) exist
3. View backend logs for database errors
```

**Problem**: Typing indicators not showing
```
Solution:
1. Verify onTyping callback is registered
2. Check typingUsers state in component
3. Ensure typing_start/stop events are sent
```

### Performance Issues

**Problem**: Chat becomes slow with many messages
```
Solution:
1. Implement pagination (already done - limit=50)
2. Load older messages on scroll (not implemented yet)
3. Optimize message queries with indexes (already done)
```

## 📈 Future Enhancements

- [ ] Load more messages on scroll (infinite scroll)
- [ ] Message read receipts
- [ ] File/image sharing in chat
- [ ] Message editing and deletion
- [ ] Mention/tagging other users
- [ ] Chat search functionality
- [ ] Voice/video chat integration
- [ ] Message reactions (emoji)
- [ ] Archived chats
- [ ] Chat notifications

## 🚀 Testing Checklist

- [ ] User can connect to socket
- [ ] Messages appear in real-time
- [ ] Messages persist in database
- [ ] Typing indicators show correctly
- [ ] Users can't access unauthorized groups
- [ ] Chat works on multiple devices
- [ ] Socket reconnects on disconnect
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Mobile view works properly

## 📞 Support

For issues or questions:
1. Check backend logs: `npm start` (backend)
2. Check browser console for client-side errors
3. Verify database connection
4. Check network tab in browser DevTools
5. Ensure all .env variables are set correctly
