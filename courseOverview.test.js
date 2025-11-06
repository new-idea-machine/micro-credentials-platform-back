import { getAllCourses, getCourseById } from './courseOverview.js';
import Course from './courseSchema.js';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Mock Mongoose methods
jest.mock('./courseSchema.js');

describe('Course Overview - Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCourses', () => {
    test('should fetch paginated courses successfully', async () => {
      const mockCourses = [
        { title: 'Math 101', code: 'MATH101', description: 'Basic Math' },
        { title: 'History 101', code: 'HIST101', description: 'World History' },
      ];
      const mockTotalCount = 2;

      Course.find.mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockCourses),
      }));

      Course.countDocuments.mockResolvedValue(mockTotalCount);

      const req = {
        query: { page: 1, limit: 2, sortBy: 'title', sortOrder: 'asc' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getAllCourses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        totalCourses: mockTotalCount,
        totalPages: 1,
        currentPage: 1,
        courses: mockCourses,
      });
    });

    test('should handle empty result set', async () => {
      Course.find.mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      }));

      Course.countDocuments.mockResolvedValue(0);

      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getAllCourses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        totalCourses: 0,
        totalPages: 0,
        currentPage: 1,
        courses: [],
      });
    });

    test('should handle invalid instructor ID', async () => {
      const req = {
        query: { instructorId: 'invalid-id' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getAllCourses(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid instructor ID format' });
    });

    test('should handle server error', async () => {
      Course.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getAllCourses(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch courses' });
    });
  });

  describe('getCourseById', () => {
    test('should fetch a course by ID successfully', async () => {
      const mockCourse = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Math 101',
        code: 'MATH101',
        description: 'Basic Math',
      };

      Course.findById.mockResolvedValue(mockCourse);

      const req = {
        params: { id: mockCourse._id }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCourse);
    });

    test('should return 404 if course is not found', async () => {
      Course.findById.mockResolvedValue(null);

      const req = {
        params: { id: new mongoose.Types.ObjectId() }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: `Course with ID ${req.params.id} not found` });
    });

    test('should handle invalid course ID format', async () => {
      const req = {
        params: { id: 'invalid-id' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid course ID format' });
    });

    test('should handle server error', async () => {
      Course.findById.mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = {
        params: { id: new mongoose.Types.ObjectId() }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch course by ID' });
    });
  });
});