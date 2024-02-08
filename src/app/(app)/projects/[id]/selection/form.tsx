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
import { ProjectLabel, TrainedModels } from "@/db/schema";
import { selectionAction } from "@/app/lib/actions/selection";
import { useFormState } from "react-dom";
import { H3 } from "@/components/ui/typography";

interface ISelectionFormProps {
  projectId: string;
  projectLabels: ProjectLabel[];
  trainedModels: TrainedModels[];
}

export function SelectionForm({
  trainedModels,
  projectLabels,
  projectId,
}: ISelectionFormProps) {
  const selectImagesForProject = selectionAction.bind(null, projectId);
  const [state, dispatch] = useFormState(selectImagesForProject, undefined);

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
        <Button type="submit">Select</Button>
      </form>

      {state && state.error && <span>{state.error}</span>}
      {state && state.counts && (
        <div>
          <H3>Counts</H3>
          <div>False Positive Counts</div>
          <div>
            Where Inference GT 0.75 : {state.counts.falsePositiveCountGT75}
          </div>
          <div>
            Where Inference LT 0.75 but GT 0.5 :{" "}
            {state.counts.falsePositiveCountLT75}
          </div>
          <div>False Negative Counts</div>
          <div>
            Where Inference LT 0.5 : {state.counts.falseNegativeCountGT25}
          </div>
          <div>
            Where Inference LT 0.25 : {state.counts.falseNegativeCountLT25}
          </div>

          <div>
            Total images that need to be added to the train/valid/test with
            priority:{" "}
            {state.counts.falseNegativeCountGT25 +
              state.counts.falsePositiveCountGT75 +
              state.counts.falsePositiveCountLT75 +
              state.counts.falseNegativeCountLT25}
          </div>

          <div>
            Total remaining images:{" "}
            {state.counts.totalImagesNeeded -
              (state.counts.falseNegativeCountGT25 +
                state.counts.falsePositiveCountGT75 +
                state.counts.falsePositiveCountLT75 +
                state.counts.falseNegativeCountLT25)}
          </div>

          <div>
            These images can be selected from true positive and false positive
            buckets.
          </div>
          <div>
            True Positive Images:{" "}
            {state.counts.truePositiveCountGT75 +
              state.counts.truePositiveCountLT75}
          </div>
          <div>
            True Negative Images:{" "}
            {state.counts.trueNegativeCountGT25 +
              state.counts.trueNegativeCountLT25}
          </div>

          <H3>Required additional labels</H3>

          <div>
            Required Positive Labels: {state.counts.neededPresentLabelCount}
          </div>

          <div>
            Required Negative Labels: {state.counts.neededAbsentLabelCount}
          </div>
        </div>
      )}
    </div>
  );
}
