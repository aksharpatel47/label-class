import { H2 } from "@/components/ui/typography";
import { ImageImportForm } from "./form";
import { getPageSession } from "@/app/lib/utils/session";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getPageSession();
  return (
    <>
      <H2>Import Files</H2>
      <ImageImportForm userId={session!.user.id} projectId={params.id} />
    </>
  );
}
