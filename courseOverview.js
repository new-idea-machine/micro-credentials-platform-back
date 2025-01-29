import Course from './courseSchema.js';
import mongoose from 'mongoose';

async function getAllCourses(req, res) {
  try {
    const { page = 1, limit = 10, sortBy = 'title', sortOrder = 'asc', title, instructorId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Build query based on filters
    const query = {};
    if (title) query.title = new RegExp(title, 'i'); // Case-insensitive search
    if (instructorId) query.instructorId = instructorId;

    const courses = await Course.find(query).sort(sort).skip(skip).limit(Number(limit)).lean();
    const totalCourses = await Course.countDocuments(query);

    if (courses.length === 0) {
      return res.status(404).json({ msg: 'No courses found' });
    }

    res.json({
      totalCourses,
      totalPages: Math.ceil(totalCourses / Number(limit)),
      currentPage: Number(page),
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
      return res.status(404).json({ msg: `Course with ID ${courseId} not found` });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    res.status(500).json({ error: 'Failed to fetch course by ID' });
  }
}

export { getAllCourses, getCourseById };
