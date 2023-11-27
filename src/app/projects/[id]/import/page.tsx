import { H2 } from "@/components/ui/typography";
import { ImageImportForm } from "./form";
import { auth } from "@/auth";

export default async function Page({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id, 10);
  const session = await auth();
  return (
    <>
      <H2>Import Files</H2>
      <ImageImportForm user={session!.user!} projectId={projectId} />
    </>
  );
}
