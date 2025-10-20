"use client";

import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { useSession } from "@/app/(app)/session-context";
import { CopyToClipboard } from "./copy-to-clipboard-button";

interface AdminButtonsProps {
  trainedModelId: number;
  selectedProjects: string[];
  labelName: string;
  inferenceTableData: any;
  keysWithSequence: string[];
}

export function AdminButtons({
  trainedModelId,
  selectedProjects,
  labelName,
  inferenceTableData,
  keysWithSequence,
}: AdminButtonsProps) {
  const session = useSession();

  if (session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <ButtonGroup aria-label="Download button group" className="mb-2">
      <Button asChild>
        <a
          href={`/api/models/${trainedModelId}/labels/${labelName}/potential-positives?leftThreshold=100&rightThreshold=10000&${selectedProjects.map((id) => `selectedProject=${encodeURIComponent(id)}`).join("&")}`}
        >
          Potential Positives (0.01 to 1.00)
        </a>
      </Button>
      <Button asChild>
        <a
          href={`/api/models/${trainedModelId}/labels/${labelName}/potential-positives?leftThreshold=100&rightThreshold=4999&${selectedProjects.map((id) => `selectedProject=${encodeURIComponent(id)}`).join("&")}`}
        >
          Potential Negatives (0.01 to 0.50)
        </a>
      </Button>
      <Button asChild>
        <a
          href={`/api/models/${trainedModelId}/labels/${labelName}/potential-positives?leftThreshold=5000&rightThreshold=10000&${selectedProjects.map((id) => `selectedProject=${encodeURIComponent(id)}`).join("&")}`}
        >
          Potential Positives (0.50 to 1.00)
        </a>
      </Button>
      <Button asChild>
        <a
          href={`/api/models/${trainedModelId}/labels/${labelName}/inference-tables-excel?${selectedProjects.map((id) => `selectedProject=${encodeURIComponent(id)}`).join("&")}`}
          download
        >
          Download Inference Tables Excel
        </a>
      </Button>
      <Button asChild>
        <a
          href={`/api/models/${trainedModelId}/labels/${labelName}/dataset-candidates?${selectedProjects.map((id) => `selectedProject=${encodeURIComponent(id)}`).join("&")}`}
          download
        >
          Dataset Candidates CSV
        </a>
      </Button>

      <ButtonGroupSeparator />

      <CopyToClipboard
        inferenceTableData={inferenceTableData}
        keysWithSequence={keysWithSequence}
      />
    </ButtonGroup>
  );
}
