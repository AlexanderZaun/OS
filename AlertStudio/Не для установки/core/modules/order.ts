import type { Manifest } from '../../sdk';
export function orderModules(input: Manifest[]): Manifest[] {
  const byId = new Map(input.map(m => [m.id, m]));
  if (byId.size !== input.length) throw Error('Duplicate module ID');
  const visiting = new Set<string>(), done = new Set<string>(), result: Manifest[] = [];
  function visit(m: Manifest) {
    if (visiting.has(m.id)) throw Error(`Dependency cycle: ${m.id}`);
    if (done.has(m.id)) return;
    visiting.add(m.id);
    for (const [id, version] of Object.entries(m.dependencies)) {
      const dep = byId.get(id);
      if (!dep || dep.version !== version) throw Error(`Missing dependency: ${id}@${version}`);
      visit(dep);
    }
    visiting.delete(m.id); done.add(m.id); result.push(m);
  }
  input.forEach(visit); return result;
}
