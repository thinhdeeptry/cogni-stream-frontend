"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Course, LessonType } from "@/types/course/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import {
  ArrowBigRight,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
} from "lucide-react";
import ReactPlayer from "react-player";
import { JSX } from "react/jsx-runtime";

import { getCourseById, getLessonById } from "@/actions/courseAction";
import { getThreadByResourceId } from "@/actions/discussion.action";

import useUserStore from "@/stores/useUserStore";

import Discussion from "@/components/discussion";
import { DiscussionType } from "@/components/discussion/type";
import { Button } from "@/components/ui/button";

interface Block {
  id: string;
  type: string;
  props: {
    textColor?: string;
    backgroundColor?: string;
    textAlignment?: string;
    level?: number;
    name?: string;
    url?: string;
    caption?: string;
    showPreview?: boolean;
    previewWidth?: number;
  };
  content?: Array<{
    type: string;
    text: string;
    styles: Record<string, any>;
  }>;
  children: Block[];
}

const renderBlockToHtml = (block: Block): JSX.Element => {
  // Xử lý màu sắc và background
  const textColorStyle =
    block.props.textColor !== "default" ? { color: block.props.textColor } : {};
  const backgroundColorStyle =
    block.props.backgroundColor !== "default"
      ? { backgroundColor: block.props.backgroundColor }
      : {};
  const textAlignStyle = {
    textAlign: block.props.textAlignment as React.CSSProperties["textAlign"],
  };

  const baseStyles = {
    ...textColorStyle,
    ...backgroundColorStyle,
    ...textAlignStyle,
  };

  // Render nội dung content
  const renderContent = () => {
    if (!block.content) return null;

    return block.content.map((contentItem, index) => {
      if (contentItem.type === "link") {
        return (
          <a
            key={index}
            href={contentItem.text}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {contentItem.text
              ?.split(" ")
              .map((word: string, linkIndex: number) => (
                <span key={linkIndex} style={contentItem.styles}>
                  {word}
                </span>
              ))}
          </a>
        );
      }

      const textStyles = {
        ...contentItem.styles,
        ...(contentItem.styles?.bold && { fontWeight: "bold" }),
        ...(contentItem.styles?.italic && { fontStyle: "italic" }),
        ...(contentItem.styles?.underline && { textDecoration: "underline" }),
        ...(contentItem.styles?.strike && { textDecoration: "line-through" }),
        ...(contentItem.styles?.textColor && {
          color: contentItem.styles.textColor,
        }),
      };

      return (
        <span key={index} style={textStyles}>
          {contentItem.text}
        </span>
      );
    });
  };

  switch (block.type) {
    case "paragraph":
      return (
        <p className="mb-4" style={baseStyles}>
          {renderContent()}
        </p>
      );

    case "heading":
      const HeadingTag =
        `h${block.props.level || 1}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag
          className={`mb-4 font-semibold ${
            block.props.level === 1
              ? "text-3xl"
              : block.props.level === 2
                ? "text-2xl"
                : "text-xl"
          }`}
          style={baseStyles}
        >
          {renderContent()}
        </HeadingTag>
      );

    case "quote":
      return (
        <blockquote
          className="border-l-4 border-gray-300 pl-4 italic my-4"
          style={baseStyles}
        >
          {renderContent()}
          {block.children.length > 0 && (
            <div className="mt-2 pl-4">
              {block.children.map((child, index) => (
                <div key={child.id || `child-${index}`}>
                  {renderBlockToHtml(child)}
                </div>
              ))}
            </div>
          )}
        </blockquote>
      );

    case "bulletListItem":
      return (
        <li className="list-disc ml-6 my-1" style={baseStyles}>
          {renderContent()}
          {block.children.length > 0 && (
            <ul className="ml-6">
              {block.children.map((child) => renderBlockToHtml(child))}
            </ul>
          )}
        </li>
      );

    case "numberedListItem":
      return (
        <li className="list-decimal ml-6 my-1" style={baseStyles}>
          {renderContent()}
          {block.children.length > 0 && (
            <ol className="ml-6">
              {block.children.map((child) => renderBlockToHtml(child))}
            </ol>
          )}
        </li>
      );

    case "codeBlock":
      return (
        <pre
          className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"
          style={baseStyles}
        >
          <code className="language-text">{renderContent()}</code>
        </pre>
      );

    case "table":
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border">
            <tbody>
              {(block.content as any)?.rows?.map(
                (row: any, rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.cells.map(
                      (
                        cell: {
                          props: {
                            textAlignment?: string;
                            backgroundColor?: string;
                            textColor?: string;
                            colspan?: number;
                            rowspan?: number;
                          };
                          content: Array<{
                            styles: Record<string, any>;
                            text: string;
                          }>;
                        },
                        cellIndex: number,
                      ) => {
                        const cellStyles = {
                          ...baseStyles,
                          textAlign: cell.props.textAlignment,
                          backgroundColor: cell.props.backgroundColor,
                          color: cell.props.textColor,
                          ...(cell.props.colspan && {
                            colspan: cell.props.colspan,
                          }),
                          ...(cell.props.rowspan && {
                            rowspan: cell.props.rowspan,
                          }),
                        };

                        return (
                          <td
                            key={cellIndex}
                            className="border p-2"
                            style={{
                              textAlign: cell.props
                                .textAlignment as React.CSSProperties["textAlign"],
                              backgroundColor: cell.props.backgroundColor,
                              color: cell.props.textColor,
                              ...(cell.props.colspan && {
                                colSpan: cell.props.colspan,
                              }),
                              ...(cell.props.rowspan && {
                                rowSpan: cell.props.rowspan,
                              }),
                            }}
                          >
                            {cell.content.map((content, contentIndex) => (
                              <span key={contentIndex} style={content.styles}>
                                {content.text}
                              </span>
                            ))}
                          </td>
                        );
                      },
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      );

    case "image":
      return (
        <div className="my-4" style={baseStyles}>
          <img
            src={block.props.url}
            alt={block.props.name || "Lesson image"}
            className="max-w-full rounded-lg mx-auto"
            style={{
              width: block.props.previewWidth
                ? `${block.props.previewWidth}px`
                : "100%",
              maxWidth: "100%",
              height: "auto",
            }}
          />
          {block.props.caption && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              {block.props.caption}
            </p>
          )}
        </div>
      );

    case "video":
      return (
        <div className="my-4" style={baseStyles}>
          <div className="aspect-video w-full">
            <ReactPlayer
              url={block.props.url}
              controls={true}
              width="100%"
              height="100%"
              className="rounded-lg"
            />
          </div>
          {block.props.caption && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              {block.props.caption}
            </p>
          )}
        </div>
      );

    default:
      console.warn(`Unsupported block type: ${block.type}`);
      return (
        <div className="my-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          [Unsupported block type: {block.type}]
        </div>
      );
  }
};

export default function LessonDetail() {
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEnrolled] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const { user } = useUserStore();
  const params = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, lessonData] = await Promise.all([
          getCourseById(params.courseId as string),
          getLessonById(params.lessonId as string),
        ]);
        setCourse(courseData);
        setLesson(lessonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.courseId, params.lessonId]);

  useEffect(() => {
    const lessonTitle = lesson?.title || `Lesson ${params.lessonId}`;

    const fetchOrCreateThread = async () => {
      if (!params.lessonId || !user) {
        return;
      }

      try {
        const thread = await getThreadByResourceId(
          params.lessonId as string,
          DiscussionType.LESSON_DISCUSSION,
        );

        if (thread) {
          setThreadId(thread.id);
        }
      } catch (err) {
        console.error("Error in discussion thread handling:", err);
      }
    };

    if (lesson && user && !threadId) {
      fetchOrCreateThread();
    }
  }, [params.lessonId, user, threadId, lesson]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!course || !lesson) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Không tìm thấy khoá học hoặc bài học!
      </div>
    );
  }

  const allLessons =
    course.chapters?.flatMap((chapter) => chapter.lessons) || [];
  const currentLessonIndex = allLessons.findIndex(
    (lessonItem) => lessonItem?.id === params.lessonId,
  );
  const previousLesson =
    currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  // Parse lesson content for BLOG or MIXED types
  let contentBlocks: Block[] = [];
  if (
    lesson.content &&
    (lesson.type === LessonType.BLOG || lesson.type === LessonType.MIXED)
  ) {
    try {
      contentBlocks = JSON.parse(lesson.content);
    } catch (error) {
      console.error("Error parsing lesson content:", error);
    }
  }

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen relative">
      <div
        className={`flex-1 p-6 ${isSidebarOpen ? "pr-[400px]" : ""} transition-all duration-300`}
      >
        <div className="space-y-8">
          {/* Video Content for VIDEO or MIXED */}
          {(lesson.type === LessonType.VIDEO ||
            lesson.type === LessonType.MIXED) &&
            lesson.videoUrl && (
              <div className="aspect-video w-full bg-gray-100 rounded-lg mb-8">
                <ReactPlayer
                  url={lesson.videoUrl}
                  controls={true}
                  config={{
                    youtube: {
                      playerVars: { showinfo: 1 },
                    },
                  }}
                  className="react-player"
                  width="100%"
                  height="100%"
                />
              </div>
            )}

          {/* Lesson Content */}
          <div className="prose max-w-none">
            <h1 className="text-2xl font-semibold mb-4">Nội dung bài học</h1>
            <h1 className="text-xl font-semibold mb-4">
              <span>{lesson.order}. </span>
              {lesson.title}
            </h1>

            {/* Render Parsed Content for BLOG or MIXED */}
            {(lesson.type === LessonType.BLOG ||
              lesson.type === LessonType.MIXED) &&
              contentBlocks.length > 0 && (
                <div className="mt-4">
                  {contentBlocks.map((block) => (
                    <div key={block.id}>{renderBlockToHtml(block)}</div>
                  ))}
                </div>
              )}

            {/* Fallback for VIDEO-only or empty content */}
            {lesson.type === LessonType.VIDEO && !lesson.videoUrl && (
              <p className="text-md text-gray-500">Không có nội dung video.</p>
            )}
            {(lesson.type === LessonType.BLOG ||
              lesson.type === LessonType.MIXED) &&
              contentBlocks.length === 0 && (
                <p className="text-md text-gray-500">
                  Không có nội dung bài viết.
                </p>
              )}
          </div>

          {/* Discussion Component */}
          <Discussion threadId={threadId || ""} />
        </div>
      </div>

      {/* Fixed Navigation Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-6 py-4 z-10">
        <div className="flex items-center justify-center gap-4">
          {previousLesson ? (
            <Link href={`/course/${course.id}/lesson/${previousLesson.id}`}>
              <Button variant="outline" className="w-40">
                <ChevronLeft className="mr-2 h-4 w-4" /> Bài trước
              </Button>
            </Link>
          ) : (
            <Button variant="outline" className="w-40" disabled>
              <ChevronLeft className="mr-2 h-4 w-4" /> Bài trước
            </Button>
          )}
          {nextLesson ? (
            <Link href={`/course/${course.id}/lesson/${nextLesson.id}`}>
              <Button variant="outline" className="w-40">
                Học tiếp <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" className="w-40" disabled>
              Học tiếp <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="absolute top-1/4 right-4 flex items-center">
          <span className="text-md text-gray-600 font-semibold pr-2">
            {course.chapters?.find((chapter) =>
              chapter.lessons?.some((lesson) => lesson.id === params.lessonId),
            )?.title || ""}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white border shadow-sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <ArrowBigRight className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Sidebar */}
      <div
        className={`fixed right-0 top-0 h-[calc(100vh-73px)] w-[350px] bg-gray-50 border-l transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 h-full overflow-auto">
          <h2 className="text-xl font-semibold mb-6">Nội dung khoá học</h2>
          <div className="space-y-4">
            {course.chapters?.map((chapter) => (
              <Collapsible key={chapter.id}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="text-gray-500">
                      <Plus className="h-4 w-4 text-orange-500" />
                    </div>
                    <h3 className="font-semibold text-gray-700">
                      {chapter.title}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-600">
                    {chapter.lessons?.length || 0} bài
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4">
                  <ul className="mt-2 space-y-2">
                    {chapter.lessons?.map((lesson) => (
                      <Link
                        href={
                          lesson.isFreePreview || isEnrolled
                            ? `/course/${course.id}/lesson/${lesson.id}`
                            : "#"
                        }
                        key={lesson.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          lesson.id === params.lessonId
                            ? "bg-orange-100"
                            : "hover:bg-gray-200"
                        } ${!lesson.isFreePreview && !isEnrolled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        onClick={(e) => {
                          if (!lesson.isFreePreview && !isEnrolled) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`${lesson.id === params.lessonId ? "font-medium" : ""}`}
                          >
                            {lesson.title}
                          </span>
                          {lesson.isFreePreview && (
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                              Preview
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
