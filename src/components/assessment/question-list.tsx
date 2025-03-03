// This file is maintained for backward compatibility
// Please import QuestionList directly from '@/components/question-list'
// The only difference is the header title: "Ngân hàng câu hỏi" vs "Danh sách câu hỏi"

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Question, QuestionType, QuestionDifficulty } from "@/types";

interface QuestionListProps {
  questions: Question[];
  selectedId?: string;
  onAddClick: () => void;
}

export function QuestionList({
  questions,
  selectedId,
  onAddClick,
}: QuestionListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Ngân hàng câu hỏi</h2>
        <Button onClick={onAddClick} size="lg" className="h-12 px-6">
          <Plus className="mr-2 h-5 w-5" />
          Thêm câu hỏi
        </Button>
      </div>

      <div className="grid gap-6">
        {questions.map((question, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">
                {question.type === QuestionType.SINGLE_CHOICE &&
                  "Trắc nghiệm một đáp án"}
                {question.type === QuestionType.MULTIPLE_CHOICE &&
                  "Trắc nghiệm nhiều đáp án"}
                {question.type === QuestionType.TRUE_FALSE && "Đúng/Sai"}
                {question.type === QuestionType.ESSAY && "Tự luận"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Câu hỏi:</p>
                  {question.difficulty && (
                    <div className="rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-600">
                      {question.difficulty === QuestionDifficulty.REMEMBERING &&
                        "Ghi nhớ"}
                      {question.difficulty ===
                        QuestionDifficulty.UNDERSTANDING && "Thông hiểu"}
                      {question.difficulty === QuestionDifficulty.APPLYING &&
                        "Vận dụng"}
                      {question.difficulty === QuestionDifficulty.ANALYZING &&
                        "Phân tích"}
                      {question.difficulty === QuestionDifficulty.EVALUATING &&
                        "Đánh giá"}
                      {question.difficulty === QuestionDifficulty.CREATING &&
                        "Sáng tạo"}
                    </div>
                  )}
                </div>
                <p>{question.content.text}</p>
                {question.options && (
                  <div>
                    <p className="font-medium mb-2">Đáp án:</p>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="flex items-center gap-2 rounded-lg border p-4"
                        >
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          <p>{option.content.text}</p>
                          {option.isCorrect && (
                            <div className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-medium text-emerald-600">
                              Đáp án đúng
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {question.referenceAnswer && (
                  <div>
                    <p className="font-medium">Đáp án tham khảo:</p>
                    <p>{question.referenceAnswer.content.text}</p>
                    {question.referenceAnswer.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {question.referenceAnswer.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
