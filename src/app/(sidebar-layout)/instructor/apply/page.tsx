"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Briefcase, FileText, Link as LinkIcon } from "lucide-react";
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

const instructorApplicationSchema = z.object({
  curriculum_vitae_link: z.string().optional(),
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
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [qualificationFiles, setQualificationFiles] = useState<File[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [uploadedCvLinks, setUploadedCvLinks] = useState<string[]>([]);
  const [uploadedQualificationLinks, setUploadedQualificationLinks] = useState<
    string[]
  >([]);
  const [uploadedPortfolioLinks, setUploadedPortfolioLinks] = useState<
    string[]
  >([]);

  // Manual link states (for users who want to add links directly)
  const [cvLink, setCvLink] = useState<string>("");
  const [qualifications, setQualifications] = useState<string[]>([""]);
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([""]);

  const form = useForm<InstructorApplicationValues>({
    resolver: zodResolver(instructorApplicationSchema),
    defaultValues: {
      curriculum_vitae_link: "",
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
      let finalCvLink = "";
      let finalQualifications: string[] = [];
      let finalPortfolioLinks: string[] = [];

      // Upload CV files
      if (cvFiles.length > 0) {
        const cvResult = await uploadInstructorRegistrationFiles(
          cvFiles,
          "qualifications", // Backend sẽ xử lý CV như qualifications
          user.id,
        );

        if (
          cvResult.success &&
          cvResult.data.files &&
          cvResult.data.files.length > 0
        ) {
          finalCvLink = cvResult.data.files[0].webViewLink || "";
        }
      }

      // Nếu không upload file CV thì dùng link manual
      if (!finalCvLink && cvLink.trim()) {
        finalCvLink = cvLink.trim();
      }

      // Validate CV is required
      if (!finalCvLink) {
        toast({
          title: "Lỗi",
          description: "Vui lòng upload file CV hoặc nhập link CV",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

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

      // Normalize portfolio links to ensure proper protocol
      const normalizedPortfolioLinks = filteredPortfolioLinks.map((link) => {
        const trimmedLink = link.trim();
        return trimmedLink.startsWith("http://") ||
          trimmedLink.startsWith("https://")
          ? trimmedLink
          : `https://${trimmedLink}`;
      });

      finalPortfolioLinks.push(...normalizedPortfolioLinks);

      // Normalize CV link if it exists
      const normalizedCvLink =
        finalCvLink &&
        (finalCvLink.startsWith("http://") ||
          finalCvLink.startsWith("https://"))
          ? finalCvLink
          : finalCvLink
            ? `https://${finalCvLink}`
            : finalCvLink;

      // Step 2: Create instructor registration with all links
      const applicationData = {
        ...data,
        curriculum_vitae_link: normalizedCvLink,
        userId: user.id,
        qualifications: finalQualifications,
        portfolio_links: finalPortfolioLinks,
        agree_terms: true, // Add missing field
        user: {
          // Add missing user object
          id: user.id,
          name: user.name || "",
          email: user.email || "",
        },
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
          {/* CV Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Curriculum Vitae (CV)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CV Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Template CV cho giảng viên
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Sử dụng template CV chuyên nghiệp để tạo ấn tượng tốt với
                      ban quản trị. Vui lòng điền đầy đủ thông tin và upload CV
                      trực tiếp hoặc cung cấp link chia sẻ.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      onClick={() =>
                        window.open(
                          "https://docs.google.com/document/d/1vxnCaWpt-KtoGa-faJzuiPkwFrcV373G/edit?usp=drive_link&ouid=101377623666389424053&rtpof=true&sd=true",
                          "_blank",
                        )
                      }
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Tải xuống template CV
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div>
                <h4 className="font-medium mb-4">Tùy chọn 1: Upload file CV</h4>
                <FileUpload
                  type="cv"
                  title="Upload CV của bạn"
                  description="Upload file PDF, Word hoặc hình ảnh CV của bạn"
                  maxFiles={1}
                  onFilesChange={setCvFiles}
                  onUploadedLinksChange={setUploadedCvLinks}
                />
              </div>

              {/* Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-slate-200"></div>
                <span className="px-3 text-sm text-slate-500 bg-white">
                  HOẶC
                </span>
                <div className="flex-1 border-t border-slate-200"></div>
              </div>

              {/* Manual Link Section */}
              <div>
                <h4 className="font-medium mb-4">Tùy chọn 2: Thêm link CV</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Thêm link đến CV của bạn (Google Drive, Dropbox, ...)
                </p>
                <Input
                  placeholder="https://drive.google.com/file/d/your-cv-link/view"
                  value={cvLink}
                  onChange={(e) => setCvLink(e.target.value)}
                />
                <p className="text-sm text-slate-600 mt-2">
                  Đảm bảo link có thể truy cập công khai.
                </p>
              </div>

              {/* Note */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                  <div className="text-sm text-orange-800">
                    <strong>Lưu ý:</strong> Bạn chỉ cần chọn một trong hai tùy
                    chọn trên. Nếu upload file, hệ thống sẽ tự động tải lên
                    Drive và tạo link cho bạn.
                  </div>
                </div>
              </div>
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
                  Thêm link đến portfolio, dự án, hoặc trang cá nhân của bạn (có
                  thể bỏ qua https://)
                </p>
                {portfolioLinks.map((link, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="github.com/username hoặc portfolio.com hoặc https://yoursite.com"
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
