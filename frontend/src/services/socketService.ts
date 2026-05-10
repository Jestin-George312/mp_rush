import io, { Socket } from 'socket.io-client';

export interface Message {
  id: number;
  group_id: number;
  sender_id: number;
  sender_name: string;
  role: string;
  text: string;
  created_at: string;
}

export interface TypingUser {
  userId: number;
  userName: string;
  role: string;
}

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private messageListeners: ((message: Message) => void)[] = [];
  private typingListeners: ((users: TypingUser[]) => void)[] = [];
  private userJoinedListeners: ((data: any) => void)[] = [];
  private userLeftListeners: ((data: any) => void)[] = [];
  private currentGroupId: number | null = null;
  private typingUsers: Map<number, { [key: number]: TypingUser }> = new Map();

  /**
   * Initialize socket connection
   */
  initialize(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.token = token;
      const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      this.socket = io(serverUrl, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      this.setupMessageListeners();
    });
  }

  /**
   * Setup all incoming socket event listeners
   */
  private setupMessageListeners() {
    if (!this.socket) return;

    // New message received
    this.socket.on('new_message', (message: Message) => {
      this.messageListeners.forEach((callback) => callback(message));
    });

    // User is typing
    this.socket.on('user_typing', (data: TypingUser) => {
      const groupId = this.currentGroupId;
      if (!groupId) return;

      if (!this.typingUsers.has(groupId)) {
        this.typingUsers.set(groupId, {});
      }
      this.typingUsers.get(groupId)![data.userId] = data;
      this.notifyTypingListeners();
    });

    // User stopped typing
    this.socket.on('user_stopped_typing', (data: { userId: number }) => {
      const groupId = this.currentGroupId;
      if (!groupId) return;

      if (this.typingUsers.has(groupId)) {
        delete this.typingUsers.get(groupId)![data.userId];
      }
      this.notifyTypingListeners();
    });

    // User joined group
    this.socket.on('user_joined', (data) => {
      this.userJoinedListeners.forEach((callback) => callback(data));
    });

    // User left group
    this.socket.on('user_left', (data) => {
      this.userLeftListeners.forEach((callback) => callback(data));
    });
  }

  /**
   * Notify all typing listeners
   */
  private notifyTypingListeners() {
    const groupId = this.currentGroupId;
    if (!groupId) return;

    const typingUsersList = Object.values(this.typingUsers.get(groupId) || {});
    this.typingListeners.forEach((callback) => callback(typingUsersList));
  }

  /**
   * Join a group chat
   */
  joinGroup(groupId: number) {
    if (!this.socket) return;
    this.currentGroupId = groupId;
    this.socket.emit('join_group', groupId);
    
    // Clear typing users when joining new group
    if (this.typingUsers.has(groupId)) {
      this.typingUsers.get(groupId)!);
    } else {
      this.typingUsers.set(groupId, {});
    }
  }

  /**
   * Leave a group chat
   */
  leaveGroup(groupId: number) {
    if (!this.socket) return;
    this.socket.emit('leave_group', groupId);
    this.typingUsers.delete(groupId);
    this.currentGroupId = null;
  }

  /**
   * Send a message
   */
  sendMessage(groupId: number, text: string) {
    if (!this.socket) return;
    this.socket.emit('send_message', {
      group_id: groupId,
      text,
    });
  }

  /**
   * Notify that user started typing
   */
  startTyping(groupId: number) {
    if (!this.socket) return;
    this.socket.emit('typing_start', groupId);
  }

  /**
   * Notify that user stopped typing
   */
  stopTyping(groupId: number) {
    if (!this.socket) return;
    this.socket.emit('typing_stop', groupId);
  }

  /**
   * Subscribe to new messages
   */
  onMessage(callback: (message: Message) => void) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Subscribe to typing indicators
   */
  onTyping(callback: (users: TypingUser[]) => void) {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Subscribe to user joined events
   */
  onUserJoined(callback: (data: any) => void) {
    this.userJoinedListeners.push(callback);
    return () => {
      this.userJoinedListeners = this.userJoinedListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Subscribe to user left events
   */
  onUserLeft(callback: (data: any) => void) {
    this.userLeftListeners.push(callback);
    return () => {
      this.userLeftListeners = this.userLeftListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
