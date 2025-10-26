"use client";

import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: "uploading" | "success" | "error";
  errorMessage?: string;
}

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function FileUpload({
  onFilesChange,
  onUpload,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ["image/*", "application/pdf", ".doc", ".docx"],
  disabled = false,
  className,
  placeholder = "Kéo thả files vào đây hoặc click để chọn",
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
          uploadProgress: 0,
          uploadStatus: undefined,
        }),
      );

      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    },
    [files, maxFiles, onFilesChange],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: maxFiles - files.length,
      maxSize,
      accept: acceptedFileTypes.reduce(
        (acc, type) => {
          acc[type] = [];
          return acc;
        },
        {} as Record<string, string[]>,
      ),
      disabled: disabled || uploading,
    });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const handleUpload = async () => {
    if (!onUpload || files.length === 0) return;

    setUploading(true);
    try {
      // Update all files to uploading status
      const updatingFiles = files.map((file) => ({
        ...file,
        uploadStatus: "uploading" as const,
        uploadProgress: 0,
      }));
      setFiles(updatingFiles);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((file) => ({
            ...file,
            uploadProgress: Math.min((file.uploadProgress || 0) + 10, 90),
          })),
        );
      }, 200);

      await onUpload(files);

      clearInterval(progressInterval);

      // Mark all as success
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          uploadStatus: "success" as const,
          uploadProgress: 100,
        })),
      );
    } catch (error) {
      // Mark all as error
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          uploadStatus: "error" as const,
          errorMessage:
            error instanceof Error ? error.message : "Upload failed",
        })),
      );
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (file.type === "application/pdf") {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (file.type.startsWith("video/")) {
      return <Film className="h-4 w-4" />;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragActive ? "border-orange-400 bg-orange-50" : "border-slate-300",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <CardContent {...getRootProps()} className="p-6">
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <Upload
              className={cn(
                "h-8 w-8",
                isDragActive ? "text-orange-500" : "text-slate-400",
              )}
            />
            <div>
              <p className="text-sm font-medium text-slate-700">
                {placeholder}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Tối đa {maxFiles} files, mỗi file tối đa{" "}
                {formatFileSize(maxSize)}
              </p>
              <p className="text-xs text-slate-500">
                Hỗ trợ: {acceptedFileTypes.join(", ")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div
              key={file.name}
              className="text-sm text-red-600 bg-red-50 p-2 rounded"
            >
              <strong>{file.name}:</strong>
              <ul className="list-disc list-inside">
                {errors.map((error) => (
                  <li key={error.code}>{error.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700">
              Files đã chọn ({files.length}/{maxFiles})
            </h4>
            {onUpload && files.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
              >
                {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upload Files
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* File Preview/Icon */}
                    <div className="flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                          {getFileIcon(file)}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </p>

                      {/* Upload Progress */}
                      {file.uploadStatus === "uploading" && (
                        <div className="mt-2">
                          <Progress
                            value={file.uploadProgress || 0}
                            className="h-1"
                          />
                        </div>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2">
                      {file.uploadStatus === "success" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {file.uploadStatus === "error" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {file.uploadStatus === "uploading" && (
                        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {file.uploadStatus === "error" && file.errorMessage && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      {file.errorMessage}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
