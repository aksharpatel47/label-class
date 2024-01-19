"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthUser, ProjectLabel, TrainedModels } from "@/db/schema";
import { XCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface ILabelFiltersProps {
  users: AuthUser[];
  trainedModels: TrainedModels[];
  projectLabels: ProjectLabel[];
  labelValues: string[];
  onApplyClick: () => void;
}

export function LabelFilters(props: ILabelFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();
  const projectLabel = searchParams.get("label") || "";
  const projectLabelValue = searchParams.get("labelvalue") || "";
  const user = searchParams.get("user") || "";
  const trainedModel = searchParams.get("trainedmodel") || "";
  const inferenceValue = searchParams.get("inferencevalue") || "";

  function handleSelectChange(newValues: {
    [key: string]: string | undefined;
  }) {
    const urlSearchParams = new URLSearchParams(searchParams);

    if (!!urlSearchParams.get("after")) {
      urlSearchParams.delete("after");
    }

    for (const [key, value] of Object.entries(newValues)) {
      if (!value) {
        urlSearchParams.delete(key);
        continue;
      }
      urlSearchParams.set(key, value);
    }
    router.replace(`${pathName}?${urlSearchParams.toString()}`);
  }

  const inferenceValues = [
    "0",
    "10",
    "20",
    "30",
    "40",
    "50",
    "60",
    "70",
    "80",
    "90",
  ];
  return (
    <div className="flex">
      <Select
        value={projectLabel}
        onValueChange={(newValue) => handleSelectChange({ label: newValue })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Project Label" />
        </SelectTrigger>
        <SelectContent>
          {props.projectLabels.map((label) => (
            <SelectItem key={label.id} value={label.id}>
              {label.labelName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        onClick={() => handleSelectChange({ label: undefined })}
      >
        <XCircle />
      </Button>
      <Select
        value={projectLabelValue}
        onValueChange={(newValue) => {
          const newValues: any = { labelvalue: newValue };
          if (newValue === "Unlabeled") {
            newValues.user = undefined;
          }
          handleSelectChange(newValues);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Project Label Value" />
        </SelectTrigger>
        <SelectContent>
          {props.labelValues.map((labelValue) => (
            <SelectItem key={labelValue} value={labelValue}>
              {labelValue}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        onClick={() => handleSelectChange({ labelvalue: undefined })}
      >
        <XCircle />
      </Button>
      <Select
        value={user}
        disabled={projectLabelValue === "Unlabeled"}
        onValueChange={(newValue) => handleSelectChange({ user: newValue })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select User" />
        </SelectTrigger>
        <SelectContent>
          {props.users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        onClick={() => handleSelectChange({ user: undefined })}
      >
        <XCircle />
      </Button>
      <Select
        value={trainedModel}
        onValueChange={(newValue) =>
          handleSelectChange({ trainedmodel: newValue })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Trained Model" />
        </SelectTrigger>
        <SelectContent>
          {props.trainedModels.map((trainedModel) => (
            <SelectItem
              key={trainedModel.id}
              value={trainedModel.id.toString()}
            >
              {trainedModel.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        onClick={() => handleSelectChange({ trainedmodel: undefined })}
      >
        <XCircle />
      </Button>
      <Select
        value={inferenceValue}
        onValueChange={(newValue) =>
          handleSelectChange({ inferencevalue: newValue })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Inference Value" />
        </SelectTrigger>
        <SelectContent>
          {inferenceValues.map((inferenceValue) => (
            <SelectItem key={inferenceValue} value={inferenceValue}>
              {inferenceValue}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        onClick={() => handleSelectChange({ inferencevalue: undefined })}
      >
        <XCircle />
      </Button>
      <Button onClick={props.onApplyClick}>Apply</Button>
    </div>
  );
}
