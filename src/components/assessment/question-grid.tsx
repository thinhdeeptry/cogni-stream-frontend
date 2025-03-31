"use client";

interface QuestionGridProps {
  questions: Array<{
    id: string;
    isAnswered: boolean;
  }>;
  currentPage: number;
  onSelect: (index: number) => void;
}

export function QuestionGrid({
  questions,
  currentPage,
  onSelect,
}: QuestionGridProps) {
  const QUESTIONS_PER_PAGE = 4;
  const currentPageQuestions = questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE,
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Danh sách câu hỏi</h3>
        <p className="text-sm text-muted-foreground">
          Đã trả lời {questions.filter((q) => q.isAnswered).length}/
          {questions.length} câu
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {questions.map((question, index) => {
          const isInCurrentPage =
            Math.floor(index / QUESTIONS_PER_PAGE) === currentPage;
          return (
            <button
              key={question.id}
              className={`h-10 rounded-lg border text-sm font-medium transition-colors
                ${
                  isInCurrentPage
                    ? "border-primary bg-primary text-primary-foreground"
                    : question.isAnswered
                      ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      : "hover:bg-gray-50"
                }
              `}
              onClick={() => onSelect(index)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
