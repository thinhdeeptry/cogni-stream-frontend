// "use server"
import { AxiosFactory } from "@/lib/axios";

const assessmentApi = await AxiosFactory.getApiInstance("assessment");

export async function getQuestions(params: {
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
}) {
  console.log("++ params", params);
  try {
    const { data } = await assessmentApi.get("/questions", { params });
    return {
      success: true,
      data,
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

export async function getQuestionById(questionId: string) {
  try {
    const { data } = await assessmentApi.get(`/questions/${questionId}`);
    return {
      success: true,
      data,
      message: "Lấy thông tin câu hỏi thành công",
    };
  } catch (error) {
    console.error("Error fetching question:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông tin câu hỏi",
      error,
    };
  }
}

export async function updateQuestion(questionId: string, questionData: any) {
  try {
    const { data } = await assessmentApi.patch(
      `/questions/${questionId}`,
      questionData,
    );
    return {
      success: true,
      data,
      message: "Cập nhật câu hỏi thành công",
    };
  } catch (error) {
    console.error("Error updating question:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật câu hỏi",
      error,
    };
  }
}

export async function createQuestion(questionData: any) {
  try {
    const { data } = await assessmentApi.post("/questions", questionData);
    return {
      success: true,
      data,
      message: "Tạo câu hỏi thành công",
    };
  } catch (error) {
    console.error("Error creating question:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi tạo câu hỏi",
      error,
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
