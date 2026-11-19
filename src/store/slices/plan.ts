/** Reducer slice: The week plan. Returns undefined for actions it doesn't handle. */
import type { AppState, PlanItem, WeekdayId } from '../../lib/types';
import {  weekKey } from '../../lib/date';
import type { Action } from '../actions';
import {  planId, normalizePlan, withPlanDay, cleanTime } from '../state';

export function planSlice(state: AppState, action: Action): AppState | undefined {
  switch (action.type) {
    case 'PRUNE_PLAN_EVENTS': {
      // One-time plan items vanish once their day is over.
      const plan = normalizePlan(state.weekPlan);
      const all = plan.events ?? [];
      const events = all.filter((e) => (e.date ?? '') >= action.today);
      if (events.length === all.length) return state;
      const gone = new Set(all.filter((e) => !events.includes(e)).map((e) => e.id));
      return { ...state, weekPlan: { ...plan, events, checkedIds: plan.checkedIds.filter((id) => !gone.has(id)) } };
    }


    case 'PLAN_ADD': {
      const text = action.text.trim();
      if (!text) return state;
      const plan = normalizePlan(state.weekPlan);
      const note = action.note?.trim() || undefined;
      if (action.date && /^\d{4}-\d{2}-\d{2}$/.test(action.date)) {
        const event: PlanItem = { id: planId(), text, time: cleanTime(action.time), category: action.category, date: action.date, note };
        return { ...state, weekPlan: { ...plan, events: [...(plan.events ?? []), event] } };
      }
      return withPlanDay(state, action.day, [...plan.days[action.day], { id: planId(), text, time: cleanTime(action.time), category: action.category, note }]);
    }


    case 'PLAN_UPDATE': {
      const text = action.text.trim();
      if (!text) return state;
      const plan = normalizePlan(state.weekPlan);
      const note = action.note?.trim() || undefined;
      if ((plan.events ?? []).some((e) => e.id === action.itemId)) {
        const events = (plan.events ?? []).map((e) =>
          e.id === action.itemId ? { ...e, text, time: cleanTime(action.time), category: action.category, note, date: action.date || e.date } : e,
        );
        return { ...state, weekPlan: { ...plan, events } };
      }
      return withPlanDay(
        state,
        action.day,
        plan.days[action.day].map((i) => (i.id === action.itemId ? { ...i, text, time: cleanTime(action.time), category: action.category, note } : i)),
      );
    }


    case 'PLAN_DELETE': {
      const plan = normalizePlan(state.weekPlan);
      const next = withPlanDay(state, action.day, plan.days[action.day].filter((i) => i.id !== action.itemId));
      return {
        ...next,
        weekPlan: {
          ...next.weekPlan,
          events: (plan.events ?? []).filter((e) => e.id !== action.itemId),
          checkedIds: next.weekPlan.checkedIds.filter((id) => id !== action.itemId),
        },
      };
    }


    case 'PLAN_TOGGLE': {
      const plan = normalizePlan(state.weekPlan);
      const wk = weekKey();
      const current = plan.checkedWeekKey === wk ? plan.checkedIds : [];
      const checkedIds = current.includes(action.itemId)
        ? current.filter((id) => id !== action.itemId)
        : [...current, action.itemId];
      return { ...state, weekPlan: { ...plan, checkedWeekKey: wk, checkedIds } };
    }


    case 'PLAN_COPY_DAY': {
      const plan = normalizePlan(state.weekPlan);
      const source = plan.days[action.from];
      const days = { ...plan.days };
      for (const day of action.to) {
        if (day === action.from) continue;
        const existing = days[day];
        // Skip entries that are already on that day so copying twice doesn't duplicate.
        const additions = source
          .filter((s) => !existing.some((e) => e.text === s.text && (e.time ?? '') === (s.time ?? '')))
          .map((s) => ({ ...s, id: planId() }));
        days[day] = [...existing, ...additions];
      }
      return { ...state, weekPlan: { ...plan, days } };
    }


    case 'PLAN_LOAD_STARTER': {
      // Only fills days that are still empty, so it can never wipe something the user wrote.
      const plan = normalizePlan(state.weekPlan);
      const days = { ...plan.days };
      for (const day of Object.keys(days) as WeekdayId[]) {
        if (action.replace || days[day].length === 0) days[day] = (action.days[day] ?? []).map((i) => ({ ...i, id: planId() }));
      }
      return { ...state, weekPlan: { ...plan, days } };
    }


    case 'PLAN_CLEAR_DAY': {
      const plan = normalizePlan(state.weekPlan);
      const removed = new Set(plan.days[action.day].map((i) => i.id));
      const next = withPlanDay(state, action.day, []);
      return { ...next, weekPlan: { ...next.weekPlan, checkedIds: plan.checkedIds.filter((id) => !removed.has(id)) } };
    }

    default:
      return undefined;
  }
}
