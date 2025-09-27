import { fetchDatasetStatistics } from "@/lib/data/labels";
import { datasetEnum } from "@/db/schema";
import { H3, H4 } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const datasetStatistics = await fetchDatasetStatistics(params.id);

  const datasetLabelValues = ["Present", "Absent"];

  const labelDatasets: any = {};
  const labelDatasetSummary: any = {};
  const labelValueSummary: any = {};
  const labelTotalCount: any = {};
  const labels: Set<string> = new Set();

  for (const datasetStatistic of datasetStatistics) {
    const { labelName, dataset, labelValue, count } = datasetStatistic;
    labels.add(labelName);
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
        </div>
      ))}
    </>
  );
}
