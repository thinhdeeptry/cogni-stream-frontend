import { useCallback, useState } from "react";

import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";

// Sử dụng API key cố định từ biến môi trường
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// Interface cho options của hook
interface UseAIOptions {
  systemPrompt?: string;
  modelName?: string;
  referenceText?: string;
  structured?: boolean; // Thêm option để yêu cầu output có cấu trúc JSON
}

// Interface cho kết quả trả về của hook
interface UseAIResult {
  isLoading: boolean;
  error: string | null;
  lastInput: string;
  lastOutput: string;
  lastStructuredOutput: any | null; // Thêm output có cấu trúc
  clearOutput: () => void;
  processInput: (input: string, structured?: boolean) => Promise<string>;
}

/**
 * Custom hook để tương tác với Google Gemini AI
 * @param options - Các tùy chọn cho AI
 * @param options.systemPrompt - Prompt hệ thống để định hướng AI
 * @param options.modelName - Tên model Gemini sử dụng
 * @param options.referenceText - Văn bản tham khảo để AI dựa vào khi trả lời
 * @param options.structured - Yêu cầu AI trả về dữ liệu có cấu trúc JSON
 * @returns Các state và methods để tương tác với AI
 */
const useAI = (options: UseAIOptions = {}): UseAIResult => {
  const {
    systemPrompt = "",
    modelName = "gemini-2.0-flash",
    referenceText = "",
    structured = false,
  } = options;

  // Local states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState("");
  const [lastOutput, setLastOutput] = useState("");
  const [lastStructuredOutput, setLastStructuredOutput] = useState<any | null>(
    null,
  );

  // Tạo model instance với lazy initialization
  const getModel = useCallback((): GenerativeModel | null => {
    if (!API_KEY) return null;

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      return genAI.getGenerativeModel({ model: modelName });
    } catch (error) {
      console.error("Error creating Gemini model instance:", error);
      return null;
    }
  }, [modelName]);

  // Clear output
  const clearOutput = useCallback(() => {
    setLastOutput("");
    setLastInput("");
    setLastStructuredOutput(null);
  }, []);

  // Hàm phân tích JSON từ văn bản
  const parseJsonFromText = useCallback((text: string): any | null => {
    try {
      // Tìm kiếm các khối JSON trong văn bản
      const jsonRegex = /```json\s*([\s\S]*?)\s*```|\{[\s\S]*\}/g;
      const matches = text.match(jsonRegex);

      if (matches && matches.length > 0) {
        // Lấy khối JSON đầu tiên tìm thấy
        let jsonStr = matches[0];

        // Loại bỏ các dấu ``` nếu có
        jsonStr = jsonStr.replace(/```json\s*|\s*```/g, "");

        // Parse JSON
        return JSON.parse(jsonStr);
      }
      return null;
    } catch (error) {
      console.error("Error parsing JSON from AI response:", error);
      return null;
    }
  }, []);

  // Process input
  const processInput = useCallback(
    async (input: string, useStructured = structured): Promise<string> => {
      if (!API_KEY) {
        const errorMessage = "API key is not set in environment variables";
        setError(errorMessage);
        return errorMessage;
      }

      setIsLoading(true);
      setError(null);
      setLastInput(input);
      setLastStructuredOutput(null);

      try {
        const model = getModel();

        if (!model) {
          throw new Error("Failed to create model instance");
        }

        // Chuẩn bị prompt với system prompt và reference text nếu có
        let finalPrompt = input;

        // Thêm yêu cầu về JSON nếu cần dữ liệu có cấu trúc
        if (useStructured) {
          finalPrompt = `${finalPrompt}\n\nVui lòng trả về kết quả dưới dạng JSON với cấu trúc sau:\n{
  "chartData": {
    "revenue": {
      "labels": ["Tháng 1", "Tháng 2", ...],
      "datasets": [{
        "label": "Doanh thu",
        "data": [100, 200, ...],
        "backgroundColor": "rgba(75, 192, 192, 0.2)",
        "borderColor": "rgba(75, 192, 192, 1)",
        "borderWidth": 1
      }]
    },
    "students": {
      "labels": ["Tháng 1", "Tháng 2", ...],
      "datasets": [{
        "label": "Số học viên",
        "data": [10, 20, ...],
        "backgroundColor": ["#FF6384", "#36A2EB", ...],
        "borderColor": ["#FF6384", "#36A2EB", ...],
        "borderWidth": 1
      }]
    }
  },
  "predictions": {
    "revenue": [
      {"month": "Tháng 4", "value": 300},
      {"month": "Tháng 5", "value": 350},
      {"month": "Tháng 6", "value": 400}
    ],
    "students": [
      {"month": "Tháng 4", "value": 30},
      {"month": "Tháng 5", "value": 35},
      {"month": "Tháng 6", "value": 40}
    ]
  },
  "recommendations": [
    "Khuyến nghị 1",
    "Khuyến nghị 2",
    "Khuyến nghị 3"
  ]
}\n\nVui lòng đảm bảo JSON hợp lệ và đầy đủ các trường. Bạn có thể thêm phần giải thích bên ngoài khối JSON.`;
        }

        // Thêm system prompt nếu có
        if (systemPrompt) {
          finalPrompt = `${systemPrompt}\n\n${finalPrompt}`;
        }

        // Thêm reference text nếu có
        if (referenceText) {
          finalPrompt = `${finalPrompt}\n\nTham khảo thông tin sau để trả lời:\n${referenceText}`;
        }

        console.log("Sending prompt to Gemini:", finalPrompt);

        // Gửi prompt và nhận response
        const result = await model.generateContent(finalPrompt);
        const response = result.response;
        const text = response.text();

        setLastOutput(text);

        // Nếu yêu cầu dữ liệu có cấu trúc, thử phân tích JSON
        if (useStructured) {
          const parsedJson = parseJsonFromText(text);
          console.log("Parsed JSON from AI response:", parsedJson);
          setLastStructuredOutput(parsedJson);
        }

        setIsLoading(false);
        setLastOutput(text);
        return text;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Error processing AI request:", errorMessage);
        setIsLoading(false);
        setError(errorMessage);
        return `Error: ${errorMessage}`;
      }
    },
    [getModel, systemPrompt, referenceText, structured, parseJsonFromText],
  );

  return {
    isLoading,
    error,
    lastInput,
    lastOutput,
    lastStructuredOutput,
    clearOutput,
    processInput,
  };
};

export default useAI;
