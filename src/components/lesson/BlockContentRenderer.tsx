"use client";

import React from "react";

import { motion } from "framer-motion";
import ReactPlayer from "react-player";

export interface Block {
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

interface BlockContentRendererProps {
  blocks: Block[];
}

export function BlockContentRenderer({ blocks }: BlockContentRendererProps) {
  const renderBlockToHtml = (block: Block): React.JSX.Element => {
    // Xử lý màu sắc và background
    const textColorStyle =
      block.props.textColor !== "default"
        ? { color: block.props.textColor }
        : {};
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
        const HeadingTag = React.createElement;
        const headingLevel = `h${block.props.level || 1}`;
        return React.createElement(
          headingLevel,
          {
            className: `mb-4 font-semibold ${
              block.props.level === 1
                ? "text-3xl"
                : block.props.level === 2
                  ? "text-2xl"
                  : "text-xl"
            }`,
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
            className="bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"
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

  return (
    <div className="mt-4">
      {blocks.map((block, index) => (
        <motion.div
          key={block.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index, duration: 0.3 }}
        >
          {renderBlockToHtml(block)}
        </motion.div>
      ))}
    </div>
  );
}
