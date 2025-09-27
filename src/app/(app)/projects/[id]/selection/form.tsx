import { useActionState } from "react";
"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProjectLabel, TrainedModel } from "@/db/schema";
import {
  addImagesToDataset,
  selectionAction,
} from "@/app/lib/actions/selection";
import { ImageInferenceTypes } from "@/app/lib/models/image";
import { ReviewImages } from "@/app/(app)/projects/[id]/selection/review";

interface ISelectionFormProps {
  projectId: string;
  projectLabels: ProjectLabel[];
  trainedModels: TrainedModel[];
  imageInferenceTypes: typeof ImageInferenceTypes;
}

export function SelectionForm({
  trainedModels,
  projectLabels,
  projectId,
  imageInferenceTypes,
}: ISelectionFormProps) {
  const selectImagesForProject = selectionAction.bind(null, projectId);
  const [state, dispatch] = useActionState(selectImagesForProject, undefined);

  let addImagesToDatasetAction: any = null;

  if (state && state.taskData) {
    addImagesToDatasetAction = addImagesToDataset.bind(
      null,
      state.taskData.tasks,
      state.taskData.labelId,
      state.taskData.imageInferenceType,
      projectId,
      state.taskData.dataset
    );
  }

  return (
    <div>
      <form action={dispatch} className="flex gap-2 w-[1000px]">
        <Input
          type="number"
          placeholder="Number of images to select"
          name="numImages"
          readOnly={state && !!state.taskData}
        />
        <Select name="labelId">
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
        <Select name="inferenceModelId">
          <SelectTrigger>
            <SelectValue placeholder="Select Inference Model"></SelectValue>
          </SelectTrigger>
          <SelectContent>
            {trainedModels.map((model) => (
              <SelectItem key={model.id} value={model.id.toString()}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="imageInferenceType">
          <SelectTrigger>
            <SelectValue placeholder="Select Image Type"></SelectValue>
          </SelectTrigger>
          <SelectContent>
            {imageInferenceTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="dataset" defaultValue="split">
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
        <Button type="submit">Select</Button>
      </form>

      {state && state.error && <span>{state.error}</span>}
      {state && state.taskData && (
        <div className="flex flex-col gap-2">
          <div className="pt-2">
            Total tasks available for the above criteria:{" "}
            {state.taskData.totalAvailableImages}, Total tasks selected:{" "}
            {state.taskData.tasks.length}
          </div>
          <ReviewImages
            tasks={state.taskData.tasks}
            projectLabels={projectLabels}
            selectedModelId={state.taskData.inferenceModelId}
            addImagesToDatasetAction={addImagesToDatasetAction}
          />
        </div>
      )}
    </div>
  );
}
