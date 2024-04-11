import { ProjectLabel, TrainedModel } from "@/db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface IInferenceForm {
  trainedModels: TrainedModel[];
  selectedModelId?: string;
  label?: string;
  projectLabels: ProjectLabel[];
  dataset?: string;
}
export function InferenceStatisticsForm(props: IInferenceForm) {
  return (
    <form method="get" className="flex gap-4">
      <Select name="trainedModelId">
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
      <Select name="label">
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
      <Select name="dataset">
        <SelectTrigger className="w-[400px]">
          <SelectValue placeholder="Select Dataset" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="train">Train</SelectItem>
          <SelectItem value="valid">Valid</SelectItem>
          <SelectItem value="test">Test</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit">Submit</Button>
    </form>
  );
}
