// Enhanced conversation analysis for smarter AI responses

interface ConversationAnalysis {
  userLearningStyle:
    | "visual"
    | "auditory"
    | "kinesthetic"
    | "reading"
    | "unknown";
  userConfidenceLevel: "beginner" | "intermediate" | "advanced" | "unknown";
  topicsDiscussed: string[];
  userPreferences: string[];
  commonQuestionTypes: string[];
  learningChallenges: string[];
  conversationFlow: "greeting" | "learning" | "clarification" | "wrapping_up";
  lastIntent:
    | "question"
    | "thanks"
    | "confirmation"
    | "confusion"
    | "request_example";
}

export function analyzeConversation(messages: any[]): ConversationAnalysis {
  const userMessages = messages.filter((m) => m.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1];

  // Analyze last intent
  const lastIntent = detectIntent(lastUserMessage?.content || "");

  // Analyze learning style based on question patterns
  const userLearningStyle = detectLearningStyle(userMessages);

  // Detect confidence level
  const userConfidenceLevel = detectConfidenceLevel(userMessages);

  // Extract topics discussed
  const topicsDiscussed = extractTopics(messages);

  // Detect user preferences
  const userPreferences = detectPreferences(userMessages);

  // Classify question types
  const commonQuestionTypes = classifyQuestions(userMessages);

  // Identify learning challenges
  const learningChallenges = identifyLearningChallenges(userMessages);

  // Determine conversation flow
  const conversationFlow = determineConversationFlow(messages);

  return {
    userLearningStyle,
    userConfidenceLevel,
    topicsDiscussed,
    userPreferences,
    commonQuestionTypes,
    learningChallenges,
    conversationFlow,
    lastIntent,
  };
}

function detectIntent(message: string): ConversationAnalysis["lastIntent"] {
  const lowerMessage = message.toLowerCase();

  if (
    /^(cảm ơn|thanks|thank you|tks|cám ơn|ok|được rồi|hiểu rồi)/.test(
      lowerMessage,
    )
  ) {
    return "thanks";
  }

  if (/^(đúng|chính xác|exactly|correct|vâng|ừm|uhm)/.test(lowerMessage)) {
    return "confirmation";
  }

  if (
    /(không hiểu|chưa rõ|confuse|unclear|hơi khó|không rõ)/.test(lowerMessage)
  ) {
    return "confusion";
  }

  if (/(ví dụ|example|minh họa|demo|thực tế)/.test(lowerMessage)) {
    return "request_example";
  }

  if (
    /[?？]/.test(message) ||
    /(gì|sao|thế nào|tại sao|how|what|why)/.test(lowerMessage)
  ) {
    return "question";
  }

  return "question"; // default
}

function detectLearningStyle(
  userMessages: any[],
): ConversationAnalysis["userLearningStyle"] {
  const allText = userMessages.map((m) => m.content.toLowerCase()).join(" ");

  const visualKeywords = [
    "hình ảnh",
    "sơ đồ",
    "chart",
    "diagram",
    "visual",
    "nhìn",
    "xem",
  ];
  const auditoryKeywords = [
    "nghe",
    "giải thích",
    "nói",
    "audio",
    "sound",
    "listen",
  ];
  const kinestheticKeywords = [
    "thực hành",
    "làm",
    "practice",
    "hands-on",
    "thử",
    "demo",
  ];
  const readingKeywords = [
    "đọc",
    "text",
    "viết",
    "tài liệu",
    "document",
    "notes",
  ];

  const scores = {
    visual: visualKeywords.filter((kw) => allText.includes(kw)).length,
    auditory: auditoryKeywords.filter((kw) => allText.includes(kw)).length,
    kinesthetic: kinestheticKeywords.filter((kw) => allText.includes(kw))
      .length,
    reading: readingKeywords.filter((kw) => allText.includes(kw)).length,
  };

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "unknown";

  return Object.keys(scores).find(
    (key) => scores[key as keyof typeof scores] === maxScore,
  ) as ConversationAnalysis["userLearningStyle"];
}

function detectConfidenceLevel(
  userMessages: any[],
): ConversationAnalysis["userConfidenceLevel"] {
  const allText = userMessages.map((m) => m.content.toLowerCase()).join(" ");

  const beginnerIndicators = [
    "mới bắt đầu",
    "chưa hiểu",
    "không biết",
    "beginner",
    "new",
    "cơ bản",
  ];
  const intermediateIndicators = [
    "hiểu một phần",
    "đã học",
    "intermediate",
    "có kinh nghiệm",
  ];
  const advancedIndicators = [
    "đã biết",
    "advanced",
    "expert",
    "chuyên sâu",
    "chi tiết hơn",
  ];

  const beginnerScore = beginnerIndicators.filter((ind) =>
    allText.includes(ind),
  ).length;
  const intermediateScore = intermediateIndicators.filter((ind) =>
    allText.includes(ind),
  ).length;
  const advancedScore = advancedIndicators.filter((ind) =>
    allText.includes(ind),
  ).length;

  if (advancedScore > beginnerScore && advancedScore > intermediateScore)
    return "advanced";
  if (intermediateScore > beginnerScore) return "intermediate";
  if (beginnerScore > 0) return "beginner";

  return "unknown";
}

function extractTopics(messages: any[]): string[] {
  const allContent = messages.map((m) => m.content).join(" ");

  // Simple topic extraction based on common educational keywords
  const topics: string[] = [];
  const topicPatterns = [
    /pandas|dataframe/gi,
    /python|programming/gi,
    /javascript|js/gi,
    /react|component/gi,
    /css|styling/gi,
    /database|sql/gi,
    /api|endpoint/gi,
    /machine learning|ml|ai/gi,
  ];

  topicPatterns.forEach((pattern) => {
    const matches = allContent.match(pattern);
    if (matches) {
      topics.push(matches[0].toLowerCase());
    }
  });

  return [...new Set(topics)]; // Remove duplicates
}

function detectPreferences(userMessages: any[]): string[] {
  const preferences: string[] = [];
  const allText = userMessages.map((m) => m.content.toLowerCase()).join(" ");

  if (/(ví dụ|example)/.test(allText)) preferences.push("examples");
  if (/(thực tế|practical|real-world)/.test(allText))
    preferences.push("practical_application");
  if (/(step by step|từng bước|chi tiết)/.test(allText))
    preferences.push("step_by_step");
  if (/(nhanh|quick|summary|tóm tắt)/.test(allText))
    preferences.push("concise_answers");
  if (/(code|lập trình|programming)/.test(allText))
    preferences.push("code_examples");

  return preferences;
}

function classifyQuestions(userMessages: any[]): string[] {
  const questionTypes: string[] = [];

  userMessages.forEach((msg) => {
    const content = msg.content.toLowerCase();

    if (/(gì là|what is|define)/.test(content))
      questionTypes.push("definition");
    if (/(tại sao|why|lý do)/.test(content)) questionTypes.push("explanation");
    if (/(làm thế nào|how to|cách)/.test(content)) questionTypes.push("how_to");
    if (/(ví dụ|example|minh họa)/.test(content))
      questionTypes.push("example_request");
    if (/(so sánh|compare|khác biệt)/.test(content))
      questionTypes.push("comparison");
    if (/(best practice|tốt nhất|nên)/.test(content))
      questionTypes.push("best_practice");
  });

  return [...new Set(questionTypes)];
}

function identifyLearningChallenges(userMessages: any[]): string[] {
  const challenges: string[] = [];
  const allText = userMessages.map((m) => m.content.toLowerCase()).join(" ");

  if (/(khó hiểu|difficult|hard|confusing)/.test(allText))
    challenges.push("comprehension");
  if (/(nhớ|remember|memory|quên)/.test(allText)) challenges.push("retention");
  if (/(áp dụng|apply|practice|thực hành)/.test(allText))
    challenges.push("application");
  if (/(nhanh|time|thời gian|rush)/.test(allText))
    challenges.push("time_management");
  if (/(cơ bản|basic|foundation|nền tảng)/.test(allText))
    challenges.push("fundamentals");

  return challenges;
}

function determineConversationFlow(
  messages: any[],
): ConversationAnalysis["conversationFlow"] {
  const messageCount = messages.filter((m) => m.role !== "system").length;
  const lastUserMessage = messages.filter((m) => m.role === "user").pop();

  if (messageCount <= 2) return "greeting";

  const lastContent = lastUserMessage?.content.toLowerCase() || "";

  if (/(cảm ơn|thanks|bye|tạm biệt)/.test(lastContent)) return "wrapping_up";
  if (/(không hiểu|chưa rõ|unclear)/.test(lastContent)) return "clarification";

  return "learning";
}

// Generate smart response suggestions based on conversation analysis
export function generateSmartSuggestions(
  analysis: ConversationAnalysis,
  currentContext: { courseName?: string; lessonName?: string },
): string[] {
  const suggestions: string[] = [];

  switch (analysis.lastIntent) {
    case "thanks":
      suggestions.push(
        "Có gì khác tôi có thể giúp không?",
        "Bạn muốn tìm hiểu thêm về chủ đề nào?",
        "Cần hỗ trợ thêm về bài tiếp theo không?",
      );
      break;

    case "confusion":
      suggestions.push(
        "Giải thích bằng cách khác đơn giản hơn",
        "Cho ví dụ cụ thể về điều này",
        "Chia nhỏ thành các bước đơn giản",
      );
      break;

    case "request_example":
      suggestions.push(
        "Ví dụ thực tế trong công việc",
        "Demo code chi tiết",
        "Case study cụ thể",
      );
      break;

    default:
      if (analysis.userLearningStyle === "visual") {
        suggestions.push("Vẽ sơ đồ minh họa", "Tạo visual guide");
      }
      if (analysis.userLearningStyle === "kinesthetic") {
        suggestions.push("Bài tập thực hành", "Project mini");
      }
      break;
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
}
