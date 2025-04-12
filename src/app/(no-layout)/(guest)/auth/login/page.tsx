import GuestLogin from "@/components/auth/guest.login";
import { BackgroundLines } from "@/components/ui/background-lines";

const LoginPage = () => {
  return (
    <BackgroundLines className="h-screen">
      <div className="relative z-10 w-full items-center justify-center">
        <GuestLogin />
      </div>
    </BackgroundLines>
  );
};

export default LoginPage;
