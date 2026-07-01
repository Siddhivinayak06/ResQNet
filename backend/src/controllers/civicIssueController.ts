import type { Request, Response, NextFunction } from 'express';
import { CivicIssue } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { getIO } from '../socket/server.js';

export const createCivicIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, description, location, address, severity, imageUrl } = req.body;

    const newIssue = await CivicIssue.create({
      category,
      description,
      location,
      address,
      severity,
      imageUrl,
      reporterId: (req as AuthenticatedRequest).user.id,
      status: 'reported',
    });

    const responseData = newIssue.toJSON();
    getIO().emit('newCivicIssue', responseData);

    res.status(201).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCivicIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issues = await CivicIssue.find().sort({ createdAt: -1 }).populate('reporterId', 'name');
    res.status(200).json({
      success: true,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

export const getCivicIssueById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issue = await CivicIssue.findById(req.params.id)
      .populate('reporterId', 'name')
      .populate('assignedDepartment', 'name type');

    if (!issue) {
      return next(new AppError('Civic issue not found', 404));
    }

    res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCivicIssueStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    
    const issue = await CivicIssue.findById(req.params.id);
    if (!issue) {
      return next(new AppError('Civic issue not found', 404));
    }

    issue.status = status;
    issue.timeline.push({
      timestamp: new Date(),
      action: 'status_updated',
      performedBy: (req as AuthenticatedRequest).user.id as any,
      details: `Status updated to ${status}`,
    });

    if (status === 'resolved') {
      issue.resolvedAt = new Date();
    }

    await issue.save();

    const responseData = issue.toJSON();
    getIO().emit('civicIssueUpdated', responseData);

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export const upvoteCivicIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issue = await CivicIssue.findById(req.params.id);
    if (!issue) {
      return next(new AppError('Civic issue not found', 404));
    }

    const userId = (req as AuthenticatedRequest).user.id as any;
    if (!issue.upvotes.includes(userId)) {
      issue.upvotes.push(userId);
      await issue.save();
    }

    const responseData = issue.toJSON();
    getIO().emit('civicIssueUpdated', responseData);

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return next(new AppError('Comment text is required', 400));
    }

    const issue = await CivicIssue.findById(req.params.id);
    if (!issue) {
      return next(new AppError('Civic issue not found', 404));
    }

    const userId = (req as AuthenticatedRequest).user.id as any;
    
    issue.comments.push({
      user: userId,
      text: text.trim(),
      timestamp: new Date(),
    });

    issue.timeline.push({
      timestamp: new Date(),
      action: 'comment_added',
      performedBy: userId,
      details: 'Added a comment',
    });

    await issue.save();

    const responseData = issue.toJSON();
    getIO().emit('civicIssueUpdated', responseData);

    res.status(201).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};
