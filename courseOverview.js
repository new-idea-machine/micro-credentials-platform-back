// courseOverview.js
import Course from './courseSchema.js';
import mongoose from 'mongoose';

// Constants
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_SORT_BY = 'title';
const DEFAULT_SORT_ORDER = 'asc';

async function getAllCourses(req, res) {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      sortBy = DEFAULT_SORT_BY,
      sortOrder = DEFAULT_SORT_ORDER,
      title,
      instructorId,
      code
    } = req.query;

    // Validate and sanitize inputs
    const pageNum = Math.max(Number(page), DEFAULT_PAGE);
    const limitNum = Math.max(Number(limit), 1);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Build safe query
    const query = {};
    if (title) {
      // Simple sanitization - escape regex special characters
      const sanitizedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = new RegExp(sanitizedTitle, 'i');
    }
    if (instructorId) {
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        return res.status(400).json({ error: 'Invalid instructor ID format' });
      }
      query.instructorId = instructorId;
    }
    if (code) {
      const sanitizedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.code = new RegExp(sanitizedCode, 'i');
    }

    const [courses, totalCourses] = await Promise.all([
      Course.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      Course.countDocuments(query)
    ]);

    res.json({
      totalCourses,
      totalPages: Math.ceil(totalCourses / limitNum),
      currentPage: pageNum,
      courses,
    });
  } catch (error) {
    console.error('Error fetching all courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

async function getCourseById(req, res) {
  const { id: courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ error: 'Invalid course ID format' });
  }

  try {
    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ error: `Course with ID ${courseId} not found` });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    res.status(500).json({ error: 'Failed to fetch course by ID' });
  }
}

export { getAllCourses, getCourseById };