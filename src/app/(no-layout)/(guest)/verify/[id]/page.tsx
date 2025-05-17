import GuestVerify from "@/components/auth/guest.verify";
import { BackgroundLines } from "@/components/ui/background-lines";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return (
    <BackgroundLines className="h-screen">
      <div className="relative z-10 w-full flex items-center justify-center">
        <GuestVerify id={id} />;
      </div>
    </BackgroundLines>
  );
}
