"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthUser, ProjectLabel, TrainedModels } from "@/db/schema";
import { XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ILabelFiltersProps {
  users: AuthUser[];
  trainedModels: TrainedModels[];
  projectLabels: ProjectLabel[];
  labelValues: string[];
  onApplyClick: () => void;
  currentValues: {
    label: string;
    labelvalue: string;
    user: string;
    trainedmodel: string;
    inferencevalue: string;
    dataset: string;
  };
  inferenceValues: string[];

  onSelectChange(newValues: { [key: string]: string | undefined }): void;
}

export function LabelFilters(props: ILabelFiltersProps) {
  const { onSelectChange } = props;

  return (
    <div className="flex content-center">
      <div>
        <Label>Project Label</Label>
        <div className="flex">
          <Select
            value={props.currentValues.label}
            onValueChange={(newValue) => onSelectChange({ label: newValue })}
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
            onClick={() => onSelectChange({ label: undefined })}
          >
            <XCircle />
          </Button>
        </div>
      </div>

      <div>
        <Label>Project Label Value</Label>
        <div className="flex">
          <Select
            value={props.currentValues.labelvalue}
            onValueChange={(newValue) => {
              const newValues: any = { labelvalue: newValue };
              if (newValue === "Unlabeled") {
                newValues.user = undefined;
              }
              onSelectChange(newValues);
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
            onClick={() => onSelectChange({ labelvalue: undefined })}
          >
            <XCircle />
          </Button>
        </div>
      </div>

      <div>
        <Label>Labeled By</Label>
        <div className="flex">
          <Select
            value={props.currentValues.user}
            disabled={props.currentValues.labelvalue === "Unlabeled"}
            onValueChange={(newValue) => onSelectChange({ user: newValue })}
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
            onClick={() => onSelectChange({ user: undefined })}
          >
            <XCircle />
          </Button>
        </div>
      </div>

      <div>
        <Label>Trained Model</Label>
        <div className="flex">
          <Select
            value={props.currentValues.trainedmodel}
            onValueChange={(newValue) =>
              onSelectChange({ trainedmodel: newValue })
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
            onClick={() => onSelectChange({ trainedmodel: undefined })}
          >
            <XCircle />
          </Button>
        </div>
      </div>

      <div>
        <Label>Inference Value</Label>
        <div className="flex">
          <Select
            value={props.currentValues.inferencevalue}
            onValueChange={(newValue) =>
              onSelectChange({ inferencevalue: newValue })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Inference Value" />
            </SelectTrigger>
            <SelectContent>
              {props.inferenceValues.map((inferenceValue) => (
                <SelectItem key={inferenceValue} value={inferenceValue}>
                  {inferenceValue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            onClick={() => onSelectChange({ inferencevalue: undefined })}
          >
            <XCircle />
          </Button>
        </div>
      </div>
      <div>
        <Label>Dataset</Label>
        <Select
          value={props.currentValues.dataset}
          onValueChange={(newValue) => onSelectChange({ dataset: newValue })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Dataset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="train">Train</SelectItem>
            <SelectItem value="valid">Validation</SelectItem>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center">
        <Button onClick={props.onApplyClick}>Apply</Button>
      </div>
    </div>
  );
}
