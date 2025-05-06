// "use server"
import { AxiosFactory } from "@/lib/axios";

const assessmentApi = await AxiosFactory.getApiInstance("assessment");

export async function getTests(params: {
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
}) {
  try {
    const { data } = await assessmentApi.get("/tests", { params });
    return {
      success: true,
      data,
      message: "Lấy danh sách bài kiểm tra thành công",
    };
  } catch (error) {
    console.error("Error fetching tests:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách bài kiểm tra",
      error,
    };
  }
}

export async function getTestAttempts(params: {
  testTakerId: string;
  isSubmitted?: boolean;
}) {
  try {
    const { data } = await assessmentApi.get("/test-attempts", { params });
    return {
      success: true,
      data,
      message: "Lấy danh sách lần làm bài thành công",
    };
  } catch (error) {
    console.error("Error fetching test attempts:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách lần làm bài",
      error,
    };
  }
}

export async function createTestAttempt(data: {
  testId: string;
  testTakerId: string;
}) {
  try {
    const response = await assessmentApi.post("/test-attempts", data);
    return {
      success: true,
      data: response.data,
      message: "Tạo lần làm bài thành công",
    };
  } catch (error) {
    console.error("Error creating test attempt:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi tạo lần làm bài",
      error,
    };
  }
}

export async function getTestAttemptById(attemptId: string) {
  try {
    const { data } = await assessmentApi.get(`/test-attempts/${attemptId}`);
    return {
      success: true,
      data,
      message: "Lấy thông tin lần làm bài thành công",
    };
  } catch (error) {
    console.error("Error fetching test attempt:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông tin lần làm bài",
      error,
    };
  }
}

export async function submitTestAttempt(attemptId: string) {
  try {
    const { data } = await assessmentApi.post(
      `/test-attempts/${attemptId}/submit`,
    );
    return {
      success: true,
      data,
      message: "Nộp bài thành công",
    };
  } catch (error) {
    console.error("Error submitting test attempt:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi nộp bài",
      error,
    };
  }
}

export async function saveTestAnswer(
  attemptId: string,
  data: {
    questionId: string;
    answerData: any;
  },
) {
  try {
    const response = await assessmentApi.post(
      `/test-attempts/${attemptId}/answers`,
      data,
    );
    return {
      success: true,
      data: response.data,
      message: "Lưu câu trả lời thành công",
    };
  } catch (error) {
    console.error("Error saving answer:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi lưu câu trả lời",
      error,
    };
  }
}

export async function getTestResult(attemptId: string) {
  try {
    const { data } = await assessmentApi.get(
      `/test-attempts/${attemptId}/result`,
    );
    return {
      success: true,
      data,
      message: "Lấy kết quả bài kiểm tra thành công",
    };
  } catch (error) {
    console.error("Error fetching test result:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi lấy kết quả bài kiểm tra",
      error,
    };
  }
}

export async function createTest(testData: any) {
  try {
    const response = await assessmentApi.post("/tests", testData);
    return {
      success: true,
      data: response.data,
      message: "Tạo bài kiểm tra thành công",
    };
  } catch (error) {
    console.error("Error creating test:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi tạo bài kiểm tra",
      error,
    };
  }
}
