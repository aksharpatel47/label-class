import { LoginForm } from "./form";
import { redirectIfAuthenticated } from "../../lib/utils/session";

export default async function Page() {
  await redirectIfAuthenticated();

  return (
    <div className="flex justify-center">
      <LoginForm />
    </div>
  );
}
