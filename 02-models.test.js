import mongoose from "mongoose";
import dotenv from "dotenv";
import { database,
  assessmentModel,
  courseModel,
  moduleModel,
  userModel } from "./src/model.js";

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
  const newModule = {
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

  test("should not validate a Video module with missing Chapters key", async () => {
    // Removing chapters from the module
    const badModule = structuredClone(newModule);
    badModule.type = "Video";
    delete badModule.chapters;
    const module = new moduleModel(badModule);
    await expect(module.validate()).rejects.toThrow(/Chapters field/);
  });

  test("should not validate an Audio module with missing Chapters key", async () => {
    // Removing chapters from the module
    const badModule = structuredClone(newModule);
    delete badModule.chapters;
    const module = new moduleModel(badModule);
    await expect(module.validate()).rejects.toThrow(/Chapters field/);
  });

  test("should not validate a Markdown module with Chapters", async () => {
    const badModule = structuredClone(newModule);
    badModule.type = "Markdown";
    const module = new moduleModel(badModule);
    await expect(module.validate()).rejects.toThrow(/Chapters field cannot be present/);
  });

  test("should validate a new Markdown module with no Chapters", async () => {
    const markdownModule = structuredClone(newModule);
    markdownModule.type = "Markdown";
    delete markdownModule.chapters;
    const module = new moduleModel(markdownModule)
    await expect(module.validate()).resolves;
    expect(module._id).toBeDefined();
  });

  test("should insert a new Audio module", async () => {
    const module = await new moduleModel(newModule).save();

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
  const question1 = {
    question: "What is the capital of France?",
    options: ["Paris", "Berlin", "Madrid", "London"],
    answer: 0,
    correctOption: 0,
    explanation: "Paris is the capital of France"
  };
  const question2 = {
    question: "Who was the first person to climb Mount Everest?",
    options: ["Alexander the Great", "Mohammad Ali", "Everest", "Edmund Hillary"],
    answer: 3,
    correctOption: 3,
    explanation: "Edmund Hillary was the first person to climb Mount Everest"
  };
  const newAssessment = {
    title: "Test Assessment",
    questions: [question1, question2],
    currentQuestion: 1
  };

  test("should not validate an assessment with current question out of bounds", async () => {
    const assessment = new assessmentModel({
      ...newAssessment,
      currentQuestion: 3
    });
    await expect(assessment.validate()).rejects.toThrow(
      /The index of the current question must be at least 0 and less than /
    );
  });

  test("should not validate a question with less than 2 options", async () => {
    const question = { ...question1, options: ["Paris"] };
    const assessment = new assessmentModel({ ...newAssessment, questions: [question, question2] });
    await expect(assessment.validate()).rejects.toThrow(
      /There must be at least 2 options and no more than 26 options/
    );
  });

  test("should not validate a question with answer less than 0", async () => {
    const question = { ...question1, answer: -1 };
    const assessment = new assessmentModel({ ...newAssessment, questions: [question, question2] });
    await expect(assessment.validate()).rejects.toThrow(
      /The index of the answer must be at least 0 and less than /
    );
  });

  test("should insert an assessment", async () => {
    const assessment = await new assessmentModel(newAssessment).save();

    expect(assessment._id).toBeDefined();
    expect(assessment.title).toBe("Test Assessment");
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
  const learner = {
    name: "Test Learner User",
    email: `learner_${Date.now()}@test.user`,
    password: "123456789",
    learnerData: { courses: [] }
  };
  const instructor = {
    name: "Test Instructor User",
    email: `instructor_${Date.now()}@test.user`,
    password: "123456789",
    learnerData: { courses: [] },
    instructorData: { courses: [] }
  };

  test("should insert a new learner", async () => {
    const savedLearner = await new userModel(learner).save();
    expect(Object.keys(savedLearner.toObject()).length).toBe(Object.keys(learner).length + 2);
    expect(savedLearner._id).toBeDefined();
    expect(savedLearner.name).toBe(learner.name);
    expect(savedLearner.email).toBe(learner.email);
    expect(savedLearner.password).toBeDefined();
    expect(savedLearner.learnerData).toBeDefined();
    expect(Object.keys(savedLearner.toObject().learnerData).length).toBe(Object.keys(learner.learnerData).length);
    expect(savedLearner.learnerData.courses).toBeDefined();
    expect(Array.isArray(savedLearner.learnerData.courses)).toBe(true);
    expect(savedLearner.learnerData.courses.length).toBe(learner.learnerData.courses.length);
    expect(savedLearner.instructorData).not.toBeDefined();

    // Delete the saved learner
    await userModel.deleteOne(savedLearner._id);
  });

  test("should insert a new instructor", async () => {
    const savedInstructor = await new userModel(instructor).save();
    expect(Object.keys(savedInstructor.toObject()).length).toBe(Object.keys(instructor).length + 2);
    expect(savedInstructor._id).toBeDefined();
    expect(savedInstructor.name).toBe(instructor.name);
    expect(savedInstructor.email).toBe(instructor.email);
    expect(savedInstructor.password).toBeDefined();
    expect(savedInstructor.learnerData).toBeDefined();
    expect(Object.keys(savedInstructor.toObject().learnerData).length).toBe(Object.keys(instructor.learnerData).length);
    expect(savedInstructor.learnerData.courses).toBeDefined();
    expect(Array.isArray(savedInstructor.learnerData.courses)).toBe(true);
    expect(savedInstructor.learnerData.courses.length).toBe(learner.learnerData.courses.length);
    expect(savedInstructor.instructorData).toBeDefined();
    expect(Object.keys(savedInstructor.toObject().instructorData).length).toBe(Object.keys(instructor.instructorData).length);
    expect(savedInstructor.instructorData.courses).toBeDefined();
    expect(Array.isArray(savedInstructor.instructorData.courses)).toBe(true);
    expect(savedInstructor.instructorData.courses.length).toBe(instructor.instructorData.courses.length);

    // Delete the saved instructor
    await userModel.deleteOne(savedInstructor._id);
  });
});

/*================================================================
Course model tests
================================================================*/
describe("Course: Validate", () => {
  const module = {
    title: "Test Module",
    description: "This is a test module",
    type: "Audio",
    chapters: [
      { title: "Chapter 1", timeIndex: 120 },
      { title: "Chapter 2", timeIndex: 180 }
    ],
    url: "https://example.com/test-module",
    urlAuthentication: { scheme: "bearer", parameters: "token=123" },
    completed: false
  };

  const question1 = {
    question: "What is the capital of France?",
    options: ["Paris", "Berlin", "Madrid", "London"],
    answer: 0,
    correctOption: 0,
    explanation: "Paris is the capital of France"
  };
  const question2 = {
    question: "Who was the first person to climb Mount Everest?",
    options: ["Alexander the Great", "Mohammad Ali", "Everest", "Edmund Hillary"],
    answer: 3,
    correctOption: 3,
    explanation: "Edmund Hillary was the first person to climb Mount Everest"
  };
  const newAssessment = {
    title: "Test Assessment",
    questions: [question1, question2],
    currentQuestion: 1
  };

  const instructor = {
    name: "Test Instructor User",
    email: `instructor_${Date.now()}@test.user`,
    password: "123456789",
    learnerData: { courses: [] },
    instructorData: { courses: [] }
  };

  const newCourse = {
    title: "Test Course",
    description: "Test Course description",
    instructor: "",
    components: []
  };

  let savedModule;
  let savedAssessment;
  let savedInstructor;
  let moduleComponent;
  let assessmentComponent;

  beforeAll(async () => {
    savedModule = await new moduleModel(module).save();
    savedAssessment = await new assessmentModel(newAssessment).save();
    savedInstructor = await new userModel(instructor).save();
    moduleComponent = {componentType: "Module", componentId: savedModule._id};
    assessmentComponent = {componentType: "Assessment", componentId: savedAssessment._id};
    newCourse.instructor = savedInstructor._id.toString();
    newCourse.components = [moduleComponent, assessmentComponent];
  });

  afterAll(async () => {
    await moduleModel.deleteOne(savedModule._id);
    await assessmentModel.deleteOne(savedAssessment._id);
    await userModel.deleteOne(savedInstructor._id);
  });

  test("should insert a new course", async () => {

    const course = await new courseModel(newCourse).save();

    expect(course._id).toBeDefined();
    expect(course.title).toBe(newCourse.title);
    expect(course.instructor.toString()).toBe(newCourse.instructor);
    expect(course.components.length).toBe(2);
    expect(course.currentComponent).toBe(newCourse.currentComponent);
    expect(course.credentialEarned).toBe(newCourse.credentialEarned);
    expect(course.creationTime).toBeDefined();
    expect(course.updateTime).toBeDefined();

    expect(course.components[0].componentType).toBe(moduleComponent.componentType);
    expect(course.components[0].componentId.toString()).toBe(savedModule._id.toString());
    expect(course.components[1].componentType).toBe(assessmentComponent.componentType);
    expect(course.components[1].componentId.toString()).toBe(savedAssessment._id.toString());

    // Delete the saved course
    await courseModel.findByIdAndDelete(course._id.toString());
  });

  test("should not validate a course with an invalid currentComponent", async () => {
    const badCourse = {...newCourse, currentComponent: newCourse.components.length + 1};
    const course = new courseModel(badCourse);
    await expect(course.validate()).rejects.toThrow(
      /The index of the current component must be at least 0 and no greater than /
    );
  });
});
