import AuthProvider from "@/components/AuthProvider/AuthProvider";
import Protected from "@/components/Protected/Protected";
import Agora from "@/components/Agora/Agora";

export default async function Page({ params }: { params: { roomId: string } }) {
  const { roomId } = await params;

  return (
    <AuthProvider>
      <Protected>
        <Agora roomId={roomId || ""} />
      </Protected>
    </AuthProvider>
  );
}
