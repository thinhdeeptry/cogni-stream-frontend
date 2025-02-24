"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Music, X, Plus } from "lucide-react";
import Image from "next/image";
import type { ContentItem } from "@/types";

interface ContentEditorProps {
  value: ContentItem;
  onChange: (value: ContentItem) => void;
  placeholder?: string;
}

export function ContentEditor({
  value,
  onChange,
  placeholder,
}: ContentEditorProps) {
  const [showMediaUpload, setShowMediaUpload] = useState(false);

  const handleTextChange = (text: string) => {
    onChange({ ...value, text });
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({
        ...value,
        image: e.target?.result as string,
      });
      setShowMediaUpload(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (files: FileList | null) => {
    if (!files) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({
        ...value,
        audio: e.target?.result as string,
      });
      setShowMediaUpload(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onChange({
      ...value,
      image: undefined,
    });
  };

  const handleRemoveAudio = () => {
    onChange({
      ...value,
      audio: undefined,
    });
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={value.text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] resize-y text-base leading-relaxed"
      />

      <div className="grid grid-cols-2 gap-6">
        {value.image && (
          <div className="group relative aspect-video overflow-hidden rounded-lg border">
            <Image
              src={value.image || "/placeholder.svg"}
              alt="Image content"
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {value.audio && (
          <div className="relative flex aspect-video items-center justify-center rounded-lg border p-4">
            <audio src={value.audio} controls className="h-10 w-full" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full"
              onClick={handleRemoveAudio}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {showMediaUpload ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {!value.image && (
              <div
                className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-all hover:border-primary hover:bg-muted/50"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <input
                  type="file"
                  id="image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
                <div className="rounded-full bg-muted p-4 transition-transform group-hover:scale-110">
                  <ImagePlus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium">Thêm ảnh</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG, GIF</p>
                </div>
              </div>
            )}

            {!value.audio && (
              <div
                className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-all hover:border-primary hover:bg-muted/50"
                onClick={() => document.getElementById("audio-upload")?.click()}
              >
                <input
                  type="file"
                  id="audio-upload"
                  className="hidden"
                  accept="audio/*"
                  onChange={(e) => handleAudioUpload(e.target.files)}
                />
                <div className="rounded-full bg-muted p-4 transition-transform group-hover:scale-110">
                  <Music className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium">Thêm âm thanh</p>
                  <p className="text-sm text-muted-foreground">MP3, WAV</p>
                </div>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base"
            onClick={() => setShowMediaUpload(false)}
          >
            Hủy
          </Button>
        </div>
      ) : (
        (!value.image || !value.audio) && (
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base"
            onClick={() => setShowMediaUpload(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Thêm media
          </Button>
        )
      )}
    </div>
  );
}
