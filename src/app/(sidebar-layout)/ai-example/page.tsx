"use client";

import { AIExample } from "@/components/ai/AIExample";
import { AIMultiExample } from "@/components/ai/AIMultiExample";
import { AIReferenceExample } from "@/components/ai/AIReferenceExample";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AIExamplePage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">AI Example</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates how to use the useAI hook với Google Gemini
      </p>

      <Tabs defaultValue="basic" className="w-full mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
          <TabsTrigger value="basic">Ví dụ cơ bản</TabsTrigger>
          <TabsTrigger value="multi">Nhiều AI khác nhau</TabsTrigger>
          <TabsTrigger value="reference">Với tài liệu tham khảo</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <AIExample />
        </TabsContent>

        <TabsContent value="multi">
          <AIMultiExample />
        </TabsContent>

        <TabsContent value="reference">
          <AIReferenceExample />
        </TabsContent>
      </Tabs>

      <div className="mt-6 text-sm text-muted-foreground">
        <p>
          Sử dụng API key từ biến môi trường NEXT_PUBLIC_GEMINI_API_KEY. Đảm bảo
          đã thiết lập biến này trong file .env.local
        </p>
      </div>
    </div>
  );
}
