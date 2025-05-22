"use server";

import {
  CreateTestDto,
  CreateTestQuestionDto,
  Question,
  ScoringPolicy,
  TestType,
} from "@/types/assessment/types";
import axios from "axios";

const ASSESSMENT_API_URL = "http://eduforge.io.vn:3005/api/v1";

export async function getQuestions(params: {
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
}) {
  try {
    const response = await axios.get(`${ASSESSMENT_API_URL}/questions`, {
      params,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      data: response.data,
      message: "Lấy danh sách câu hỏi thành công",
    };
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Đã xảy ra lỗi khi lấy danh sách câu hỏi",
      error,
    };
  }
}

export async function getQuestionById(questionId: string) {
  try {
    const response = await axios.get(
      `${ASSESSMENT_API_URL}/questions/${questionId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return {
      success: true,
      data: response.data,
      message: "Lấy thông tin câu hỏi thành công",
    };
  } catch (error: any) {
    console.error("Error fetching question:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Đã xảy ra lỗi khi lấy thông tin câu hỏi",
      error,
    };
  }
}

export async function updateQuestion(
  questionId: string,
  questionData: Question,
) {
  try {
    console.log(`Making PATCH request to: /questions/${questionId}`);
    console.log("With data:", JSON.stringify(questionData, null, 2));

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const response = await axios.patch(
      `${ASSESSMENT_API_URL}/questions/${questionId}`,
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

export async function createQuestion(questionData: Question) {
  try {
    console.log(`Making POST request to: /questions`);
    console.log("With data:", JSON.stringify(questionData, null, 2));

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const response = await axios.post(
      `${ASSESSMENT_API_URL}/questions`,
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
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách câu hỏi",
      error,
    };
  }
}
