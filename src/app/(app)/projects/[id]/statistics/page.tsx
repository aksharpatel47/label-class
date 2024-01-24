import { fetchTaskLabelStatistics } from "@/lib/data/labels";

export default async function Page({ params }: { params: { id: string } }) {
  const labelStatistics = await fetchTaskLabelStatistics(params.id);

  if (labelStatistics.length === 0) {
    return <div>No labels yet.</div>;
  }

  return (
    <div>
      {labelStatistics.map((labelStatistic) => (
        <div key={labelStatistic.labelId}>
          <h2>
            {labelStatistic.labelName} - {labelStatistic.labelValue}
          </h2>
          <div>{labelStatistic.count}</div>
        </div>
      ))}
    </div>
  );
}
