import {
  fetchDatasetStatistics,
  fetchTaskLabelStatistics,
} from "@/lib/data/labels";
import { H2, H3, H4 } from "@/components/ui/typography";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { datasetEnum } from "@/db/schema";
import { Separator } from "@/components/ui/separator";

export default async function Page({ params }: { params: { id: string } }) {
  const labelStatistics = await fetchTaskLabelStatistics(params.id);
  const datasetStatistics = await fetchDatasetStatistics(params.id);
  const datasetLabelValues = ["Present", "Absent"];

  if (labelStatistics.length === 0) {
    return <div>No labels yet.</div>;
  }

  const users: Set<string> = new Set();
  const labels: Set<string> = new Set();
  const labelValues: Set<string> = new Set();
  const statistics: any = {};
  const labelDatasets: any = {};
  const labelDatasetSummary: any = {};
  const labelValueSummary: any = {};
  const labelTotalCount: any = {};

  const labelValuesAnnotationCount: any = {};
  const userAnnotationCount: any = {};

  for (const labelStatistic of labelStatistics) {
    const { user, labelValue, labelName, count } = labelStatistic;
    users.add(user);
    labels.add(labelName);
    labelValues.add(labelValue);

    const labelKey = `${labelName}-${labelValue}`;
    if (!labelValuesAnnotationCount[labelKey]) {
      labelValuesAnnotationCount[labelKey] = 0;
    }
    labelValuesAnnotationCount[labelKey] += count;

    const userKey = `${labelName}-${user}`;
    if (!userAnnotationCount[userKey]) {
      userAnnotationCount[userKey] = 0;
    }
    userAnnotationCount[userKey] += count;

    if (!statistics[labelName]) {
      statistics[labelName] = {};
    }

    if (!statistics[labelName][user]) {
      statistics[labelName][user] = {};
    }

    if (!statistics[labelName][user][labelValue]) {
      statistics[labelName][user][labelValue] = 0;
    }

    statistics[labelName][user][labelValue] += count;
  }

  for (const datasetStatistic of datasetStatistics) {
    const { labelName, dataset, labelValue, count } = datasetStatistic;
    if (!labelDatasets[labelName]) {
      labelDatasets[labelName] = {};
    }

    if (!labelValueSummary[labelName]) {
      labelValueSummary[labelName] = {};

      for (const labelValue of datasetLabelValues) {
        labelValueSummary[labelName][labelValue] = 0;
      }
    }

    if (!labelTotalCount[labelName]) {
      labelTotalCount[labelName] = 0;
    }

    if (!labelDatasetSummary[labelName]) {
      labelDatasetSummary[labelName] = {};

      for (const dataset of datasetEnum.enumValues) {
        labelDatasetSummary[labelName][dataset] = 0;
      }
    }

    if (!labelDatasets[labelName][dataset]) {
      labelDatasets[labelName][dataset] = {};
    }

    if (!labelDatasets[labelName][dataset][labelValue]) {
      labelDatasets[labelName][dataset][labelValue] = 0;
    }

    labelValueSummary[labelName][labelValue] += count;
    labelTotalCount[labelName] += count;
    labelDatasetSummary[labelName][dataset] += count;
    labelDatasets[labelName][dataset][labelValue] = count;
  }

  return (
    <>
      {Array.from(labels).map((label) => (
        <div key={label} className="mt-4">
          <H3 key={label}>{label}</H3>
          <Separator className="mb-4" />
          <H4>Dataset Statistics</H4>
          <Table className="w-[300px] mb-4">
            <TableHeader>
              <TableRow>
                <TableHead>Dataset</TableHead>
                {datasetLabelValues.map((d) => (
                  <TableHead key={`${label}-${d}`}>{d}</TableHead>
                ))}
                <TableHead>Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(datasetEnum.enumValues).map((d) => (
                <TableRow key={`${label}-${d}`}>
                  <TableCell>{d}</TableCell>
                  {datasetLabelValues.map((labelValue) => (
                    <TableCell key={`${label}-${d}-${labelValue}`}>
                      {labelDatasets[label]?.[d]?.[labelValue] ?? 0}
                    </TableCell>
                  ))}
                  <TableCell>{labelDatasetSummary[label]?.[d] ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                {datasetLabelValues.map((labelValue) => (
                  <TableCell key={`${label}-${labelValue}`}>
                    {labelValueSummary[label]?.[labelValue] ?? 0}
                  </TableCell>
                ))}
                <TableCell>{labelTotalCount[label]}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          <H4>Label Statistics</H4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Labeled By</TableHead>
                {Array.from(labelValues).map((labelValue) => (
                  <TableHead key={`${label}-${labelValue}`}>
                    {labelValue}
                  </TableHead>
                ))}
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(users).map((user) => (
                <TableRow key={`${label}-${user}`}>
                  <TableCell>{user}</TableCell>
                  {Array.from(labelValues).map((labelValue) => (
                    <TableCell key={`${label}-${user}-${labelValue}`}>
                      {statistics[label]?.[user]?.[labelValue] ?? 0}
                    </TableCell>
                  ))}
                  <TableCell>
                    {userAnnotationCount[`${label}-${user}`]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                {Array.from(labelValues).map((labelValue) => (
                  <TableCell key={`${label}-${labelValue}`}>
                    {labelValuesAnnotationCount[`${label}-${labelValue}`]}
                  </TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      ))}
    </>
  );
}
