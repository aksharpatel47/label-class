"use client";

import { importData } from "@/app/lib/actions/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormState } from "react-dom";

export function ImageImportForm(props: { userId: string; projectId: string }) {
  const importDataWithUser = importData.bind(
    null,
    props.projectId,
    props.userId
  );
  const [state, dispatch] = useFormState(importDataWithUser, undefined);
  return (
    <form action={dispatch}>
      <Input
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
