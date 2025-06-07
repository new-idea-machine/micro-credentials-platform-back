import mongoose from 'mongoose';
import Course from './courseSchema.js';

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/testdb', { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Course Schema Validation', () => {
  test('Should save a course with valid data', async () => {
    const course = new Course({
      title: 'Introduction to Programming',
      code: 'CS101',
      prerequisites: ['CS100'],
      enrollment: ['user1', 'user2'],
      reviews: [{ reviewerName: 'John Doe', rating: 5, comment: 'Great course!' }],
    });

    const savedCourse = await course.save();
    expect(savedCourse._id).toBeDefined();
    expect(savedCourse.title).toBe('Introduction to Programming');
  });

  test('Should fail validation for invalid prerequisites', async () => {
    const course = new Course({
      title: 'Invalid Course',
      code: 'INVALID',
      prerequisites: [123], // Invalid prerequisite (not a string)
    });

    await expect(course.save()).rejects.toThrow();
  });

  test('Should fail validation for invalid reviews', async () => {
    const course = new Course({
      title: 'Another Course',
      code: 'CS102',
      reviews: [{ reviewerName: 'Alice', rating: 6 }], // Invalid rating
    });

    await expect(course.save()).rejects.toThrow();
  });
});
