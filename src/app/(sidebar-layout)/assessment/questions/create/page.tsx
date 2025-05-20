"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Editor } from "@tinymce/tinymce-react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { createQuestion } from "@/actions/assessmentAction";

import { processMediaInContent, uploadCoverImage } from "@/utils/media";

import { QuestionForm } from "@/components/assessment/question-form";
import { Button } from "@/components/ui/button";

export default function CreateQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lấy các tham số từ URL
  const courseId = searchParams.get("courseId");
  const chapterId = searchParams.get("chapterId");
  const lessonId = searchParams.get("lessonId");

  const handleImageUpload = async (blobInfo: any) => {
    try {
      const file = blobInfo.blob();
      const url = await uploadCoverImage(file);
      return url;
    } catch (error) {
      toast.error("Không thể tải ảnh lên");
      throw error;
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      console.log("CreateQuestionPage handleSubmit called with data:", data);

      // Xử lý media trong nội dung câu hỏi và các câu trả lời
      const processedContent = await processMediaInContent(data.content.text);
      const processedOptions = await Promise.all(
        data.options?.map(async (option: any) => ({
          ...option,
          content: {
            text: await processMediaInContent(option.content.text),
          },
        })) || [],
      );

      let processedReferenceAnswer;
      if (data.referenceAnswer) {
        processedReferenceAnswer = {
          ...data.referenceAnswer,
          content: {
            text: await processMediaInContent(
              data.referenceAnswer.content.text,
            ),
          },
        };
      }

      // Chuẩn bị dữ liệu gửi đi
      const requestData = {
        ...data,
        content: {
          text: processedContent,
        },
        options: processedOptions,
        referenceAnswer: processedReferenceAnswer,
      };

      console.log(
        "Processed request data:",
        JSON.stringify(requestData, null, 2),
      );

      const result = await createQuestion(requestData);
      console.log("Create API response:", result);

      if (result.success) {
        toast.success("Thêm câu hỏi thành công");
        router.push("/assessment/questions");
      } else {
        toast.error(result.message || "Không thể tạo câu hỏi");
      }
    } catch (error: any) {
      console.error("Error adding question:", error);
      toast.error(error.message || "Có lỗi xảy ra khi thêm câu hỏi");
    }
  };

  const editorConfig = {
    height: 300,
    menubar: false,
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "image",
      "charmap",
      "preview",
      "anchor",
      "searchreplace",
      "visualblocks",
      "code",
      "fullscreen",
      "insertdatetime",
      "media",
      "table",
      "code",
      "help",
      "wordcount",
      "codesample",
    ],
    toolbar:
      "undo redo | blocks | " +
      "bold italic forecolor | alignleft aligncenter " +
      "alignright alignjustify | bullist numlist outdent indent | " +
      "image media | removeformat | help",
    images_upload_handler: handleImageUpload,
    codesample_languages: [
      { text: "HTML/XML", value: "markup" },
      { text: "JavaScript", value: "javascript" },
      { text: "TypeScript", value: "typescript" },
      { text: "CSS", value: "css" },
      { text: "PHP", value: "php" },
      { text: "Python", value: "python" },
      { text: "Java", value: "java" },
      { text: "C", value: "c" },
      { text: "C#", value: "csharp" },
      { text: "SQL", value: "sql" },
    ],
    content_style: `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
      .mce-content-body img { max-width: 100%; height: auto; }
    `,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="h-12 px-6 gap-2 text-base"
          onClick={() => router.push("/assessment/questions")}
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Thêm câu hỏi mới</h2>
          <p className="text-muted-foreground">
            Tạo câu hỏi mới cho ngân hàng đề
          </p>
        </div>
      </div>
      <QuestionForm
        courseId={courseId || undefined}
        chapterId={chapterId || undefined}
        lessonId={lessonId || undefined}
        onSubmit={handleSubmit}
        editorConfig={editorConfig}
      />
    </div>
  );
}
