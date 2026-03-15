import mongoose from "mongoose";
import dotenv from "dotenv";
import { database, assessmentModel, courseModel, moduleModel, userModel } from "./src/model.js";

// Data for testing

const moduleData = {
  title: "Test Module",
  description: "This is a test module",
  type: "Audio",
  chapters: [
    { title: "Chapter 1", timeIndex: 120 },
    { title: "Chapter 2", timeIndex: 180 }
  ],
  url: "https://example.com/test-module",
  urlAuthentication: { scheme: "https", parameters: "token=123" },
  completed: false
};

const questionData1 = {
  question: "What is the capital of France?",
  options: ["Paris", "Berlin", "Madrid", "London"],
  answer: 0,
  correctOption: 0,
  explanation: "Paris is the capital of France"
};

const questionData2 = {
  question: "Who was the first person to climb Mount Everest?",
  options: ["Alexander the Great", "Mohammad Ali", "Everest", "Edmund Hillary"],
  answer: 3,
  correctOption: 3,
  explanation: "Edmund Hillary was the first person to climb Mount Everest"
};

const assessmentData = {
  title: "Test Assessment",
  questions: [questionData1, questionData2],
  currentQuestion: 1
};

const learnerData = {
  name: "Test Learner User",
  email: `learner_${Date.now()}@test.user`,
  password: "123456789",
  learnerData: { courses: [] }
};

const instructorData = {
  name: "Test Instructor User",
  email: `instructor_${Date.now()}@test.user`,
  password: "123456789",
  learnerData: { courses: [] },
  instructorData: { courses: [] }
};

// Set up the environment
dotenv.config();

// Connect to MongoDB
const MONGO_URL = process.env.MONGO_URL;

beforeAll(async () => {
  const MONGODB_CONNECTED = 1;
  if (database.readyState !== MONGODB_CONNECTED) {
    try {
      await mongoose.connect(MONGO_URL);
      database = mongoose.connection;
      console.log("Connected to MongoDB for testing");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error.message);
      throw error; // Fail the test suite if connection fails
    }
  }
});

afterAll(async () => {
  try {
    // Close the MongoDB connection
    await database.close();
  } catch (error) {
    console.log("Error closing connection: ", error);
  }
});

/*================================================================
Module model tests
================================================================*/
describe("Modules: Insert", () => {
  test("should not validate a Video module with missing Chapters key", async () => {
    // Removing chapters from the module
    const badModuleData = { ...moduleData, type: "Video" };
    delete badModuleData.chapters;
    const module = new moduleModel(badModuleData);
    await expect(module.validate()).rejects.toThrow(/Chapters field/);
  });

  test("should not validate an Audio module with missing Chapters key", async () => {
    // Removing chapters from the module
    const badModuleData = { ...moduleData };
    delete badModuleData.chapters;
    const module = new moduleModel(badModuleData);
    await expect(module.validate()).rejects.toThrow(/Chapters field/);
  });

  test("should not validate a Markdown module with Chapters", async () => {
    const badModuleData = { ...moduleData, type: "Markdown" };
    const module = new moduleModel(badModuleData);
    await expect(module.validate()).rejects.toThrow(/Chapters field cannot be present/);
  });

  test("should validate a new Markdown module with no Chapters", async () => {
    const markdownModuleData = { ...moduleData, type: "Markdown" };
    delete markdownModuleData.chapters;
    const module = new moduleModel(markdownModuleData);
    await expect(module.validate()).resolves;
    expect(module._id).toBeDefined();
    expect(module.type).toBe("Markdown");
    expect(module.chapters).toBeUndefined();
  });

  test("should insert a new Audio module", async () => {
    const module = await new moduleModel(moduleData).save();

    expect(module._id).toBeDefined();
    expect(module.title).toBe("Test Module");
    expect(module.description).toBe("This is a test module");
    expect(module.type).toBe("Audio");
    expect(module.chapters.length).toBe(2);
    expect(module.url).toBe("https://example.com/test-module");
    expect(module.urlAuthentication).toHaveProperty("scheme");
    expect(module.urlAuthentication).toHaveProperty("parameters");
    expect(module.completed).toBe(false);
    expect(module.creationTime).toBeDefined();

    // Delete the saved module
    await moduleModel.deleteOne({ _id: module._id });
  });
});

/*================================================================
Assessment model tests
================================================================*/
describe("Assessment: Validate", () => {
  test("should not validate an assessment with no questions", async () => {
    const assessment = new assessmentModel({
      title: "Empty Assessment",
      questions: []
    });

    await expect(assessment.validate()).rejects.toThrow(/At least one question is required/);
  });

  test("should not validate an assessment with current question out of bounds", async () => {
    const assessment = new assessmentModel({ ...assessmentData, currentQuestion: 3 });
    await expect(assessment.validate()).rejects.toThrow(
      /The index of the current question must be at least 0 and less than /
    );
  });

  test("should not validate a question with less than 2 options", async () => {
    const badQuestion1Data = { ...questionData1, options: [questionData1[0]] };
    const assessment = new assessmentModel({
      ...assessmentData,
      questions: [badQuestion1Data, questionData2]
    });
    await expect(assessment.validate()).rejects.toThrow(
      /There must be at least 2 options and no more than 26 options/
    );
  });

  test("should not validate a question with more than 26 options", async () => {
    const badOptions = Array.from({ length: 27 }, (_, i) => `Option ${i + 1}`);
    const badQuestion1Data = { ...questionData1, options: badOptions };
    const assessment = new assessmentModel({
      ...assessmentData,
      questions: [badQuestion1Data, questionData2]
    });
    await expect(assessment.validate()).rejects.toThrow(
      /There must be at least 2 options and no more than 26 options/
    );
  });

  test("should not validate a question with answer less than 0", async () => {
    const badQuestion1Data = { ...questionData1, answer: -1 };
    const assessment = new assessmentModel({
      ...assessmentData,
      questions: [badQuestion1Data, questionData2]
    });
    await expect(assessment.validate()).rejects.toThrow(
      /The index of the answer must be at least 0 and less than /
    );
  });

  test("should not validate a question with correctOption >= options.length", async () => {
    const badQuestion1Data = { ...questionData1, correctOption: 10 }; // Out of bounds
    const assessment = new assessmentModel({
      ...assessmentData,
      questions: [badQuestion1Data, questionData2]
    });
    await expect(assessment.validate()).rejects.toThrow(
      /The index of the correct option must be at least 0 and less than/
    );
  });

  test("should insert an assessment", async () => {
    const assessment = await new assessmentModel(assessmentData).save();

    expect(assessment._id).toBeDefined();
    expect(assessment.title).toBe(assessmentData.title);
    expect(assessment.questions.length).toBe(2);
    expect(assessment.currentQuestion).toBe(1);
    expect(assessment.creationTime).toBeDefined();

    // Delete the saved questions and assessment
    await assessmentModel.deleteOne(assessment._id);
  });
});

/*================================================================
User model tests
================================================================*/
describe("User: Validate", () => {
  test("should insert a new learner", async () => {
    const user = await new userModel(learnerData).save();

    expect(Object.keys(user.toObject()).length).toBe(Object.keys(learnerData).length + 2);
    expect(user._id).toBeDefined();
    expect(user.name).toBe(learnerData.name);
    expect(user.email).toBe(learnerData.email);
    expect(user.password).toBeDefined();
    expect(user.learnerData).toBeDefined();
    expect(user.password).not.toBe(learnerData.password);
    expect(Object.keys(user.toObject().learnerData).length).toBe(
      Object.keys(learnerData.learnerData).length
    );
    expect(user.learnerData.courses).toBeDefined();
    expect(Array.isArray(user.learnerData.courses)).toBe(true);
    expect(user.learnerData.courses.length).toBe(learnerData.learnerData.courses.length);
    expect(user.instructorData).not.toBeDefined();

    // Delete the saved learner
    await userModel.deleteOne(user._id);
  });

  test("should insert a new instructor", async () => {
    const user = await new userModel(instructorData).save();

    expect(Object.keys(user.toObject()).length).toBe(Object.keys(instructorData).length + 2);
    expect(user._id).toBeDefined();
    expect(user.name).toBe(instructorData.name);
    expect(user.email).toBe(instructorData.email);
    expect(user.password).toBeDefined();
    expect(user.learnerData).toBeDefined();
    expect(user.password).not.toBe(instructorData.password);
    expect(Object.keys(user.toObject().learnerData).length).toBe(
      Object.keys(instructorData.learnerData).length
    );
    expect(user.learnerData.courses).toBeDefined();
    expect(Array.isArray(user.learnerData.courses)).toBe(true);
    expect(user.learnerData.courses.length).toBe(learnerData.learnerData.courses.length);
    expect(user.instructorData).toBeDefined();
    expect(Object.keys(user.toObject().instructorData).length).toBe(
      Object.keys(instructorData.instructorData).length
    );
    expect(user.instructorData.courses).toBeDefined();
    expect(Array.isArray(user.instructorData.courses)).toBe(true);
    expect(user.instructorData.courses.length).toBe(
      instructorData.instructorData.courses.length
    );

    // Delete the saved instructor
    await userModel.deleteOne(user._id);
  });
});

/*================================================================
Course model tests
================================================================*/
describe("Course: Validate", () => {
  const courseData = {
    title: "Test Course",
    description: "Test Course description",
    instructor: "",
    components: []
  };

  let module;
  let assessment;
  let instructor;
  let moduleComponentData;
  let assessmentComponentData;

  beforeAll(async () => {
    module = await new moduleModel(moduleData).save();
    assessment = await new assessmentModel(assessmentData).save();
    instructor = await new userModel(instructorData).save();
    moduleComponentData = { componentType: "Module", componentId: module._id };
    assessmentComponentData = { componentType: "Assessment", componentId: assessment._id };
    courseData.instructor = instructor._id.toString();
    courseData.components = [moduleComponentData, assessmentComponentData];
  });

  afterAll(async () => {
    await moduleModel.deleteOne(module._id);
    await assessmentModel.deleteOne(assessment._id);
    await userModel.deleteOne(instructor._id);
  });

  test("should insert a new course", async () => {
    const course = await new courseModel(courseData).save();

    expect(course._id).toBeDefined();
    expect(course.title).toBe(courseData.title);
    expect(course.instructor.toString()).toBe(courseData.instructor);
    expect(course.components.length).toBe(2);
    expect(course.currentComponent).toBe(courseData.currentComponent);
    expect(course.credentialEarned).toBe(courseData.credentialEarned);
    expect(course.creationTime).toBeDefined();
    expect(course.updateTime).toBeDefined();

    expect(course.components[0].componentType).toBe(moduleComponentData.componentType);
    expect(course.components[0].componentId.toString()).toBe(module._id.toString());
    expect(course.components[1].componentType).toBe(assessmentComponentData.componentType);
    expect(course.components[1].componentId.toString()).toBe(assessment._id.toString());

    // Delete the saved course
    await courseModel.deleteOne(course._id);
  });

  test("should validate a course with currentComponent = 0", async () => {
    const course = new courseModel({ ...courseData, currentComponent: 0 });
    await expect(course.validate()).resolves;
    expect(course.currentComponent).toBe(0);
  });

  test("should validate a course with currentComponent = components.length (completed)", async () => {
    const course = new courseModel({
      ...courseData,
      currentComponent: courseData.components.length
    });
    await expect(course.validate()).resolves;
    expect(course.currentComponent).toBe(courseData.components.length);
  });

  test("should not validate a course with empty components array", async () => {
    const badCourseData = { ...courseData, components: [], currentComponent: 0 };
    const course = new courseModel(badCourseData);
    await expect(course.validate()).rejects.toThrow(/At least one component is required/);
  });

  test("should not validate a course with non-existent component reference", async () => {
    const fakeObjectId = new mongoose.Types.ObjectId();
    const badComponentData = { componentType: "Module", componentId: fakeObjectId };
    const badCourseData = { ...courseData, components: [badComponentData] };
    const course = new courseModel(badCourseData);
    await expect(course.validate()).rejects.toThrow();
  });

  test("should not validate a course with an invalid currentComponent", async () => {
    const badCourseData = { ...courseData, currentComponent: courseData.components.length + 1 };
    const course = new courseModel(badCourseData);
    await expect(course.validate()).rejects.toThrow(
      /The index of the current component must be at least 0 and no greater than /
    );
  });
});
