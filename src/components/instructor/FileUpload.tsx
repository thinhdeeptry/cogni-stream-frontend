"use client";

import { useRef, useState } from "react";

import {
  AlertCircle,
  FileCheck,
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UploadedFile {
  file: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
  googleFileId?: string;
  webViewLink?: string;
}

interface FileUploadProps {
  type: "qualifications" | "portfolio";
  maxFiles?: number;
  onFilesChange: (files: File[]) => void;
  onUploadedLinksChange: (links: string[]) => void;
  title: string;
  description: string;
  accept?: string;
}

export function FileUpload({
  type,
  maxFiles = 5,
  onFilesChange,
  onUploadedLinksChange,
  title,
  description,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    const currentFileCount = files.length;

    for (let i = 0; i < selectedFiles.length; i++) {
      if (currentFileCount + newFiles.length >= maxFiles) {
        break;
      }

      const file = selectedFiles[i];

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        continue;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];

      if (!allowedTypes.includes(file.type)) {
        continue;
      }

      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file);
      }

      newFiles.push({
        file,
        preview,
        uploading: false,
        uploaded: false,
      });
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);

    // Notify parent component
    const allFiles = updatedFiles.map((f) => f.file);
    onFilesChange(allFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    // Notify parent component
    const allFiles = updatedFiles.map((f) => f.file);
    onFilesChange(allFiles);

    // Update uploaded links
    const uploadedLinks = updatedFiles
      .filter((f) => f.uploaded && f.webViewLink)
      .map((f) => f.webViewLink!);
    onUploadedLinksChange(uploadedLinks);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (file.type === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <FileCheck className="h-5 w-5 text-green-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver
            ? "border-orange-400 bg-orange-50"
            : "border-slate-300 hover:border-orange-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          <Upload
            className={`mx-auto h-12 w-12 mb-4 ${
              isDragOver ? "text-orange-500" : "text-slate-400"
            }`}
          />
          <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-600 mb-4">{description}</p>

          <div className="space-y-2 text-xs text-slate-500">
            <p>Kéo thả file vào đây hoặc click để chọn</p>
            <p>Hỗ trợ: PDF, Word, JPEG, PNG (tối đa 10MB)</p>
            <p>Tối đa {maxFiles} files</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">
            Files đã chọn ({files.length}/{maxFiles})
          </h4>

          {files.map((uploadedFile, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center gap-3">
                {/* File Icon/Preview */}
                <div className="flex-shrink-0">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center">
                      {getFileIcon(uploadedFile.file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>

                  {/* Status */}
                  {uploadedFile.uploading && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Đang upload...
                      </div>
                      <Progress value={50} className="mt-1 h-1" />
                    </div>
                  )}

                  {uploadedFile.uploaded && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        <FileCheck className="w-3 h-3 mr-1" />
                        Đã upload
                      </Badge>
                      {uploadedFile.webViewLink && (
                        <a
                          href={uploadedFile.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Xem file
                        </a>
                      )}
                    </div>
                  )}

                  {uploadedFile.error && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="bg-red-100 text-red-800"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Lỗi
                      </Badge>
                      <p className="text-xs text-red-600">
                        {uploadedFile.error}
                      </p>
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="flex-shrink-0 text-slate-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
