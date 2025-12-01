"use client";

import React from "react";

import ReactPlayer from "react-player";

// Interface for lesson content blocks
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

// Render block function for lesson content
const renderBlockToHtml = (block: Block): React.ReactElement => {
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
            {contentItem.text}
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
      const level = block.props.level || 1;
      const HeadingComponent =
        level === 1
          ? "h1"
          : level === 2
            ? "h2"
            : level === 3
              ? "h3"
              : level === 4
                ? "h4"
                : level === 5
                  ? "h5"
                  : "h6";
      return React.createElement(
        HeadingComponent,
        {
          className: `mb-4 font-semibold ${level === 1 ? "text-3xl" : level === 2 ? "text-2xl" : "text-xl"}`,
          style: baseStyles,
        },
        renderContent(),
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
                <div key={index}>{renderBlockToHtml(child)}</div>
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
          className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto my-4"
          style={baseStyles}
        >
          <code>{renderContent()}</code>
        </pre>
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
      return (
        <div className="my-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          [Unsupported block type: {block.type}]
        </div>
      );
  }
};

interface LessonContentRendererProps {
  content: Block[] | string | undefined;
}

export function LessonContentRenderer({ content }: LessonContentRendererProps) {
  // Handle undefined content
  if (!content) {
    return (
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-500">No content available</p>
      </div>
    );
  }

  // Handle string content
  if (typeof content === "string") {
    return (
      <div className="prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }

  // Handle non-array content
  if (!Array.isArray(content)) {
    return (
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-500">Invalid content format</p>
      </div>
    );
  }

  // Handle array content (Block[])
  return (
    <div className="prose prose-lg max-w-none">
      {content.map((block, index) => (
        <div key={block.id || index}>{renderBlockToHtml(block)}</div>
      ))}
    </div>
  );
}

// Extract plain text from BlockNote content
export function extractPlainTextFromBlockNote(
  content: Block[] | string | undefined,
): string {
  // Handle case where content is undefined or null
  if (!content) {
    return "";
  }

  // Handle case where content is already a string
  if (typeof content === "string") {
    return content;
  }

  // Handle case where content is not an array
  if (!Array.isArray(content)) {
    return "";
  }

  const extractTextFromBlock = (block: Block): string => {
    let text = "";

    if (block.content && Array.isArray(block.content)) {
      text += block.content
        .map((item) => (item && item.text ? item.text : ""))
        .join(" ");
    }

    if (
      block.children &&
      Array.isArray(block.children) &&
      block.children.length > 0
    ) {
      text +=
        " " +
        block.children.map((child) => extractTextFromBlock(child)).join(" ");
    }

    return text;
  };

  return content
    .map((block) => extractTextFromBlock(block))
    .join(" ")
    .trim();
}
