"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyToClipboardProps {
  inferenceTableData: any;
  keysWithSequence: string[];
}

export function CopyToClipboard({
  inferenceTableData,
  keysWithSequence,
}: CopyToClipboardProps) {
  const copyTablesToClipboard = async () => {
    try {
      let clipboardText = "";

      keysWithSequence.forEach((key, index) => {
        const data = inferenceTableData[key];

        // Add title
        clipboardText += `${data.name}\n`;

        // Add confusion matrix headers
        clipboardText +=
          "Predictions\\Actual\tActual Present\tActual Absent\tTotal\n";

        // Add confusion matrix data
        clipboardText += `Predicted Present\t${data.tp}\t${data.fp}\t${data.tp + data.fp}\n`;
        clipboardText += `Predicted Absent\t${data.fn}\t${data.tn}\t${data.fn + data.tn}\n`;
        clipboardText += `Total\t${data.tp + data.fn}\t${data.fp + data.tn}\t${data.tp + data.tn + data.fp + data.fn}\n`;

        // Add empty row
        clipboardText += "\n";

        // Add metrics headers
        clipboardText +=
          "Prevalence\tPPV/Precision\tSENS/Recall\tSpecificity\tNPV\tF1\tAccuracy\n";

        // Calculate and add metrics
        const prevalence = (
          ((data.tp + data.fn) / (data.tp + data.tn + data.fp + data.fn)) *
          100
        ).toPrecision(4);
        const precision = ((data.tp / (data.tp + data.fp)) * 100).toPrecision(
          4
        );
        const recall = ((data.tp / (data.tp + data.fn)) * 100).toPrecision(4);
        const specificity = ((data.tn / (data.tn + data.fp)) * 100).toPrecision(
          4
        );
        const npv = ((data.tn / (data.tn + data.fn)) * 100).toPrecision(4);
        const f1 = (
          ((2 * data.tp) / (2 * data.tp + data.fp + data.fn)) *
          100
        ).toPrecision(4);
        const accuracy = (
          ((data.tp + data.tn) / (data.tp + data.tn + data.fp + data.fn)) *
          100
        ).toPrecision(4);

        clipboardText += `${prevalence}%\t${precision}%\t${recall}%\t${specificity}%\t${npv}%\t${f1}%\t${accuracy}%\n`;

        // Add separator between tables (except for the last one)
        if (index < keysWithSequence.length - 1) {
          clipboardText += "\n\n";
        }
      });

      await navigator.clipboard.writeText(clipboardText);
      toast.success("Inference tables copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Button onClick={copyTablesToClipboard} variant="outline">
      <Copy className="w-4 h-4 mr-2" />
      Copy Tables to Clipboard
    </Button>
  );
}
