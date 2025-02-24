import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Question, QuestionType } from "@/types";

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
        <h2 className="text-2xl font-semibold">Danh sách câu hỏi</h2>
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
                <div>
                  <p className="font-medium">Câu hỏi:</p>
                  <p>{question.content.text}</p>
                </div>
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
