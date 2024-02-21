"use client";

import { importData } from "@/app/lib/actions/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormState, useFormStatus } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ImageImportForm(props: { userId: string; projectId: string }) {
  const importDataWithUser = importData.bind(
    null,
    props.projectId,
    props.userId,
  );
  const [state, dispatch] = useFormState(importDataWithUser, undefined);
  return (
    <form action={dispatch}>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Import Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageImportFormComponents state={state} />
        </CardContent>
      </Card>
    </form>
  );
}

function ImageImportFormComponents({ state }: { state: string | undefined }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col gap-4">
      <Input
        type="file"
        id="file"
        name="file"
        required
        aria-describedby="fileMessage"
        disabled={pending}
      />
      <Button type="submit" disabled={pending}>
        Upload
        {pending && "ing..."}
      </Button>
    </div>
  );
}
