"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthUser, ProjectLabel, TrainedModel } from "@/db/schema";
import { CalendarIcon, XCircle } from "lucide-react";
import { useState } from "react";

interface ILabelFiltersProps {
  users: AuthUser[];
  trainedModels: TrainedModel[];
  projectLabels: ProjectLabel[];
  labelValues: string[];
  onApplyClick: () => void;
  currentValues: {
    label: string;
    labelvalue: string;
    user: string;
    trainedmodel: string;
    leftInferenceValue: string;
    rightInferenceValue: string;
    dataset: string;
    labeledon: string;
    assignedUser: string;
  };

  onSelectChange(newValues: { [key: string]: string | undefined }): void;
}

export function LabelFilters(props: ILabelFiltersProps) {
  const { onSelectChange } = props;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
                newValues.labeledon = undefined;
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
            onClick={() =>
              onSelectChange({ user: undefined, labeledon: undefined })
            }
          >
            <XCircle />
          </Button>
        </div>
      </div>

      <div>
        <Label>Labeled On</Label>
        <div className="flex">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[180px] justify-start text-left font-normal"
                disabled={props.currentValues.labelvalue === "Unlabeled"}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {props.currentValues.labeledon
                  ? new Date(props.currentValues.labeledon).toLocaleDateString()
                  : "Select Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  props.currentValues.labeledon
                    ? new Date(props.currentValues.labeledon)
                    : undefined
                }
                onSelect={(date) => {
                  if (date) {
                    onSelectChange({
                      labeledon: date.toISOString(),
                    });
                  }
                  setIsCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            onClick={() => {
              onSelectChange({ labeledon: undefined });
              setIsCalendarOpen(false);
            }}
            disabled={props.currentValues.labelvalue === "Unlabeled"}
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
        <Label>Inference Threshold</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            max="10000"
            placeholder="Left"
            value={props.currentValues.leftInferenceValue ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "") {
                onSelectChange({
                  leftInferenceValue: undefined,
                  inferencevalue: undefined,
                });
                return;
              }

              const numericValue = Number(value);
              if (Number.isNaN(numericValue)) {
                return;
              }

              const scaledValue = Math.max(
                0,
                Math.min(10000, Math.round(numericValue))
              );
              onSelectChange({
                leftInferenceValue: scaledValue.toString(),
                inferencevalue: undefined,
              });
            }}
          />
          <span>-</span>
          <Input
            type="number"
            min="0"
            max="10000"
            placeholder="Right"
            value={props.currentValues.rightInferenceValue ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "") {
                onSelectChange({
                  rightInferenceValue: undefined,
                  inferencevalue: undefined,
                });
                return;
              }

              const numericValue = Number(value);
              if (Number.isNaN(numericValue)) {
                return;
              }

              const scaledValue = Math.max(
                0,
                Math.min(10000, Math.round(numericValue))
              );
              onSelectChange({
                rightInferenceValue: scaledValue.toString(),
                inferencevalue: undefined,
              });
            }}
          />
          <Button
            variant="ghost"
            onClick={() =>
              onSelectChange({
                leftInferenceValue: undefined,
                rightInferenceValue: undefined,
                inferencevalue: undefined,
              })
            }
          >
            <XCircle />
          </Button>
        </div>
      </div>
      <div>
        <Label>Dataset</Label>
        <div className="flex">
          <Select
            value={props.currentValues.dataset}
            onValueChange={(newValue) => onSelectChange({ dataset: newValue })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Dataset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="train">Train</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="test">Test</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            onClick={() => onSelectChange({ dataset: undefined })}
          >
            <XCircle />
          </Button>
        </div>
      </div>
      <div>
        <Label>Assigned To</Label>
        <div className="flex">
          <Select
            value={props.currentValues.assignedUser}
            onValueChange={(newValue) =>
              onSelectChange({ assignedUser: newValue })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Assigned User" />
            </SelectTrigger>
            <SelectContent>
              {props.users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            onClick={() => onSelectChange({ assignedUser: undefined })}
          >
            <XCircle />
          </Button>
        </div>
      </div>
      <div className="flex items-end">
        <Button onClick={props.onApplyClick}>Apply</Button>
      </div>
    </div>
  );
}
