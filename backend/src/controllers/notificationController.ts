import type { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';

export const createNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, title, body, type, metadata, priority } = req.body;
    const notification = await Notification.create({
      userId,
      title,
      body,
      type,
      metadata: metadata || {},
      priority: priority || 'low',
    });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

export const getUserNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    const notifications = await Notification.find({ userId }).sort('-createdAt').limit(50);
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) throw new AppError('Notification not found', 404, 'NOT_FOUND');
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
