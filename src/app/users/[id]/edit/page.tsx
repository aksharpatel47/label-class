import { fetchUserById, fetchUsers } from "@/lib/data/users";
import { EditUserForm } from "./form";

export default async function Page({ params }: { params: { id: string } }) {
  const user = await fetchUserById(params.id);
  return (
    <>
      <EditUserForm id={params.id} user={user!} />
    </>
  );
}
