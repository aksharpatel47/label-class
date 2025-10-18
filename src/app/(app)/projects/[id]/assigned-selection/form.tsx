"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AuthUser, ProjectLabel, taskLabelEnumValues } from "@/db/schema";

export interface IAssignedSelectionInitialValues {
  labelId?: string;
  userId?: string;
  labelValue?: string;
  dataset?: string;
}

interface IAssignedSelectionFormProps {
  projectId: string;
  projectLabels: ProjectLabel[];
  users: AuthUser[];
  initialValues?: IAssignedSelectionInitialValues;
}

export function AssignedSelectionForm({
  projectLabels,
  users,
  projectId,
  initialValues,
}: IAssignedSelectionFormProps) {
  const router = useRouter();
  const [currentValues, setCurrentValues] = useState({
    labelId: initialValues?.labelId ?? "",
    userId: initialValues?.userId ?? "",
    labelValue: initialValues?.labelValue ?? "",
    dataset: initialValues?.dataset ?? "split",
  });

  const onSelectChange = (newValues: { [key: string]: string | undefined }) => {
    setCurrentValues((prev) => ({
      ...prev,
      ...newValues,
    }));
  };

  const handleApply = () => {
    const params = new URLSearchParams();
    if (currentValues.labelId) params.set("labelId", currentValues.labelId);
    if (currentValues.userId) params.set("userId", currentValues.userId);
    if (currentValues.labelValue)
      params.set("labelValue", currentValues.labelValue);
    if (currentValues.dataset) params.set("dataset", currentValues.dataset);

    router.push(
      `/projects/${projectId}/assigned-selection?${params.toString()}`
    );
  };

  return (
    <div>
      <form className="flex gap-2 w-[1000px]">
        <Select
          name="labelId"
          value={currentValues.labelId}
          onValueChange={(newValue) => onSelectChange({ labelId: newValue })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Label"></SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projectLabels.map((label) => (
              <SelectItem key={label.id} value={label.id.toString()}>
                {label.labelName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          name="userId"
          value={currentValues.userId}
          onValueChange={(newValue) => onSelectChange({ userId: newValue })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select User"></SelectValue>
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          name="labelValue"
          value={currentValues.labelValue}
          onValueChange={(newValue) => onSelectChange({ labelValue: newValue })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Label Value"></SelectValue>
          </SelectTrigger>
          <SelectContent>
            {taskLabelEnumValues.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          name="dataset"
          value={currentValues.dataset}
          onValueChange={(newValue) => onSelectChange({ dataset: newValue })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Dataset"></SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="split">Split</SelectItem>
            <SelectItem value="train">Train</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" onClick={handleApply}>
          Apply
        </Button>
        <Button type="button">Select</Button>
      </form>
    </div>
  );
}
