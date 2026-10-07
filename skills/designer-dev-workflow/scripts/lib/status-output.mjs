// Presentation only: decisions and exit codes must use the original gate result.
// Full evidence remains in task.json; no evidence is cached or rewritten here.
export function summarizeStatus(result) {
  const {evidence, trackedInputs, ...summary} = result;
  if (trackedInputs) summary.trackedInputCount = trackedInputs.length;
  if (evidence) {
    summary.evidence = {
      id: evidence.id, status: evidence.status, canFinish: evidence.canFinish,
      stateFile: evidence.stateFile, trackedInputCount: evidence.trackedInputs.length,
      historyCount: evidence.history.length,
      criteria: evidence.criteria.map(({id, title, kind, required, status, context, staleArtifacts, latest}) => ({
        id, title, kind, required, status, context, staleArtifacts,
        ...(latest ? {latest: {
          method: latest.method, status: latest.status,
          artifacts: latest.artifacts?.map(({file}) => file)
        }} : {})
      })),
      blockers: evidence.blockers, risks: evidence.risks,
      nextActions: evidence.nextActions, scope: evidence.scope
    };
  }
  return summary;
}
