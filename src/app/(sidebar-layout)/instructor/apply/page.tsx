"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Link as LinkIcon,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  createInstructorRegistration,
  uploadInstructorRegistrationFiles,
} from "@/actions/instructorRegistrationAction";

import useUserStore from "@/stores/useUserStore";

import { FileUpload } from "@/components/instructor/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const instructorApplicationSchema = z.object({
  headline: z.string().min(10, "Tiêu đề phải có ít nhất 10 ký tự"),
  bio: z.string().min(50, "Giới thiệu bản thân phải có ít nhất 50 ký tự"),
  specialization: z.string().min(5, "Chuyên môn phải có ít nhất 5 ký tự"),
  experience_years: z
    .number()
    .min(0, "Số năm kinh nghiệm không được âm")
    .optional(),
  qualifications: z.array(z.string()).optional(),
  portfolio_links: z.array(z.string()).optional(),
});

type InstructorApplicationValues = z.infer<typeof instructorApplicationSchema>;

export default function InstructorApplicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload states
  const [qualificationFiles, setQualificationFiles] = useState<File[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [uploadedQualificationLinks, setUploadedQualificationLinks] = useState<
    string[]
  >([]);
  const [uploadedPortfolioLinks, setUploadedPortfolioLinks] = useState<
    string[]
  >([]);

  // Manual link states (for users who want to add links directly)
  const [qualifications, setQualifications] = useState<string[]>([""]);
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([""]);

  const form = useForm<InstructorApplicationValues>({
    resolver: zodResolver(instructorApplicationSchema),
    defaultValues: {
      headline: "",
      bio: "",
      specialization: "",
      experience_years: 0,
      qualifications: [],
      portfolio_links: [],
    },
  });

  const addQualification = () => {
    setQualifications([...qualifications, ""]);
  };

  const removeQualification = (index: number) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const updateQualification = (index: number, value: string) => {
    const newQualifications = [...qualifications];
    newQualifications[index] = value;
    setQualifications(newQualifications);
  };

  const addPortfolioLink = () => {
    setPortfolioLinks([...portfolioLinks, ""]);
  };

  const removePortfolioLink = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index));
  };

  const updatePortfolioLink = (index: number, value: string) => {
    const newLinks = [...portfolioLinks];
    newLinks[index] = value;
    setPortfolioLinks(newLinks);
  };

  const onSubmit = async (data: InstructorApplicationValues) => {
    if (!user?.id) {
      toast({
        title: "Lỗi",
        description: "Bạn cần đăng nhập để thực hiện chức năng này",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload files to Google Drive nếu có
      let finalQualifications: string[] = [];
      let finalPortfolioLinks: string[] = [];

      // Upload qualification files
      if (qualificationFiles.length > 0) {
        const qualificationResult = await uploadInstructorRegistrationFiles(
          qualificationFiles,
          "qualifications",
          user.id,
        );

        if (qualificationResult.success && qualificationResult.data.files) {
          const uploadedLinks = qualificationResult.data.files
            .map((file: any) => file.webViewLink)
            .filter(Boolean);
          finalQualifications.push(...uploadedLinks);
        }
      }

      // Upload portfolio files
      if (portfolioFiles.length > 0) {
        const portfolioResult = await uploadInstructorRegistrationFiles(
          portfolioFiles,
          "portfolio",
          user.id,
        );

        if (portfolioResult.success && portfolioResult.data.files) {
          const uploadedLinks = portfolioResult.data.files
            .map((file: any) => file.webViewLink)
            .filter(Boolean);
          finalPortfolioLinks.push(...uploadedLinks);
        }
      }

      // Combine uploaded links with manual links
      const filteredQualifications = qualifications.filter(
        (q) => q.trim() !== "",
      );
      const filteredPortfolioLinks = portfolioLinks.filter(
        (p) => p.trim() !== "",
      );

      finalQualifications.push(...filteredQualifications);
      finalPortfolioLinks.push(...filteredPortfolioLinks);

      // Step 2: Create instructor registration with all links
      const applicationData = {
        ...data,
        userId: user.id,
        qualifications: finalQualifications,
        portfolio_links: finalPortfolioLinks,
      };

      const result = await createInstructorRegistration(applicationData);

      if (result.success) {
        toast({
          title: "Thành công",
          description:
            "Đơn đăng ký giảng viên đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.",
        });
        router.push("/user/profile");
      } else {
        throw new Error(result.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi gửi đơn đăng ký",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Đăng ký trở thành giảng viên
          </h1>
          <p className="text-slate-600 mt-2">
            Chia sẻ kiến thức và kinh nghiệm của bạn với hàng nghìn học viên
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Thông tin cơ bản */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiêu đề chuyên môn *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Chuyên gia lập trình Frontend với 5+ năm kinh nghiệm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giới thiệu bản thân *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mô tả về bản thân, kinh nghiệm làm việc, thành tích nổi bật..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lĩnh vực chuyên môn *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Lập trình Web, Data Science, Digital Marketing..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số năm kinh nghiệm</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Chứng chỉ và bằng cấp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Chứng chỉ & Bằng cấp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div>
                <h4 className="font-medium mb-4">Upload files</h4>
                <FileUpload
                  type="qualifications"
                  title="Upload chứng chỉ, bằng cấp"
                  description="Upload file PDF, Word, hoặc hình ảnh chứng chỉ của bạn"
                  maxFiles={5}
                  onFilesChange={setQualificationFiles}
                  onUploadedLinksChange={setUploadedQualificationLinks}
                />
              </div>

              {/* Manual Links Section */}
              <div>
                <h4 className="font-medium mb-4">Hoặc thêm link trực tiếp</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Thêm link đến các chứng chỉ, bằng cấp (Google Drive, Dropbox,
                  ...)
                </p>
                {qualifications.map((qualification, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="https://drive.google.com/..."
                      value={qualification}
                      onChange={(e) =>
                        updateQualification(index, e.target.value)
                      }
                      className="flex-1"
                    />
                    {qualifications.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeQualification(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addQualification}
                  className="w-full"
                >
                  + Thêm link chứng chỉ
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio và dự án */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-orange-500" />
                Portfolio & Dự án
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div>
                <h4 className="font-medium mb-4">Upload files</h4>
                <FileUpload
                  type="portfolio"
                  title="Upload portfolio, dự án"
                  description="Upload hình ảnh hoặc file mô tả các dự án của bạn"
                  maxFiles={5}
                  onFilesChange={setPortfolioFiles}
                  onUploadedLinksChange={setUploadedPortfolioLinks}
                />
              </div>

              {/* Manual Links Section */}
              <div>
                <h4 className="font-medium mb-4">Hoặc thêm link trực tiếp</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Thêm link đến portfolio, dự án, hoặc trang cá nhân của bạn
                </p>
                {portfolioLinks.map((link, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="https://github.com/username hoặc https://portfolio.com"
                      value={link}
                      onChange={(e) =>
                        updatePortfolioLink(index, e.target.value)
                      }
                      className="flex-1"
                    />
                    {portfolioLinks.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removePortfolioLink(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPortfolioLink}
                  className="w-full"
                >
                  + Thêm portfolio/dự án
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </div>
                <div className="text-sm text-slate-700">
                  <p className="font-medium mb-2">Cam kết của giảng viên:</p>
                  <ul className="space-y-1 text-slate-600">
                    <li>
                      • Tạo ra nội dung chất lượng và có giá trị cho học viên
                    </li>
                    <li>• Tương tác và hỗ trợ học viên một cách tích cực</li>
                    <li>• Tuân thủ các quy định và chính sách của nền tảng</li>
                    <li>
                      • Cập nhật kiến thức và cải thiện khóa học thường xuyên
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi đơn đăng ký"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
