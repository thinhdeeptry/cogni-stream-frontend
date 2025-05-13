import React from "react";

import { Info } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const SandboxInfo = () => {
  // Chỉ hiển thị trong môi trường development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Card className="mb-4 border-orange-200">
      <CardHeader className="bg-orange-50">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-lg text-orange-700">
            Thông tin thẻ test (Sandbox)
          </CardTitle>
        </div>
        <CardDescription>
          Sử dụng thông tin thẻ dưới đây để thanh toán trong môi trường sandbox
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thông tin</TableHead>
              <TableHead>Giá trị</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Số thẻ</TableCell>
              <TableCell className="font-mono">9704 0000 0000 0018</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tên chủ thẻ</TableCell>
              <TableCell className="font-mono">NGUYEN VAN A</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Ngày hết hạn</TableCell>
              <TableCell className="font-mono">03/07</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Mã OTP</TableCell>
              <TableCell className="font-mono">123456</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
