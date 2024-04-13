"use client";

import { ProjectLabel, TrainedModel } from "@/db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface IInferenceForm {
  trainedModels: TrainedModel[];
  projectLabels: ProjectLabel[];
}

export function InferenceStatisticsForm(props: IInferenceForm) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();
  const currentValues = {
    label: searchParams.get("label") || "",
    trainedModelId: searchParams.get("trainedModelId") || "",
    dataset: searchParams.get("dataset") || "",
  };

  function handleSelectChange(newValues: {
    [key: string]: string | undefined;
  }) {
    const urlSearchParams = new URLSearchParams(searchParams);
    for (const key in newValues) {
      const value = newValues[key];
      if (value) {
        urlSearchParams.set(key, value);
      }
    }

    router.push(`${pathName}?${urlSearchParams.toString()}`);
  }

  return (
    <form method="get" className="flex gap-4">
      <Select
        name="trainedModelId"
        value={currentValues.trainedModelId}
        onValueChange={(newVal) =>
          handleSelectChange({ trainedModelId: newVal })
        }
        required
      >
        <SelectTrigger className="w-[400px]">
          <SelectValue placeholder="Select Trained Model" />
        </SelectTrigger>
        <SelectContent>
          {props.trainedModels.map((t) => (
            <SelectItem key={t.id} value={t.id.toString()}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        name="label"
        value={currentValues.label}
        onValueChange={(newVal) => handleSelectChange({ label: newVal })}
        required
      >
        <SelectTrigger className="w-[400px]">
          <SelectValue placeholder="Select Project Label" />
        </SelectTrigger>
        <SelectContent>
          {props.projectLabels.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.labelName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        name="dataset"
        value={currentValues.dataset}
        onValueChange={(newVal) => handleSelectChange({ dataset: newVal })}
      >
        <SelectTrigger className="w-[400px]">
          <SelectValue placeholder="Select Dataset" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="train">Train</SelectItem>
          <SelectItem value="valid">Valid</SelectItem>
          <SelectItem value="test">Test</SelectItem>
        </SelectContent>
      </Select>
      {/*<Button type="submit">Submit</Button>*/}
    </form>
  );
}
