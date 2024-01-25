import { fetchTaskLabelStatistics } from "@/lib/data/labels";

export default async function Page({ params }: { params: { id: string } }) {
  const labelStatistics = await fetchTaskLabelStatistics(params.id);

  if (labelStatistics.length === 0) {
    return <div>No labels yet.</div>;
  }

  const users: Set<string> = new Set();
  const labels: Set<string> = new Set();
  const labelValues: Set<string> = new Set();
  const statistics: any = {};
  const labelTotals: any = {};
  const userTotals: any = {};

  for (const labelStatistic of labelStatistics) {
    users.add(labelStatistic.user);
    labels.add(labelStatistic.labelName);
    labelValues.add(labelStatistic.labelValue);

    if (!statistics[labelStatistic.user]) {
      statistics[labelStatistic.user] = {};
    }

    const labelKey = `${labelStatistic.labelName}-${labelStatistic.labelValue}`;
    if (!labelTotals[labelKey]) {
      labelTotals[labelKey] = 0;
    }

    if (!userTotals[labelStatistic.user]) {
      userTotals[labelStatistic.user] = 0;
    }

    if (!statistics[labelStatistic.user][labelStatistic.labelName]) {
      statistics[labelStatistic.user][labelStatistic.labelName] = {};
    }

    if (
      !statistics[labelStatistic.user][labelStatistic.labelName][
        labelStatistic.labelValue
      ]
    ) {
      statistics[labelStatistic.user][labelStatistic.labelName][
        labelStatistic.labelValue
      ] = 0;
    }

    statistics[labelStatistic.user][labelStatistic.labelName][
      labelStatistic.labelValue
    ] += labelStatistic.count;

    labelTotals[labelKey] += labelStatistic.count;
    userTotals[labelStatistic.user] += labelStatistic.count;
  }

  return (
    <div>
      <div className="flex flex-col w-full gap-4">
        <div className="flex gap-8">
          <div className="flex-1">Labeled By</div>
          {Array.from(labels).map((label) => (
            <div key={label} className="flex-1">
              <div>{label}</div>
              <div className="flex gap-2">
                {Array.from(labelValues).map((labelValue) => (
                  <div key={`${label}-${labelValue}`} className="flex-1">
                    {labelValue}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {Array.from(users).map((user) => (
          <div key={user} className="flex gap-8">
            <div className="flex-1">{user}</div>
            {Array.from(labels).map((label) => {
              return (
                <div key={`${user}-${label}`} className="flex gap-2 flex-1">
                  {Array.from(labelValues).map((labelValue) => (
                    <div
                      key={`${user}-${label}-${labelValue}`}
                      className="flex-1"
                    >
                      {statistics[user]?.[label]?.[labelValue] ?? 0}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-8">
        <div className="flex-1">Total</div>
        {Array.from(labels).map((label) => (
          <div key={`${label}`} className="flex gap-2 flex-1">
            {Array.from(labelValues).map((labelValue) => (
              <div key={`${label}-${labelValue}`} className="flex-1">
                {labelTotals[`${label}-${labelValue}`]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
