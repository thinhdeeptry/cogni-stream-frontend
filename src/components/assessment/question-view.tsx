"use client";

import { Question, QuestionType } from "@/types/assessment/types";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface QuestionViewProps {
  question: Question;
  optionOrder?: string[];
  answer: any;
  onAnswer: (answer: any) => void;
  disabled?: boolean;
}

export function QuestionView({
  question,
  optionOrder,
  answer,
  onAnswer,
  disabled = false,
}: QuestionViewProps) {
  const orderedOptions = optionOrder
    ? question.options?.sort(
        (a, b) => optionOrder.indexOf(a.id!) - optionOrder.indexOf(b.id!),
      )
    : question.options;

  const handleSingleChoiceChange = (value: string) => {
    if (disabled) return;
    onAnswer(value);
  };

  const handleMultipleChoiceChange = (optionId: string, checked: boolean) => {
    if (disabled) return;
    const currentAnswer = (answer as string[]) || [];
    if (checked) {
      onAnswer([...currentAnswer, optionId]);
    } else {
      onAnswer(currentAnswer.filter((id) => id !== optionId));
    }
  };

  const handleEssayChange = (value: string) => {
    if (disabled) return;
    onAnswer(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium 
            ${question.type === QuestionType.SINGLE_CHOICE ? "bg-blue-50 text-blue-700" : ""}
            ${question.type === QuestionType.MULTIPLE_CHOICE ? "bg-purple-50 text-purple-700" : ""}
            ${question.type === QuestionType.TRUE_FALSE ? "bg-green-50 text-green-700" : ""}
            ${question.type === QuestionType.ESSAY ? "bg-orange-50 text-orange-700" : ""}`}
          >
            {question.type === QuestionType.SINGLE_CHOICE &&
              "Trắc nghiệm một đáp án"}
            {question.type === QuestionType.MULTIPLE_CHOICE &&
              "Trắc nghiệm nhiều đáp án"}
            {question.type === QuestionType.TRUE_FALSE && "Đúng/Sai"}
            {question.type === QuestionType.ESSAY && "Tự luận"}
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium 
            ${question.difficulty === "REMEMBERING" ? "bg-slate-50 text-slate-700" : ""}
            ${question.difficulty === "UNDERSTANDING" ? "bg-emerald-50 text-emerald-700" : ""}
            ${question.difficulty === "APPLYING" ? "bg-amber-50 text-amber-700" : ""}
            ${question.difficulty === "ANALYZING" ? "bg-rose-50 text-rose-700" : ""}
            ${question.difficulty === "EVALUATING" ? "bg-violet-50 text-violet-700" : ""}
            ${question.difficulty === "CREATING" ? "bg-pink-50 text-pink-700" : ""}`}
          >
            {question.difficulty === "REMEMBERING" && "Ghi nhớ"}
            {question.difficulty === "UNDERSTANDING" && "Thông hiểu"}
            {question.difficulty === "APPLYING" && "Vận dụng"}
            {question.difficulty === "ANALYZING" && "Phân tích"}
            {question.difficulty === "EVALUATING" && "Đánh giá"}
            {question.difficulty === "CREATING" && "Sáng tạo"}
          </div>
        </div>

        <div
          className="text-lg font-medium"
          dangerouslySetInnerHTML={{ __html: question.content.text }}
        />
      </div>

      <div className="space-y-4">
        {(question.type === QuestionType.SINGLE_CHOICE ||
          question.type === QuestionType.TRUE_FALSE) && (
          <RadioGroup
            value={answer as string}
            onValueChange={handleSingleChoiceChange}
            disabled={disabled}
          >
            <div className="space-y-3">
              {orderedOptions?.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 space-y-0"
                >
                  <RadioGroupItem value={option.id!} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="text-base font-normal flex gap-3"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div
                      dangerouslySetInnerHTML={{ __html: option.content.text }}
                    />
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        {question.type === QuestionType.MULTIPLE_CHOICE && (
          <div className="space-y-3">
            {orderedOptions?.map((option, index) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 space-y-0"
              >
                <Checkbox
                  id={option.id}
                  checked={(answer as string[])?.includes(option.id!)}
                  onCheckedChange={(checked) =>
                    handleMultipleChoiceChange(option.id!, checked as boolean)
                  }
                  disabled={disabled}
                />
                <Label
                  htmlFor={option.id}
                  className="text-base font-normal flex gap-3"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <div
                    dangerouslySetInnerHTML={{ __html: option.content.text }}
                  />
                </Label>
              </div>
            ))}
          </div>
        )}

        {question.type === QuestionType.ESSAY && (
          <Textarea
            placeholder="Nhập câu trả lời của bạn..."
            className="min-h-[200px]"
            value={(answer as string) || ""}
            onChange={(e) => handleEssayChange(e.target.value)}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
