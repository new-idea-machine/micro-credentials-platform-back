import { getAllCourses, getCourseById } from './courseOverview.js';
import Course from './courseSchema.js'; // Mock this
import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';

// Mock Mongoose methods
jest.mock('./courseSchema.js');

describe('Course Overview - Controller Tests', () => {
  // Test for getAllCourses
  describe('getAllCourses', () => {
    test('should fetch paginated courses successfully', async () => {
      // Arrange
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

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/courses',
        query: { page: 1, limit: 2, sortBy: 'title', sortOrder: 'asc' },
      });
      const res = httpMocks.createResponse();

      // Act
      await getAllCourses(req, res);

      // Assert
      const data = res._getJSONData();
      expect(res.statusCode).toBe(200);
      expect(data.totalCourses).toBe(mockTotalCount);
      expect(data.totalPages).toBe(1);
      expect(data.courses).toEqual(mockCourses);
    });

    test('should handle server error gracefully', async () => {
      // Arrange
      Course.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/courses',
      });
      const res = httpMocks.createResponse();

      // Act
      await getAllCourses(req, res);

      // Assert
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'Failed to fetch courses' });
    });
  });

  // Test for getCourseById
  describe('getCourseById', () => {
    test('should fetch a course by ID successfully', async () => {
      // Arrange
      const mockCourse = {
        _id: mongoose.Types.ObjectId(),
        title: 'Math 101',
        code: 'MATH101',
        description: 'Basic Math',
      };

      Course.findById.mockResolvedValue(mockCourse);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: `/courses/${mockCourse._id}`,
        params: { id: mockCourse._id },
      });
      const res = httpMocks.createResponse();

      // Act
      await getCourseById(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(mockCourse);
    });

    test('should return 404 if course is not found', async () => {
      // Arrange
      Course.findById.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: `/courses/invalid-id`,
        params: { id: 'invalid-id' },
      });
      const res = httpMocks.createResponse();

      // Act
      await getCourseById(req, res);

      // Assert
      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({ error: 'Course not found' });
    });

    test('should handle server error gracefully', async () => {
      // Arrange
      Course.findById.mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = httpMocks.createRequest({
        method: 'GET',
        url: `/courses/invalid-id`,
        params: { id: 'invalid-id' },
      });
      const res = httpMocks.createResponse();

      // Act
      await getCourseById(req, res);

      // Assert
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'Failed to fetch course by ID' });
    });
  });
});
