"use client";

import { importInference } from "@/app/lib/actions/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrainedModels } from "@/db/schema";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ILabelImportFormProps {
  projectId: string;
  trainedModels: TrainedModels[];
}
export function ImportInferenceForm(props: ILabelImportFormProps) {
  const importInferenceForProject = importInference.bind(null, props.projectId);
  const [state, dispatch] = useFormState(importInferenceForProject, undefined);
  return (
    <form action={dispatch} className="flex flex-col gap-4 w-[350px]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Import Inferences</CardTitle>
        </CardHeader>
        <CardContent>
          <InferenceFormComponents
            trainedModels={props.trainedModels}
            state={state}
          />
        </CardContent>
      </Card>
    </form>
  );
}

function InferenceFormComponents({
  trainedModels,
  state,
}: {
  trainedModels: TrainedModels[];
  state?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col gap-4">
      <Select name="trainedModel" required disabled={pending}>
        <SelectTrigger>
          <SelectValue placeholder="Select Trained Model" />
        </SelectTrigger>
        <SelectContent>
          {trainedModels.map((trainedModel) => (
            <SelectItem
              key={trainedModel.id}
              value={trainedModel.id.toString()}
            >
              {trainedModel.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
