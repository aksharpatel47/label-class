"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Project } from "@/db/schema";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface IModelInferenceMatrixProps {
  projects: Project[];
  projectLabelNames: string[];
}

export function ModelInferenceMatrixProjectForm({
  projects,
  projectLabelNames,
}: IModelInferenceMatrixProps) {
  const searchParams = useSearchParams();
  const [selectedProject, setSelectedProject] = useState<string[]>(
    searchParams.getAll("selectedProject"),
  );
  const [selectedLabelName, setSelectedLabelName] = useState<string>(
    searchParams.get("labelName") || "",
  );

  return (
    <form method="get" className="flex flex-col gap-2 mt-2 mb-2">
      <Select
        name="labelName"
        value={selectedLabelName}
        onValueChange={(newValue) => setSelectedLabelName(newValue)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Label Name" />
        </SelectTrigger>
        <SelectContent>
          {projectLabelNames.map((l) => (
            <SelectItem value={l} key={l}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-col gap-2">
        {projects.map((project) => (
          <div key={project.id} className="h-6 flex items-center gap-2">
            <Checkbox
              key={project.id}
              name="selectedProject"
              value={project.id}
              checked={selectedProject.includes(project.id)}
              onClick={() => {
                if (selectedProject.includes(project.id)) {
                  setSelectedProject(
                    selectedProject.filter((id) => id !== project.id),
                  );
                } else {
                  setSelectedProject([...selectedProject, project.id]);
                }
              }}
            />
            <label>{project.name}</label>
          </div>
        ))}
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
}
