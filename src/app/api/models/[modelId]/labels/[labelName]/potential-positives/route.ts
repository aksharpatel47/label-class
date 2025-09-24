import { fetchPotentialUnlabeledPositivesData } from "@/lib/data/models";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { modelId: string; labelName: string } }
) {
  const { modelId, labelName } = params;

  const projectIds = request.nextUrl.searchParams.getAll("selectedProject");
  const leftThreshold = request.nextUrl.searchParams.get("leftThreshold") || "";
  const rightThreshold =
    request.nextUrl.searchParams.get("rightThreshold") || "";

  if (!modelId || !labelName || !projectIds.length) {
    return new Response(
      JSON.stringify({ error: "Missing modelId, labelName, or projectIds" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const leftThresholdValue = parseInt(leftThreshold);
  const rightThresholdValue = parseInt(rightThreshold);

  if (
    isNaN(leftThresholdValue) ||
    isNaN(rightThresholdValue) ||
    leftThresholdValue < 0 ||
    leftThresholdValue > 10000 ||
    rightThresholdValue < 0 ||
    rightThresholdValue > 10000 ||
    leftThresholdValue >= rightThresholdValue
  ) {
    return new Response(
      JSON.stringify({
        error:
          "Invalid threshold values. Ensure they are between 0 and 1, and leftThreshold < rightThreshold.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const positives = await fetchPotentialUnlabeledPositivesData(
    projectIds,
    labelName,
    parseInt(modelId, 10),
    leftThresholdValue,
    rightThresholdValue
  );

  const csvRowHeader = [
    "project_name,potential_unlabeled_positives,train_present,train_absent,valid_present,valid_absent,test_present,test_absent,link_to_label",
  ];
  // Convert threshold to percentage for URL (e.g., 100 -> 1.00%, 5000 -> 50.00%, 4999 -> 49.99%)
  const leftThresholdPercent = (leftThresholdValue / 100.0).toFixed(2);
  const rightThresholdPercent = (rightThresholdValue / 100.0).toFixed(2);
  // Encode as >=X% and <=Y% for URL
  const encodedThreshold = encodeURIComponent(
    `${leftThresholdPercent}-${rightThresholdPercent}%`
  );
  const csvRows = positives.map((p) => {
    return [
      p.projectName,
      p.potentialPositives,
      p.trainPresent,
      p.trainAbsent,
      p.validPresent,
      p.validAbsent,
      p.testPresent,
      p.testAbsent,
      `https://walkit-labels.aksharpatel47.com/projects/${p.projectId}/label?label=${p.labelId}&labelvalue=Unlabeled&trainedmodel=${modelId}&inferencevalue=${encodedThreshold}`,
    ].join(",");
  });

  // Calculate totals for each numeric column
  const totals = positives.reduce(
    (acc, p) => {
      acc[0] += Number(p.potentialPositives) || 0;
      acc[1] += Number(p.trainPresent) || 0;
      acc[2] += Number(p.trainAbsent) || 0;
      acc[3] += Number(p.validPresent) || 0;
      acc[4] += Number(p.validAbsent) || 0;
      acc[5] += Number(p.testPresent) || 0;
      acc[6] += Number(p.testAbsent) || 0;
      return acc;
    },
    [0, 0, 0, 0, 0, 0, 0]
  );
  const totalRow = ["TOTAL", ...totals, ""].join(",");

  const csvContent = [csvRowHeader.join(",")]
    .concat(csvRows)
    .concat([totalRow])
    .join("\n");

  const fileName = `${labelName.toLowerCase().replace(/\s+/g, "_")}_potential_unlabeled_positives_${leftThresholdPercent}-${rightThresholdPercent}pct.csv`;

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
