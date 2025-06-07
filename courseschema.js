import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to instructor
  prerequisites: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    default: [],
  },
  enrollment: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  },
  reviews: [
    {
      reviewerName: { type: String, required: true, trim: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, default: '', trim: true },
    },
  ],
});

// Indexing for performance
courseSchema.index({ code: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;
