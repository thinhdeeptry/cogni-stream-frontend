// "use server";
import { AxiosFactory } from "@/lib/axios";
import {
  Answer,
  BulkCreateQuestionsDto,
  BulkDeleteQuestionsDto,
  CreateAnswerDto,
  CreateQuestionDto,
  CreateTestDto,
  CreateTestQuestionDto,
  DuplicateQuestionDto,
  Question,
  QuestionFilter,
  QuestionResponse,
  ReorderQuestionsDto,
  ScoringPolicy,
  TestType,
  UpdateAnswerDto,
  UpdateQuestionDto,
} from "@/types/assessment/types";

const assessmentApi = await AxiosFactory.getApiInstance("courses");

// ===== QUESTION MANAGEMENT APIs =====

/**
 * Lấy danh sách câu hỏi với filter và pagination
 */
export async function getQuestions(filter: QuestionFilter = {}) {
  try {
    console.log("Getting questions with filter:", filter);

    const { data } = await assessmentApi.get("/questions", { params: filter });
    return {
      success: true,
      data: data as QuestionResponse,
      message: "Lấy danh sách câu hỏi thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi lấy danh sách câu hỏi";
    console.error("Error fetching questionsss:", errorMessage);

    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      };
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Lấy chi tiết một câu hỏi
 */
export async function getQuestionById(questionId: string) {
  try {
    const { data } = await assessmentApi.get(`/questions/${questionId}`);
    return {
      success: true,
      data: data as Question,
      message: "Lấy thông tin câu hỏi thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi lấy thông tin câu hỏi";
    console.error("Error fetching question:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Tạo câu hỏi mới
 */
export async function createQuestion(questionData: CreateQuestionDto) {
  try {
    const { data } = await assessmentApi.post("/questions", questionData);
    return {
      success: true,
      data: data as Question,
      message: "Tạo câu hỏi thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi tạo câu hỏi";
    console.error("Error creating question:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Cập nhật câu hỏi
 */
export async function updateQuestion(
  questionId: string,
  questionData: UpdateQuestionDto,
) {
  try {
    const { data } = await assessmentApi.patch(
      `/questions/${questionId}`,
      questionData,
    );
    return {
      success: true,
      data: data as Question,
      message: "Cập nhật câu hỏi thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi cập nhật câu hỏi";
    console.error("Error updating question:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Xóa câu hỏi
 */
export async function deleteQuestion(questionId: string) {
  try {
    await assessmentApi.delete(`/questions/${questionId}`);
    return {
      success: true,
      message: "Đã xóa câu hỏi thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi xóa câu hỏi";
    console.error("Error deleting question:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

// ===== ANSWER MANAGEMENT APIs =====

/**
 * Thêm đáp án cho câu hỏi
 */
export async function createAnswer(
  questionId: string,
  answerData: CreateAnswerDto,
) {
  try {
    const { data } = await assessmentApi.post(
      `/questions/${questionId}/answers`,
      answerData,
    );
    return {
      success: true,
      data: data as Answer,
      message: "Thêm đáp án thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi thêm đáp án";
    console.error("Error creating answer:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Cập nhật đáp án
 */
export async function updateAnswer(
  questionId: string,
  answerId: string,
  answerData: UpdateAnswerDto,
) {
  try {
    const { data } = await assessmentApi.patch(
      `/questions/${questionId}/answers/${answerId}`,
      answerData,
    );
    return {
      success: true,
      data: data as Answer,
      message: "Cập nhật đáp án thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi cập nhật đáp án";
    console.error("Error updating answer:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Xóa đáp án
 */
export async function deleteAnswer(questionId: string, answerId: string) {
  try {
    await assessmentApi.delete(`/questions/${questionId}/answers/${answerId}`);
    return {
      success: true,
      message: "Đã xóa đáp án thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi xóa đáp án";
    console.error("Error deleting answer:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

// ===== BULK OPERATIONS APIs =====

/**
 * Tạo nhiều câu hỏi cùng lúc
 */
export async function createBulkQuestions(data: BulkCreateQuestionsDto) {
  try {
    const { data: result } = await assessmentApi.post("/questions/bulk", data);
    return {
      success: true,
      data: result,
      message: `Đã tạo ${data.questions.length} câu hỏi thành công`,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi tạo câu hỏi";
    console.error("Error creating bulk questions:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Xóa nhiều câu hỏi cùng lúc
 */
export async function deleteBulkQuestions(data: BulkDeleteQuestionsDto) {
  try {
    await assessmentApi.delete("/questions/bulk", { data });
    return {
      success: true,
      message: `Đã xóa ${data.questionIds.length} câu hỏi thành công`,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi xóa câu hỏi";
    console.error("Error deleting bulk questions:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

// ===== ADVANCED OPERATIONS APIs =====

/**
 * Sao chép câu hỏi
 */
export async function duplicateQuestion(
  questionId: string,
  data: DuplicateQuestionDto = {},
) {
  try {
    const { data: result } = await assessmentApi.post(
      `/questions/${questionId}/duplicate`,
      data,
    );
    return {
      success: true,
      data: result as Question,
      message: "Sao chép câu hỏi thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi sao chép câu hỏi";
    console.error("Error duplicating question:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Sắp xếp lại thứ tự câu hỏi
 */
export async function reorderQuestions(data: ReorderQuestionsDto) {
  try {
    await assessmentApi.patch("/questions/reorder", data);
    return {
      success: true,
      message: "Đã cập nhật thứ tự câu hỏi thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi cập nhật thứ tự câu hỏi";
    console.error("Error reordering questions:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

// ===== LEGACY SUPPORT APIs =====

/**
 * Legacy function để tương thích với code cũ
 * @deprecated Sử dụng getQuestions() thay thế
 */
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
    const errorMessage = "Đã xảy ra lỗi khi lấy danh sách câu hỏi";
    console.error("Error fetching questions by IDs:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}
