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
import { useFormState } from "react-dom";
import { H3 } from "@/components/ui/typography";
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
  const [state, dispatch] = useFormState(selectImagesForProject, undefined);

  let addImageToDatasetAction: any = null;

  if (state && state.taskData) {
    addImageToDatasetAction = addImagesToDataset.bind(
      null,
      state.taskData.tasks,
      state.taskData.labelId,
    );
  }

  return (
    <div>
      <form action={dispatch} className="flex gap-2 w-[800px]">
        <Input
          type="number"
          placeholder="Number of images to select"
          name="numImages"
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
        <Button type="submit">Select</Button>
      </form>

      {state && state.error && <span>{state.error}</span>}
      {state && state.taskData && (
        <div className="flex flex-col gap-2">
          <div>
            Total tasks available for the above criteria:{" "}
            {state.taskData.totalAvailableImages}
          </div>
          <div>Tasks selected: {state.taskData.tasks.length}</div>
          <form action={addImageToDatasetAction}>
            <Button>Add Images to Dataset with Automatic Split</Button>
          </form>
          <ReviewImages
            tasks={state.taskData.tasks}
            projectLabels={projectLabels}
          />
        </div>
      )}
    </div>
  );
}
