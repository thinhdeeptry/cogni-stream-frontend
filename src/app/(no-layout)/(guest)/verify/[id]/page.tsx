import GuestVerify from "@/components/auth/guest.verify";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return <GuestVerify id={id} />;
}
