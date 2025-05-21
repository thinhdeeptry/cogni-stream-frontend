// "use server"
import { AxiosFactory } from "@/lib/axios";
import axios from "axios";

export enum TestType {
  PRACTICE = "PRACTICE",
  QUIZ = "QUIZ",
  FINAL = "FINAL",
  ASSIGNMENT = "ASSIGNMENT",
}

export enum ScoringPolicy {
  HIGHEST = "HIGHEST",
  AVERAGE = "AVERAGE",
  LATEST = "LATEST",
}

export interface CreateTestQuestionDto {
  questionId: string;
  maxScore: number;
}

export interface CreateTestDto {
  title: string;
  description?: string;
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
  duration?: number;
  maxScore?: number;
  testType: TestType;
  shuffleQuestions: boolean;
  maxAttempts?: number;
  cooldownPeriod?: number;
  scoringPolicy: ScoringPolicy;
  testQuestions?: CreateTestQuestionDto[];
  questionOrder?: string[];
  allowReview: boolean;
  testStart: Date;
  testEnd?: Date;
  enforceTimeLimit: boolean;
  unlimitedAttempts: boolean;
}

let assessmentApi = axios.create({
  baseURL: "http://eduforge.io.vn:3005/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getQuestions(params: {
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
}) {
  console.log("++ params", params);
  try {
    console.log(`Making GET request to: /questions with params:`, params);

    const response = await axios.get(
      `http://eduforge.io.vn:3005/api/v1/questions`,
      {
        params,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("API response status:", response.status);
    console.log("API response data:", response.data);

    return {
      success: true,
      data: response.data,
      message: "Lấy danh sách câu hỏi thành công",
    };
  } catch (error: any) {
    console.error("Error fetching questions:", error);

    let errorMessage = "Đã xảy ra lỗi khi lấy danh sách câu hỏi";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage,
      error,
    };
  }
}

export async function getQuestionById(questionId: string) {
  try {
    console.log(`Making GET request to: /questions/${questionId}`);

    const response = await axios.get(
      `http://eduforge.io.vn:3005/api/v1/questions/${questionId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("API response status:", response.status);
    console.log("API response data:", response.data);

    return {
      success: true,
      data: response.data,
      message: "Lấy thông tin câu hỏi thành công",
    };
  } catch (error: any) {
    console.error("Error fetching question:", error);

    let errorMessage = "Đã xảy ra lỗi khi lấy thông tin câu hỏi";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage,
      error,
    };
  }
}

export async function updateQuestion(questionId: string, questionData: any) {
  try {
    console.log(`Making PATCH request to: /questions/${questionId}`);
    console.log("With data:", JSON.stringify(questionData, null, 2));

    // Make direct Axios request with minimal configuration
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const response = await axios.patch(
      `http://eduforge.io.vn:3005/api/v1/questions/${questionId}`,
      questionData,
      config,
    );

    console.log("API response status:", response.status);
    console.log("API response data:", response.data);

    return {
      success: true,
      data: response.data,
      message: "Cập nhật câu hỏi thành công",
    };
  } catch (error: any) {
    console.error("Error updating question:", error);

    // Detailed error logging
    let errorMessage = "Đã xảy ra lỗi khi cập nhật câu hỏi";

    if (error.response) {
      console.error(`Error status: ${error.response.status}`);
      console.error("Response headers:", error.response.headers);
      console.error("Response data:", error.response.data);

      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.request) {
      console.error("No response received. Request:", error.request);
      errorMessage = "Không nhận được phản hồi từ máy chủ";
    } else {
      console.error("Error message:", error.message);
      errorMessage = error.message || errorMessage;
    }

    return {
      success: false,
      message: errorMessage,
      error: error.response?.data || error,
    };
  }
}

export async function createQuestion(questionData: any) {
  try {
    console.log(`Making POST request to: /questions`);
    console.log("With data:", JSON.stringify(questionData, null, 2));

    // Make direct Axios request with minimal configuration
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const response = await axios.post(
      `http://eduforge.io.vn:3005/api/v1/questions`,
      questionData,
      config,
    );

    console.log("API response status:", response.status);
    console.log("API response data:", response.data);

    return {
      success: true,
      data: response.data,
      message: "Tạo câu hỏi thành công",
    };
  } catch (error: any) {
    console.error("Error creating question:", error);

    // Detailed error logging
    let errorMessage = "Đã xảy ra lỗi khi tạo câu hỏi";

    if (error.response) {
      console.error(`Error status: ${error.response.status}`);
      console.error("Response headers:", error.response.headers);
      console.error("Response data:", error.response.data);

      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.request) {
      console.error("No response received. Request:", error.request);
      errorMessage = "Không nhận được phản hồi từ máy chủ";
    } else {
      console.error("Error message:", error.message);
      errorMessage = error.message || errorMessage;
    }

    return {
      success: false,
      message: errorMessage,
      error: error.response?.data || error,
    };
  }
}

export async function getQuestionsById(questionIds: string[]) {
  try {
    const questions = await Promise.all(
      questionIds.map(async (id) => {
        const result = await getQuestionById(id);
        if (result.success) {
          return result.data;
        }
        throw new Error(`Failed to fetch question with ID ${id}`);
      }),
    );
    return {
      success: true,
      data: questions,
      message: "Lấy danh sách câu hỏi thành công",
    };
  } catch (error) {
    console.error("Error fetching questions:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách câu hỏi",
      error,
    };
  }
}
