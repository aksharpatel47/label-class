"use client";

import { importInference } from "@/app/lib/actions/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ILabelImportFormProps {
  modelId: number;
}

export function ImportInferenceForm(props: ILabelImportFormProps) {
  const importInferenceForProject = importInference.bind(null, props.modelId);
  const [state, dispatch] = useFormState(importInferenceForProject, undefined);
  return (
    <form action={dispatch} className="flex flex-col gap-4 w-[350px]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Import Inferences</CardTitle>
        </CardHeader>
        <CardContent>
          <InferenceFormComponents state={state} />
        </CardContent>
      </Card>
    </form>
  );
}

function InferenceFormComponents({ state }: { state?: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col gap-4">
      <Input type="file" id="file" name="file" required disabled={pending} />
      <Button type="submit" disabled={pending}>
        Import
        {pending && "ing... "}
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {!pending && state === "Done" && (
          <span>
            <CheckCircle2 className="h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  );
}
