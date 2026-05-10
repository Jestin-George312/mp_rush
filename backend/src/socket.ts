import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import pool from './config/db';
import logger from './utils/logger';

let io: Server;
const userTypingStatus: Map<number, Set<number>> = new Map(); // groupId -> Set of userIds

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    // Authentication middleware for sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as { id: number; role: string };
            socket.data.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const user = socket.data.user;
        logger.info(`Socket connected: ${user.id} (${user.role})`);

        // User personal room (for direct notifications)
        socket.join(`user_${user.id}`);

        // Join a group chat
        socket.on('join_group', async (groupId: number) => {
            try {
                // Verify access
                let hasAccess = false;
                if (user.role === 'student') {
                    const check = await pool.query('SELECT 1 FROM group_members WHERE group_id = $1 AND student_id = $2', [groupId, user.id]);
                    hasAccess = check.rows.length > 0;
                } else if (user.role === 'guide') {
                    const check = await pool.query('SELECT 1 FROM groups WHERE id = $1 AND guide_id = $2', [groupId, user.id]);
                    hasAccess = check.rows.length > 0;
                } else if (user.role === 'coordinator' || user.role === 'admin') {
                    hasAccess = true;
                }

                if (!hasAccess) {
                    socket.emit('error', { message: 'Access denied to this group' });
                    return;
                }

                socket.join(`group_${groupId}`);
                
                // Get user info for presence
                const profile = await pool.query('SELECT full_name FROM profiles WHERE u_id = $1', [user.id]);
                const userName = profile.rows[0]?.full_name || 'User';

                // Broadcast user joined
                io.to(`group_${groupId}`).emit('user_joined', {
                    userId: user.id,
                    userName,
                    role: user.role,
                    timestamp: new Date(),
                });

                logger.info(`User ${user.id} joined group_${groupId}`);
            } catch (error) {
                logger.error('Socket join_group error:', error);
                socket.emit('error', { message: 'Failed to join group' });
            }
        });

        // Leave a group chat
        socket.on('leave_group', async (groupId: number) => {
            try {
                socket.leave(`group_${groupId}`);
                
                // Clear typing status
                if (userTypingStatus.has(groupId)) {
                    userTypingStatus.get(groupId)?.delete(user.id);
                }

                // Get user info
                const profile = await pool.query('SELECT full_name FROM profiles WHERE u_id = $1', [user.id]);
                const userName = profile.rows[0]?.full_name || 'User';

                // Broadcast user left
                io.to(`group_${groupId}`).emit('user_left', {
                    userId: user.id,
                    userName,
                    timestamp: new Date(),
                });

                logger.info(`User ${user.id} left group_${groupId}`);
            } catch (error) {
                logger.error('Socket leave_group error:', error);
            }
        });

        // Send message
        socket.on('send_message', async (data: { group_id: number; text: string }) => {
            try {
                const { group_id, text } = data;

                // Validate message
                if (!text || text.trim().length === 0) {
                    socket.emit('error', { message: 'Message cannot be empty' });
                    return;
                }

                // Save message to DB
                const result = await pool.query(
                    `INSERT INTO messages (group_id, sender_id, text, created_at) 
                     VALUES ($1, $2, $3, NOW()) RETURNING id, group_id, sender_id, text, created_at`,
                    [group_id, user.id, text.trim()]
                );

                // Get sender info
                const profile = await pool.query('SELECT full_name FROM profiles WHERE u_id = $1', [user.id]);
                const message = {
                    id: result.rows[0].id,
                    group_id: result.rows[0].group_id,
                    sender_id: result.rows[0].sender_id,
                    text: result.rows[0].text,
                    created_at: result.rows[0].created_at,
                    sender_name: profile.rows[0]?.full_name || 'User',
                    role: user.role,
                };

                // Clear typing status
                if (userTypingStatus.has(group_id)) {
                    userTypingStatus.get(group_id)?.delete(user.id);
                }

                // Broadcast message to group
                io.to(`group_${group_id}`).emit('new_message', message);

                // Notify that user stopped typing
                io.to(`group_${group_id}`).emit('user_stopped_typing', { userId: user.id });

                logger.info(`Message from ${user.id} to group_${group_id}`);
            } catch (error) {
                logger.error('Socket send_message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicator - user started typing
        socket.on('typing_start', async (groupId: number) => {
            try {
                // Initialize typing status for group if not exists
                if (!userTypingStatus.has(groupId)) {
                    userTypingStatus.set(groupId, new Set());
                }
                userTypingStatus.get(groupId)?.add(user.id);

                // Get user name
                const profile = await pool.query('SELECT full_name FROM profiles WHERE u_id = $1', [user.id]);
                const userName = profile.rows[0]?.full_name || 'User';

                // Broadcast typing indicator
                socket.to(`group_${groupId}`).emit('user_typing', {
                    userId: user.id,
                    userName,
                    role: user.role,
                });
            } catch (error) {
                logger.error('Socket typing_start error:', error);
            }
        });

        // Typing indicator - user stopped typing
        socket.on('typing_stop', (groupId: number) => {
            try {
                // Remove from typing status
                if (userTypingStatus.has(groupId)) {
                    userTypingStatus.get(groupId)?.delete(user.id);
                }

                // Broadcast stopped typing
                io.to(`group_${groupId}`).emit('user_stopped_typing', {
                    userId: user.id,
                });
            } catch (error) {
                logger.error('Socket typing_stop error:', error);
            }
        });

        // Disconnect
        socket.on('disconnect', async () => {
            try {
                // Clean up typing status
                userTypingStatus.forEach((userIds) => {
                    userIds.delete(user.id);
                });

                logger.info(`Socket disconnected: ${user.id}`);
            } catch (error) {
                logger.error('Socket disconnect error:', error);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
