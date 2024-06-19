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
import { Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export interface InferenceTableProps {
  title: string;
  tp: number;
  tpLink?: string;
  fn: number;
  fnLink?: string;
  fp: number;
  fpLink?: string;
  tn: number;
  tnLink?: string;
}

export async function InferenceTable({
  title,
  tp,
  tpLink,
  fn,
  fnLink,
  fp,
  fpLink,
  tn,
  tnLink,
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
            <TableCell>
              {tpLink ? (
                <Link
                  href={tpLink}
                  target="_blank"
                  className="flex items-center"
                >
                  <span>{tp}</span>
                  <LinkIcon height={13} />
                </Link>
              ) : (
                tp
              )}
            </TableCell>
            <TableCell>
              {fpLink ? (
                <Link
                  href={fpLink}
                  target="_blank"
                  className="flex items-center"
                >
                  <span>{fp}</span>
                  <LinkIcon height={13} />
                </Link>
              ) : (
                fp
              )}
            </TableCell>
            <TableCell>{tp + fp}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Predicted Absent</TableHead>
            <TableCell>
              {fnLink ? (
                <Link
                  href={fnLink}
                  target="_blank"
                  className="flex items-center"
                >
                  <span>{fn}</span>
                  <LinkIcon height={13} />
                </Link>
              ) : (
                fn
              )}
            </TableCell>
            <TableCell>
              {tnLink ? (
                <Link
                  href={tnLink}
                  target="_blank"
                  className="flex items-center"
                >
                  <span>{tn}</span>
                  <LinkIcon height={13} />
                </Link>
              ) : (
                tn
              )}
            </TableCell>
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
