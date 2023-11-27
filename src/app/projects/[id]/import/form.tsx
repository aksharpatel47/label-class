"use client";

import { importData } from "@/app/actions/data";
import { Button } from "@/components/ui/button";
import { User } from "next-auth";
import { useFormState } from "react-dom";

export function ImageImportForm(props: {
  user: { email?: string | null | undefined };
  projectId: number;
}) {
  const importDataWithUser = importData.bind(
    null,
    props.projectId,
    props.user.email!
  );
  const [state, dispatch] = useFormState(importDataWithUser, undefined);
  return (
    <form action={dispatch}>
      <label htmlFor="file">Upload a file</label>
      <br />
      <input
        type="file"
        id="file"
        name="file"
        required
        aria-describedby="fileMessage"
      />
      <br />
      {state && <span id="fileMessage">{state}</span>}
      <br />
      <Button type="submit">Upload</Button>
    </form>
  );
}
