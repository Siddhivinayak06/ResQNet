import type { Request, Response, NextFunction } from 'express';
import { Department } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';

export const createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, type, description, contactEmail, contactPhone, headquartersLocation, handledCategories } = req.body;

    const newDepartment = await Department.create({
      name,
      type,
      description,
      contactEmail,
      contactPhone,
      headquartersLocation,
      handledCategories,
    });

    res.status(201).json({
      success: true,
      data: newDepartment,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const departments = await Department.find();
    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return next(new AppError('Department not found', 404));
    }

    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};
