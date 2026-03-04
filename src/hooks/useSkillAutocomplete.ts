import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useQuestStore } from '../store/questStore';

export function useSkillAutocomplete(input: string) {
  const allSkills = useQuestStore(useShallow((s) => s.getAllSkills()));

  const suggestions = useMemo(() => {
    if (!input.trim()) return [];
    const q = input.toLowerCase();
    return allSkills.filter(
      (s) => s.toLowerCase().startsWith(q) && s.toLowerCase() !== q
    ).slice(0, 5);
  }, [allSkills, input]);

  return suggestions;
}
