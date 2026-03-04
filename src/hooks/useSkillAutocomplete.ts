import { useState, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';

export function useSkillAutocomplete(input: string) {
  const allSkills = useProjectStore((s) => s.getAllSkills());

  const suggestions = useMemo(() => {
    if (!input.trim()) return [];
    const q = input.toLowerCase();
    return allSkills.filter(
      (s) => s.toLowerCase().startsWith(q) && s.toLowerCase() !== q
    ).slice(0, 5);
  }, [allSkills, input]);

  return suggestions;
}
