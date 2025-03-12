import UserHeader from "@/components/userLayout/user.header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <UserHeader />
      {children}
    </div>
  );
}
