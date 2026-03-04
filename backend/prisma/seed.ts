import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { extractYoutubeVideoId, buildYoutubeWatchUrl } from "../src/utils/youtube.js";

const prisma = new PrismaClient();

async function upsertUser(data: { name: string; email: string; role: UserRole; password: string }) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  return prisma.user.upsert({
    where: { email: data.email },
    create: { name: data.name, email: data.email, role: data.role, passwordHash },
    update: { name: data.name, role: data.role, passwordHash },
  });
}

type SeedLesson = {
  id: string;
  title: string;
  orderNo: number;
  youtubeInput: string;
  durationSec: number;
};

type SeedSection = {
  id: string;
  title: string;
  orderNo: number;
  lessons: SeedLesson[];
};

type SeedCourse = {
  id: string;
  title: string;
  thumbnailUrl: string;
  shortDescription: string;
  description: string;
  learningOutcomes: string[];
  sections: SeedSection[];
};

async function upsertCourseWithContent(courseData: SeedCourse, instructorId: string) {
  const course = await prisma.course.upsert({
    where: { id: courseData.id },
    create: {
      id: courseData.id,
      title: courseData.title,
      thumbnailUrl: courseData.thumbnailUrl,
      shortDescription: courseData.shortDescription,
      description: courseData.description,
      learningOutcomes: courseData.learningOutcomes,
      instructorId,
    },
    update: {
      title: courseData.title,
      thumbnailUrl: courseData.thumbnailUrl,
      shortDescription: courseData.shortDescription,
      description: courseData.description,
      learningOutcomes: courseData.learningOutcomes,
      instructorId,
    },
  });

  for (const sectionData of courseData.sections) {
    const section = await prisma.section.upsert({
      where: { id: sectionData.id },
      create: {
        id: sectionData.id,
        courseId: course.id,
        title: sectionData.title,
        orderNo: sectionData.orderNo,
      },
      update: {
        courseId: course.id,
        title: sectionData.title,
        orderNo: sectionData.orderNo,
      },
    });

    for (const lessonData of sectionData.lessons) {
      const videoId = extractYoutubeVideoId(lessonData.youtubeInput);
      await prisma.lesson.upsert({
        where: { id: lessonData.id },
        create: {
          id: lessonData.id,
          sectionId: section.id,
          title: lessonData.title,
          orderNo: lessonData.orderNo,
          youtubeVideoId: videoId,
          youtubeUrl: buildYoutubeWatchUrl(videoId),
          durationSec: lessonData.durationSec,
        },
        update: {
          sectionId: section.id,
          title: lessonData.title,
          orderNo: lessonData.orderNo,
          youtubeVideoId: videoId,
          youtubeUrl: buildYoutubeWatchUrl(videoId),
          durationSec: lessonData.durationSec,
        },
      });
    }
  }
}

async function main() {
  const instructor = await upsertUser({
    name: "Alex Instructor",
    email: "instructor@lms.dev",
    role: UserRole.INSTRUCTOR,
    password: "Password123!",
  });

  await upsertUser({
    name: "Sam Student",
    email: "student@lms.dev",
    role: UserRole.STUDENT,
    password: "Password123!",
  });

  await upsertUser({
    name: "Admin User",
    email: "admin@lms.dev",
    role: UserRole.ADMIN,
    password: "Password123!",
  });

  const catalog: SeedCourse[] = [
    {
      id: "course-react-fundamentals",
      title: "React Fundamentals for Production Apps",
      thumbnailUrl: "https://img.youtube.com/vi/w7ejDZ8SWv8/maxresdefault.jpg",
      shortDescription: "Build modern React applications with robust state and routing patterns.",
      description:
        "This course teaches practical React foundations for building maintainable web applications, from component architecture to API integration and route-based UX.",
      learningOutcomes: [
        "Build reusable React components",
        "Design route-based frontends",
        "Integrate APIs and handle loading/error states",
      ],
      sections: [
        {
          id: "section-react-1",
          title: "React Core",
          orderNo: 1,
          lessons: [
            { id: "lesson-react-1", title: "What is React?", orderNo: 1, youtubeInput: "w7ejDZ8SWv8", durationSec: 780 },
            {
              id: "lesson-react-2",
              title: "Components and Props",
              orderNo: 2,
              youtubeInput: "I2UBjN5ER4s",
              durationSec: 1040,
            },
          ],
        },
        {
          id: "section-react-2",
          title: "Routing and State",
          orderNo: 2,
          lessons: [
            {
              id: "lesson-react-3",
              title: "React Router Basics",
              orderNo: 1,
              youtubeInput: "Law7wfdg_ls",
              durationSec: 1180,
            },
            {
              id: "lesson-react-4",
              title: "Fetching API Data in React",
              orderNo: 2,
              youtubeInput: "0ZJgIjIuY7U",
              durationSec: 960,
            },
          ],
        },
      ],
    },
    {
      id: "course-node-api-design",
      title: "Node.js API Design and Architecture",
      thumbnailUrl: "https://img.youtube.com/vi/Oe421EPjeBE/maxresdefault.jpg",
      shortDescription: "Design resilient REST APIs with Express, validation, auth, and clean layering.",
      description:
        "Learn how to structure backend services using Node.js and Express with practical patterns for scalability, API security, and maintainability.",
      learningOutcomes: [
        "Design RESTful API contracts",
        "Implement middleware-driven architecture",
        "Add authentication and robust validation",
      ],
      sections: [
        {
          id: "section-node-1",
          title: "API Foundations",
          orderNo: 1,
          lessons: [
            { id: "lesson-node-1", title: "Express App Structure", orderNo: 1, youtubeInput: "Oe421EPjeBE", durationSec: 950 },
            { id: "lesson-node-2", title: "Routing and Controllers", orderNo: 2, youtubeInput: "pKd0Rpw7O48", durationSec: 910 },
          ],
        },
        {
          id: "section-node-2",
          title: "Auth and Production Practices",
          orderNo: 2,
          lessons: [
            { id: "lesson-node-3", title: "JWT Authentication", orderNo: 1, youtubeInput: "mbsmsi7l3r4", durationSec: 1020 },
            { id: "lesson-node-4", title: "Validation and Error Handling", orderNo: 2, youtubeInput: "2eqA4zCuQq4", durationSec: 880 },
          ],
        },
      ],
    },
    {
      id: "course-python-data-analysis",
      title: "Python Data Analysis Essentials",
      thumbnailUrl: "https://img.youtube.com/vi/r-uOLxNrNk8/maxresdefault.jpg",
      shortDescription: "Analyze real datasets with Python, NumPy, and Pandas workflows.",
      description:
        "A practical Python analytics course focused on data wrangling, exploratory analysis, and reporting-ready transformations.",
      learningOutcomes: [
        "Work with tabular datasets using Pandas",
        "Clean and transform raw data",
        "Generate insights with summary statistics",
      ],
      sections: [
        {
          id: "section-python-1",
          title: "Python + Data Basics",
          orderNo: 1,
          lessons: [
            { id: "lesson-python-1", title: "Python for Data Work", orderNo: 1, youtubeInput: "r-uOLxNrNk8", durationSec: 890 },
            { id: "lesson-python-2", title: "NumPy Fundamentals", orderNo: 2, youtubeInput: "QUT1VHiLmmI", durationSec: 930 },
          ],
        },
        {
          id: "section-python-2",
          title: "Pandas in Practice",
          orderNo: 2,
          lessons: [
            { id: "lesson-python-3", title: "Loading and Cleaning Data", orderNo: 1, youtubeInput: "vmEHCJofslg", durationSec: 980 },
            { id: "lesson-python-4", title: "Grouping and Aggregation", orderNo: 2, youtubeInput: "txMdrV1Ut64", durationSec: 940 },
          ],
        },
      ],
    },
    {
      id: "course-sql-for-applications",
      title: "SQL for Application Developers",
      thumbnailUrl: "https://img.youtube.com/vi/HXV3zeQKqGY/maxresdefault.jpg",
      shortDescription: "Master SQL queries, joins, indexes, and schema design for real apps.",
      description:
        "This course gives developers practical SQL capabilities to model data correctly and write efficient queries for production systems.",
      learningOutcomes: [
        "Write reliable SELECT and JOIN queries",
        "Model tables and relationships",
        "Understand indexing and query performance basics",
      ],
      sections: [
        {
          id: "section-sql-1",
          title: "SQL Core Queries",
          orderNo: 1,
          lessons: [
            { id: "lesson-sql-1", title: "SELECT, WHERE, ORDER BY", orderNo: 1, youtubeInput: "HXV3zeQKqGY", durationSec: 860 },
            { id: "lesson-sql-2", title: "JOIN Fundamentals", orderNo: 2, youtubeInput: "9Pzj7Aj25lw", durationSec: 920 },
          ],
        },
        {
          id: "section-sql-2",
          title: "Schema and Performance",
          orderNo: 2,
          lessons: [
            { id: "lesson-sql-3", title: "Normalization Basics", orderNo: 1, youtubeInput: "UrYLYV7WSHM", durationSec: 840 },
            { id: "lesson-sql-4", title: "Indexes and Query Tuning", orderNo: 2, youtubeInput: "HubezKbFL7E", durationSec: 990 },
          ],
        },
      ],
    },
    {
      id: "course-devops-foundations",
      title: "DevOps Foundations: CI/CD and Deployment",
      thumbnailUrl: "https://img.youtube.com/vi/0yWAtQ6wYNM/maxresdefault.jpg",
      shortDescription: "Understand deployment pipelines, Docker basics, and CI/CD workflows.",
      description:
        "A practical introduction to DevOps workflows that connect code changes to safe, automated deployment pipelines.",
      learningOutcomes: [
        "Understand CI/CD pipeline stages",
        "Containerize applications using Docker basics",
        "Ship code through automated deployment checks",
      ],
      sections: [
        {
          id: "section-devops-1",
          title: "CI/CD Essentials",
          orderNo: 1,
          lessons: [
            { id: "lesson-devops-1", title: "What is CI/CD?", orderNo: 1, youtubeInput: "0yWAtQ6wYNM", durationSec: 900 },
            { id: "lesson-devops-2", title: "Build and Test Pipelines", orderNo: 2, youtubeInput: "1A6v8oN5Bnk", durationSec: 930 },
          ],
        },
        {
          id: "section-devops-2",
          title: "Containers and Deployment",
          orderNo: 2,
          lessons: [
            { id: "lesson-devops-3", title: "Docker Basics", orderNo: 1, youtubeInput: "fqMOX6JJhGo", durationSec: 980 },
            { id: "lesson-devops-4", title: "Deployment Strategies", orderNo: 2, youtubeInput: "8vXoMqWgbQQ", durationSec: 910 },
          ],
        },
      ],
    },
  ];

  for (const seedCourse of catalog) {
    await upsertCourseWithContent(seedCourse, instructor.id);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
