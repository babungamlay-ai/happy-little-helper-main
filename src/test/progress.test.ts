import { describe, expect, it } from 'vitest';
import { projectProgress } from '@/lib/progress';
describe('Project progress', () => {
  it('counts only completed tasks linked to this project', () => {
    expect(projectProgress([{ project_id: 'a', status: 'done' }, { project_id: 'a', status: 'review' }, { project_id: 'b', status: 'done' }], 'a')).toEqual({ total: 2, completed: 1, percent: 50 });
  });
  it('returns zero when no tasks are assigned to a project', () => {
    expect(projectProgress([], 'a')).toEqual({ total: 0, completed: 0, percent: 0 });
  });
});
