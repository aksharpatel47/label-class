"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AuthUser,
  ProjectLabel,
  taskLabelEnumValues,
  TaskLabelValue,
} from "@/db/schema";
import { assignedSelectionAction } from "@/app/lib/actions/assigned-selection";

export interface IAssignedSelectionFormValues {
  labelId: string;
  userId: string;
  labelValue: TaskLabelValue;
  dataset: string;
}

interface IAssignedSelectionFormProps {
  projectId: string;
  projectLabels: ProjectLabel[];
  users: AuthUser[];
  initialValues?: IAssignedSelectionFormValues;
}

export function AssignedSelectionForm({
  projectLabels,
  users,
  projectId,
  initialValues,
}: IAssignedSelectionFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    assignedSelectionAction,
    undefined
  );

  const currentValues = {
    ...initialValues,
  };

  const onSelectChange = (newValues: { [key: string]: string | undefined }) => {
    const updatedValues = {
      ...currentValues,
      ...newValues,
    };

    const params = new URLSearchParams();
    Object.entries(updatedValues).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    router.push(
      `/projects/${projectId}/assigned-selection?${params.toString()}`
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction} className="flex gap-2 w-[1000px]">
        <input type="hidden" name="projectId" value={projectId} />
        <input
          type="hidden"
          name="assignedUserId"
          value={currentValues.userId}
        />

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

        <Button type="submit" disabled={isPending}>
          {isPending ? "Selecting..." : "Select"}
        </Button>
      </form>
      {state?.error && (
        <div className="text-red-500 text-sm">{state.error}</div>
      )}
    </div>
  );
}
