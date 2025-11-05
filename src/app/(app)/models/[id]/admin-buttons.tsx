"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { useSession } from "@/app/(app)/session-context";
import { CopyToClipboard } from "./copy-to-clipboard-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [leftThreshold, setLeftThreshold] = useState("100");
  const [rightThreshold, setRightThreshold] = useState("10000");

  const selectedProjectsQuery = selectedProjects
    .map((id) => `selectedProject=${encodeURIComponent(id)}`)
    .join("&");

  const inferenceTablesHref = `/api/models/${trainedModelId}/labels/${labelName}/inference-tables-excel${
    selectedProjectsQuery ? `?${selectedProjectsQuery}` : ""
  }`;

  const datasetCandidatesHref = `/api/models/${trainedModelId}/labels/${labelName}/dataset-candidates${
    selectedProjectsQuery ? `?${selectedProjectsQuery}` : ""
  }`;

  const thresholdsValid = (() => {
    if (leftThreshold.trim() === "" || rightThreshold.trim() === "") {
      return false;
    }
    const left = Number(leftThreshold);
    const right = Number(rightThreshold);
    return (
      Number.isFinite(left) &&
      Number.isFinite(right) &&
      left >= 0 &&
      right >= 0 &&
      left <= right
    );
  })();

  const downloadPotentialPositives = () => {
    if (!thresholdsValid) {
      return;
    }

    const params = new URLSearchParams({
      leftThreshold: leftThreshold.trim(),
      rightThreshold: rightThreshold.trim(),
    });

    selectedProjects.forEach((id) => {
      params.append("selectedProject", id);
    });

    window.location.href = `/api/models/${trainedModelId}/labels/${labelName}/potential-positives?${params.toString()}`;
  };

  if (session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="mb-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="left-threshold">Left threshold</Label>
          <Input
            id="left-threshold"
            type="number"
            min={0}
            value={leftThreshold}
            onChange={(event) => setLeftThreshold(event.target.value)}
            className="w-36"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="right-threshold">Right threshold</Label>
          <Input
            id="right-threshold"
            type="number"
            min={0}
            value={rightThreshold}
            onChange={(event) => setRightThreshold(event.target.value)}
            className="w-36"
          />
        </div>
        <ButtonGroup aria-label="Download button group">
          <Button
            onClick={downloadPotentialPositives}
            disabled={!thresholdsValid}
            className="whitespace-nowrap"
          >
            Download Potential Positives
          </Button>
          <Button asChild>
            <a href={datasetCandidatesHref} download>
              Dataset Candidates CSV
            </a>
          </Button>

          <ButtonGroupSeparator />

          <CopyToClipboard
            inferenceTableData={inferenceTableData}
            keysWithSequence={keysWithSequence}
          />
        </ButtonGroup>
      </div>
    </div>
  );
}
