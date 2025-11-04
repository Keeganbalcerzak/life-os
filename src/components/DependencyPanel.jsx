import { useMemo } from 'react';

const PRIORITY_WEIGHT = {
  milestone: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function DependencyPanel({ activeTasks = [], completedTasks = [], taskDeps = {} }) {
  const { tasksById, depsMap, revMap, unblocked, suggested, parallel, criticalPath } = useMemo(() => {
    const tById = new Map((activeTasks || []).map((t) => [String(t.id), t]));
    const deps = {};
    const rev = {};
    Object.entries(taskDeps || {}).forEach(([tid, list]) => {
      const id = String(tid);
      deps[id] = (list || []).map(String);
      (list || []).forEach((d) => {
        const key = String(d);
        if (!rev[key]) rev[key] = [];
        rev[key].push(id);
      });
    });
    const doneSet = new Set((completedTasks || []).map((t) => String(t.id)));

    // Unblocked = all deps done
    const unblockedList = (activeTasks || []).filter((t) => {
      const list = deps[String(t.id)] || [];
      return list.every((d) => doneSet.has(d));
    });

    // Suggested order: unblocked, then Kahn topological ordering fallback
    const inDegree = {};
    const nodes = new Set((activeTasks || []).map((t) => String(t.id)));
    nodes.forEach((n) => (inDegree[n] = 0));
    Object.values(deps).forEach((list) => list.forEach((d) => {
      if (nodes.has(String(d))) inDegree[String(d)] = inDegree[String(d)];
    }));
    // indegree on node = number of unfinished prerequisites that are still in active graph
    Object.entries(deps).forEach(([n, list]) => {
      (list || []).forEach((d) => {
        if (nodes.has(n) && nodes.has(String(d))) {
          inDegree[n] = (inDegree[n] || 0) + 1;
        }
      });
    });
    const unblockedSorted = [...unblockedList].sort((a, b) => {
      const aw = PRIORITY_WEIGHT[a.priority] || 1;
      const bw = PRIORITY_WEIGHT[b.priority] || 1;
      if (bw !== aw) return bw - aw;
      const ai = inDegree[String(a.id)] || 0;
      const bi = inDegree[String(b.id)] || 0;
      if (ai !== bi) return ai - bi;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    // Parallel = same as unblocked (can run concurrently)
    const parallelList = unblockedSorted.slice(0, 5);

    // Critical path via longest path in DAG (count deps remaining to sink)
    const memo = new Map();
    const children = (n) => (rev[String(n)] || []).filter((x) => tById.has(String(x)));
    const dfs = (n) => {
      const key = String(n);
      if (memo.has(key)) return memo.get(key);
      const nexts = children(key);
      if (nexts.length === 0) {
        memo.set(key, { len: 1, path: [key] });
        return memo.get(key);
      }
      let best = { len: 1, path: [key] };
      for (const m of nexts) {
        const r = dfs(m);
        if (r.len + 1 > best.len) {
          best = { len: r.len + 1, path: [key, ...r.path] };
        }
      }
      memo.set(key, best);
      return best;
    };
    let bestPath = [];
    // Consider only nodes that have unfinished deps (part of chains) or have dependents
    nodes.forEach((n) => {
      const r = dfs(n);
      if (r.len > bestPath.length) bestPath = r.path;
    });
    const cp = bestPath.map((id) => tById.get(String(id))).filter(Boolean);

    // Suggested tasks = take top 5
    const suggestedList = unblockedSorted.slice(0, 5);

    return {
      tasksById: tById,
      depsMap: deps,
      revMap: rev,
      unblocked: unblockedList,
      suggested: suggestedList,
      parallel: parallelList,
      criticalPath: cp,
    };
  }, [activeTasks, completedTasks, taskDeps]);

  const graphRows = useMemo(() => {
    const rows = [];
    Object.entries(depsMap).forEach(([tid, list]) => {
      if (!list || list.length === 0) return;
      const name = tasksById.get(String(tid))?.title || `Task ${String(tid).slice(0, 6)}`;
      const parts = list.map((d) => tasksById.get(String(d))?.title || `Task ${String(d).slice(0, 6)}`);
      rows.push({ name, deps: parts });
    });
    return rows.slice(0, 8); // cap rendering
  }, [depsMap, tasksById]);

  if ((activeTasks || []).length === 0) return null;

  return (
    <div className="deps-panel">
      <header className="deps-header">
        <h3>Dependencies</h3>
        <span>{graphRows.length} linked</span>
      </header>

      <div className="deps-section">
        <h4>Suggested Next</h4>
        {suggested.length === 0 ? (
          <div className="deps-empty">No suggestions right now</div>
        ) : (
          <ul className="deps-list-simple">
            {suggested.map((t) => (
              <li key={t.id}><span className="title">{t.title}</span><span className="sub">{t.priority}</span></li>
            ))}
          </ul>
        )}
      </div>

      <div className="deps-section">
        <h4>Parallel Tasks</h4>
        {parallel.length === 0 ? (
          <div className="deps-empty">None available</div>
        ) : (
          <ul className="deps-list-simple">
            {parallel.map((t) => (
              <li key={t.id}><span className="title">{t.title}</span></li>
            ))}
          </ul>
        )}
      </div>

      <div className="deps-section">
        <h4>Critical Path</h4>
        {criticalPath.length <= 1 ? (
          <div className="deps-empty">No long chains detected</div>
        ) : (
          <div className="critical-path">
            {criticalPath.map((t, i) => (
              <span key={t.id} className="cp-node">
                {t.title}{i < criticalPath.length - 1 && <span className="cp-arrow">→</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="deps-section">
        <h4>Dependency Graph</h4>
        {graphRows.length === 0 ? (
          <div className="deps-empty">No dependencies yet</div>
        ) : (
          <ul className="deps-graph">
            {graphRows.map((row, idx) => (
              <li key={idx}>
                <span className="dep-target">{row.name}</span>
                <span className="dep-arrow">←</span>
                <span className="dep-sources">{row.deps.join(', ')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

