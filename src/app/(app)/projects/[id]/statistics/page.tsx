import { fetchTaskLabelStatistics } from "@/lib/data/labels";
import { H3, H4 } from "@/components/ui/typography";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { taskLabelValue } from "@/db/schema";
import { Separator } from "@/components/ui/separator";

export default async function Page({ params }: { params: { id: string } }) {
  const labelStatistics = await fetchTaskLabelStatistics(params.id);

  if (labelStatistics.length === 0) {
    return <div>No labels yet.</div>;
  }

  const users: Set<string> = new Set();
  const labels: Set<string> = new Set();

  const statistics: any = {};

  const labelValuesAnnotationCount: any = {};
  const userAnnotationCount: any = {};

  for (const labelStatistic of labelStatistics) {
    const { user, labelValue, labelName, count } = labelStatistic;
    users.add(user);
    labels.add(labelName);

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

  return (
    <>
      {Array.from(labels).map((label) => (
        <div key={label} className="mt-4">
          <H3 key={label}>{label}</H3>
          <Separator className="mb-4" />
          <H4>Label Statistics</H4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Labeled By</TableHead>
                {Array.from(taskLabelValue.enumValues).map((labelValue) => (
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
                  {Array.from(taskLabelValue.enumValues).map((labelValue) => (
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
                {Array.from(taskLabelValue.enumValues).map((labelValue) => (
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
