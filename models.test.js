import mongoose from "mongoose";
import dotenv from "dotenv";
import { userModel } from "./src/Models/UserModel.js";
import { moduleModel } from "./src/Models/ModuleModel";
import { questionModel } from "./src/Models/QuestionModel.js";
import { assessmentModel } from "./src/Models/AssessmentModel.js";
import { courseModel } from "./src/Models/CourseModel.js";

// Set up the environment
dotenv.config();

// Connect to MongoDB
const MONGO_URL = process.env.MONGO_URL;

beforeAll(async () => {
  try {
    // Connect to MongoDB before evaluating the test cases
    await mongoose.connect(MONGO_URL);
  } catch (error) {
    console.log("Error connecting: ", error);
  }
});

afterAll(async () => {
  try {
    // Close the MongoDB connection
    await mongoose.connection.close();
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

  test("should not insert a Video module with missing Chapters key", async () => {
    // Removing chapters from the module
    const badModule = structuredClone(newModule);
    badModule.type = "Video";
    delete badModule.chapters;
    const module = await new moduleModel(badModule);
    await expect(module.save()).rejects.toThrow(/Chapters field/);
  });

  test("should not insert an Audio module with missing Chapters key", async () => {
    // Removing chapters from the module
    const badModule = structuredClone(newModule);
    delete badModule.chapters;
    const module = await new moduleModel(badModule);
    await expect(module.save()).rejects.toThrow(/Chapters field/);
  });

  test("should not insert a Markdown module with Chapters", async () => {
    const badModule = structuredClone(newModule);
    badModule.type = "Markdown";
    const module = await new moduleModel(badModule);
    await expect(module.save()).rejects.toThrow(/Chapters field cannot be present/);
  });

  test("should insert a new Markdown module with no Chapters", async () => {
    const markdownModule = structuredClone(newModule);
    markdownModule.type = "Markdown";
    markdownModule.chapters = [];
    const module = await new moduleModel(markdownModule).save();
    expect(module._id).toBeDefined();
    // Delete the saved module
    await moduleModel.deleteOne({ _id: module._id });
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
    expect(module.createdAt).toBeDefined();

    // Delete the saved module
    await moduleModel.deleteOne({ _id: module._id });
  });
});

/*================================================================
Question model tests
================================================================*/
describe("Question: Insert", () => {
  const newQuestion = {
    question: "What color is Manchester?",
    options: ["Red", "Blue", "Yellow", "Cyan"],
    answer: 0,
    correctOption: 0,
    explanation: "Manchester is and always will be Red"
  };

  test("should not insert a question with less than 2 options", async () => {
    const question = new questionModel({ ...newQuestion, options: ["Red"] });
    await expect(question.save()).rejects.toThrow(
      /The number of options must be between 2 and 26/
    );
  });

  test("should not insert a question with answer less than 0", async () => {
    const question = new questionModel({ ...newQuestion, answer: -1 });
    await expect(question.save()).rejects.toThrow(
      /The answer number must be between 0 and \d+/
    );
  });

  test("should insert a question with correct length of options and answer", async () => {
    const question = await new questionModel(newQuestion).save();

    expect(question._id).toBeDefined();
    expect(question.question).toBe("What color is Manchester?");
    expect(question.options).toEqual(["Red", "Blue", "Yellow", "Cyan"]);
    expect(question.answer).toBe(0);
    expect(question.correctOption).toBe(0);
    expect(question.explanation).toBe("Manchester is and always will be Red");
    expect(question.createdAt).toBeDefined();

    // Delete the saved question
    await questionModel.deleteOne({ _id: question._id });
  });
});

/*================================================================
Assessment model tests
================================================================*/
describe("Assessment: Insert", () => {
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

  test("should not insert an assessment with current question out of bounds", async () => {
    const savedQuestion1 = await new questionModel(question1).save();
    const savedQuestion2 = await new questionModel(question2).save();
    const assessment = new assessmentModel({
      ...newAssessment,
      questions: [savedQuestion1._id, savedQuestion2._id],
      currentQuestion: 3
    });
    await expect(assessment.save()).rejects.toThrow(
      /Current question must be at least 0 and no greater than \d+/
    );
  });

  test("should insert an assessment", async () => {
    const savedQuestion1 = await new questionModel(question1).save();
    const savedQuestion2 = await new questionModel(question2).save();
    const assessment = await new assessmentModel({
      ...newAssessment,
      questions: [savedQuestion1._id, savedQuestion2._id]
    }).save();

    expect(assessment._id).toBeDefined();
    expect(assessment.title).toBe("Test Assessment");
    expect(assessment.questions.length).toBe(2);
    expect(assessment.currentQuestion).toBe(1);
    expect(assessment.createdAt).toBeDefined();

    // Delete the saved questions and assessment
    await questionModel.deleteOne({ _id: savedQuestion1._id });
    await questionModel.deleteOne({ _id: savedQuestion2._id });
    await assessmentModel.deleteOne(assessment._id);
  });
});

/*================================================================
Course model tests
================================================================*/
describe("Course: Insert", () => {
  const instructor = {
    name: "John Wick",
    email: "johnwick@example.com",
    password: "123456789"
  };

  const module = {
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
    questions: [],
    currentQuestion: 1
  };

  const newCourse = {
    title: "Test Course",
    description: "Test Course description",
    instructor: null,
    components: [],
    currentComponent: 1,
    credentialEarned: false
  };

  test("should insert a new course", async () => {
    const savedInstructor = await new userModel(instructor).save();
    const savedModule = await new moduleModel(module).save();
    const savedQuestion1 = await new questionModel(question1).save();
    const savedQuestion2 = await new questionModel(question2).save();
    const savedAssessment = await new assessmentModel({
      title: "Test Assessment",
      questions: [savedQuestion1._id, savedQuestion2._id]
    }).save();

    const course = await new courseModel({
      ...newCourse,
      instructor: savedInstructor._id,
      components: [savedModule._id, savedAssessment._id]
    }).save();

    expect(course._id).toBeDefined();
    expect(course.title).toBe("Test Course");
    expect(course.instructor).toBe(savedInstructor._id);
    expect(course.components.length).toBe(2);
    expect(course.currentComponent).toBe(1);
    expect(course.credentialEarned).toBe(false);
    expect(course.createdAt).toBeDefined();

    // Delete the saved components, questions, assessments, and course
    await moduleModel.deleteOne({ _id: savedModule._id });
    await questionModel.deleteOne({ _id: savedQuestion1._id });
    await questionModel.deleteOne({ _id: savedQuestion2._id });
    await assessmentModel.deleteOne({ _id: savedAssessment._id });
    await userModel.deleteOne({ _id: savedInstructor._id });
    await courseModel.deleteOne({ _id: course._id });
  });
});
