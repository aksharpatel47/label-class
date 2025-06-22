import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { H3 } from "@/components/ui/typography";
import { datasetEnumValues, Project, taskLabelValue } from "@/db/schema";
import { fetchDatasetStatisticsByLabel } from "@/lib/data/labels";
import { User } from "lucia";

interface DatasetTableProps {
  allProjects: Project[];
  selectedProjects: string[];
  labelName: string;
  user: User;
}

export async function DatasetTables({
  allProjects,
  selectedProjects,
  labelName,
  user,
}: DatasetTableProps) {
  const datasetStatistics = await fetchDatasetStatisticsByLabel(
    labelName,
    selectedProjects
  );

  if (!selectedProjects || !labelName || !datasetStatistics) {
    return <div>No projects selected or no data available.</div>;
  }

  const allDatasets = [...datasetEnumValues, "Total"] as const;
  const allLabelValues = [...taskLabelValue.enumValues, "Total"] as const;
  const labelValuesToUse = ["Present", "Absent", "Total"] as const;

  const datasetCounts: Record<
    string,
    Record<
      (typeof allDatasets)[number],
      Record<(typeof allLabelValues)[number], number>
    >
  > = {};

  const baseLabelValueesCounts = {
    Present: 0,
    Absent: 0,
    Difficult: 0,
    Skip: 0,
    Total: 0,
  };

  const totalProjectName = "Total";

  for (const datasetStatistic of datasetStatistics) {
    const { projectId, dataset, labelValue, count } = datasetStatistic;
    if (!labelValuesToUse.includes(labelValue as any)) {
      continue; // Skip if the label value is not in the list of values to use
    }
    const projectName =
      allProjects.find((p) => p.id === projectId)?.name || "Unknown Project";

    if (!datasetCounts[totalProjectName]) {
      datasetCounts[totalProjectName] = {
        train: { ...baseLabelValueesCounts },
        test: { ...baseLabelValueesCounts },
        valid: { ...baseLabelValueesCounts },
        Total: {
          ...baseLabelValueesCounts,
        },
      };
    }

    if (!datasetCounts[projectName]) {
      datasetCounts[projectName] = {
        train: { ...baseLabelValueesCounts },
        test: { ...baseLabelValueesCounts },
        valid: { ...baseLabelValueesCounts },
        Total: {
          ...baseLabelValueesCounts,
        },
      };
    }

    datasetCounts[totalProjectName][dataset][labelValue] += count;
    datasetCounts[projectName][dataset][labelValue] += count;
    datasetCounts[totalProjectName]["Total"][labelValue] += count;
    datasetCounts[projectName]["Total"][labelValue] += count;
    datasetCounts[totalProjectName][dataset]["Total"] += count;
    datasetCounts[projectName][dataset]["Total"] += count;
    datasetCounts[totalProjectName]["Total"]["Total"] += count;
    datasetCounts[projectName]["Total"]["Total"] += count;
  }

  return (
    <div className="flex flex-col gap-4">
      {user.role === "ADMIN" && (
        <Button asChild>
          <a
            href={`/api/datasets?labelName=${encodeURIComponent(labelName)}${selectedProjects
              .map((id) => `&projectIds=${encodeURIComponent(id)}`)
              .join("")}`}
          >
            Download Dataset CSV
          </a>
        </Button>
      )}
      <div className="flex flex-wrap gap-8">
        {Object.entries(datasetCounts).map(([projectName, datasets]) => (
          <div key={projectName} className="mb-8">
            <H3>{projectName}</H3>
            <Table className="w-[300px] mb-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset</TableHead>
                  {labelValuesToUse.map((labelValue) => (
                    <TableHead key={labelValue}>{labelValue}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(datasets).map(([dataset, values]) => (
                  <TableRow key={dataset}>
                    <TableHead>{dataset}</TableHead>
                    {labelValuesToUse.map((labelValue) => (
                      <TableHead key={labelValue}>
                        {values[labelValue]}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  );
}
