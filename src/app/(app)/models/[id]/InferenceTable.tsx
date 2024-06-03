import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { H3 } from "@/components/ui/typography";

export interface InferenceTableProps {
  title: string;
  tp: number;
  fn: number;
  fp: number;
  tn: number;
}

export async function InferenceTable({
  title,
  tp,
  fn,
  fp,
  tn,
}: InferenceTableProps) {
  return (
    <div className="flex flex-col">
      <H3>{title}</H3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Predictions\Actual</TableHead>
            <TableHead>Actual Present</TableHead>
            <TableHead>Actual Absent</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead>Predicted Present</TableHead>
            <TableCell>{tp}</TableCell>
            <TableCell>{fp}</TableCell>
            <TableCell>{tp + fp}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Predicted Absent</TableHead>
            <TableCell>{fn}</TableCell>
            <TableCell>{tn}</TableCell>
            <TableCell>{fn + tn}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Total</TableHead>
            <TableCell>{tp + fn}</TableCell>
            <TableCell>{fp + tn}</TableCell>
            <TableCell>{tp + tn + fp + fn}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prevalence</TableHead>
            <TableHead>PPV/Precision</TableHead>
            <TableHead>SENS/Recall</TableHead>
            <TableHead>Specificity</TableHead>
            <TableHead>NPV</TableHead>
            <TableHead>F1</TableHead>
            <TableHead>Accuracy</TableHead>
          </TableRow>
        </TableHeader>
        <TableFooter>
          <TableRow>
            <TableCell>
              {(((tp + fn) / (tp + tn + fp + fn)) * 100).toPrecision(4)}%
            </TableCell>
            <TableCell>{((tp / (tp + fp)) * 100).toPrecision(4)}%</TableCell>
            <TableCell>{((tp / (tp + fn)) * 100).toPrecision(4)}%</TableCell>
            <TableCell>{((tn / (tn + fp)) * 100).toPrecision(4)}%</TableCell>
            <TableCell>{((tn / (tn + fn)) * 100).toPrecision(4)}%</TableCell>
            <TableCell>
              {(((2 * tp) / (2 * tp + fp + fn)) * 100).toPrecision(4)}%
            </TableCell>
            <TableCell>
              {(((tp + tn) / (tp + tn + fp + fn)) * 100).toPrecision(4)}%
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
