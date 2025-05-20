"use client";

import { ContentItem, Question, QuestionType } from "@/types/assessment/types";
import { CheckCircle2, XCircle } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface ResultQuestionViewProps {
  question: Question;
  optionOrder?: string[];
  userAnswer: any;
  earnedScore: number;
  maxScore: number;
  feedback: string;
  referenceAnswer?: {
    content: ContentItem;
    notes?: string;
  };
}

export function ResultQuestionView({
  question,
  optionOrder,
  userAnswer,
  earnedScore,
  maxScore,
  feedback,
  referenceAnswer,
}: ResultQuestionViewProps) {
  const orderedOptions = optionOrder
    ? question.options?.sort(
        (a, b) => optionOrder.indexOf(a.id!) - optionOrder.indexOf(b.id!),
      )
    : question.options;

  const isCorrect = earnedScore === maxScore;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
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
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isCorrect
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {isCorrect ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Đúng
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Sai
                </span>
              )}
            </div>
          </div>
          <div className="text-sm font-medium">
            Điểm: {earnedScore}/{maxScore}
          </div>
        </div>

        <div
          className="text-base"
          dangerouslySetInnerHTML={{ __html: question.content.text }}
        />
      </div>

      <div className="space-y-4">
        {(question.type === QuestionType.SINGLE_CHOICE ||
          question.type === QuestionType.TRUE_FALSE) && (
          <RadioGroup value={userAnswer as string} disabled>
            <div className="space-y-3">
              {orderedOptions?.map((option, index) => {
                const isUserChoice = option.id === userAnswer;
                const isCorrectOption = option.isCorrect;

                return (
                  <div
                    key={option.id}
                    className={`flex items-center space-x-3 space-y-0 p-2 rounded-md ${
                      isUserChoice && isCorrectOption
                        ? "bg-green-50"
                        : isUserChoice && !isCorrectOption
                          ? "bg-red-50"
                          : !isUserChoice && isCorrectOption
                            ? "bg-green-50/50"
                            : ""
                    }`}
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
                        dangerouslySetInnerHTML={{
                          __html: option.content.text,
                        }}
                      />
                      {isCorrectOption && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 ml-2" />
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        )}

        {question.type === QuestionType.MULTIPLE_CHOICE && (
          <div className="space-y-3">
            {orderedOptions?.map((option, index) => {
              const isUserChoice = Array.isArray(userAnswer)
                ? userAnswer.includes(option.id)
                : false;
              const isCorrectOption = option.isCorrect;

              return (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 space-y-0 p-2 rounded-md ${
                    isUserChoice && isCorrectOption
                      ? "bg-green-50"
                      : isUserChoice && !isCorrectOption
                        ? "bg-red-50"
                        : !isUserChoice && isCorrectOption
                          ? "bg-green-50/50"
                          : ""
                  }`}
                >
                  <Checkbox id={option.id} checked={isUserChoice} disabled />
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
                    {isCorrectOption && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 ml-2" />
                    )}
                  </Label>
                </div>
              );
            })}
          </div>
        )}

        {question.type === QuestionType.ESSAY && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Câu trả lời của bạn:</div>
            <Textarea
              value={userAnswer || ""}
              disabled
              className="min-h-[100px]"
            />
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-4 bg-gray-50 rounded-md">
          <div className="text-sm font-medium mb-1">Phản hồi:</div>
          <div className="text-sm">{feedback}</div>
        </div>
      )}

      {referenceAnswer && (
        <div className="p-4 bg-blue-50 rounded-md">
          <div className="text-sm font-medium mb-1">Đáp án tham khảo:</div>
          <div className="text-sm">{referenceAnswer.content.text}</div>
          {referenceAnswer.notes && (
            <div className="mt-2">
              <div className="text-sm font-medium mb-1">Ghi chú:</div>
              <div className="text-sm">{referenceAnswer.notes}</div>
            </div>
          )}
        </div>
      )}

      {question.explanation && (
        <div className="p-4 bg-yellow-50 rounded-md">
          <div className="text-sm font-medium mb-1">Giải thích:</div>
          <div className="text-sm">{question.explanation}</div>
        </div>
      )}
    </div>
  );
}
