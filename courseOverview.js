// CourseOverview.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CourseOverview = ({ instructorId }) => {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/courses', {
          params: { instructorId },
        });
        setCourses(response.data);
      } catch (err) {
        setError('Failed to load courses');
      }
    };

    fetchCourses();
  }, [instructorId]);

  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Course Overview</h2>
      <ul>
        {courses.map((course) => (
          <li key={course._id}>
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <small>Created on: {new Date(course.createdDate).toLocaleDateString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseOverview;
