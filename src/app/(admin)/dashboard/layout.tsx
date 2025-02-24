import { Layout } from "antd";
import AdminHeader from "@/components/userLayout/admin.header";
import AdminFooter from "@/components/userLayout/admin.foodter";
import AdminSideBar from "@/components/userLayout/admin.sidebar";
import AdminContent from "@/components/userLayout/admin.content";
const AdminLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <Layout>
      <AdminSideBar />
      <Layout>
        <AdminHeader />
        <AdminContent>{children}</AdminContent>
        <AdminFooter />
      </Layout>
    </Layout>
  );
};
export default AdminLayout;
