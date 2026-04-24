# SKILL.md — Release Notes Generation Skill

## Purpose

Automate the creation of clear, concise, and user-friendly release notes for the Usiec Cepra game, based on pending (uncommitted) file changes in the repository.

## Workflow

1. **Detect Pending Changes**
   - Identify all files with uncommitted changes in the repository.
2. **Summarize Changes**
   - For each changed file, extract a high-level summary of what was added, changed, or fixed.
   - Group changes by feature, bugfix, or refactor if possible.
3. **Draft Release Notes**
   - Format the summary as a bullet list, using clear, non-technical language suitable for end users.
   - Add version and date headers if not present.
   - Use Polish language and game terminology (Oscypki, Krzepa, Ceper, Góral, etc.) as per project conventions.
4. **Review and Edit**
   - Allow the user to review, edit, or reorder entries before finalizing.
5. **Save to releaseNotes.js**
   - Insert the finalized release notes entry at the top of the `releaseNotesData` array in `src/data/releaseNotes.js`.

## Decision Points

- If a change is unclear, prompt the user for clarification or a user-facing summary.
- If multiple features/bugfixes are present, group and order by impact or user value.

## Quality Criteria

- Entries are concise, accurate, and user-focused.
- No technical jargon; all terms are accessible to players.
- Follows the formatting and language conventions of previous release notes.
- All major user-facing changes are included; minor refactors or internal-only changes are omitted unless impactful.

## Example Prompts

- "Stwórz notatki o wydaniu na podstawie zmian w plikach przed commitem."
- "Wygeneruj podsumowanie aktualizacji gry dla graczy."
- "Dodaj wpis do releaseNotes.js na podstawie ostatnich zmian."

## Related Customizations

- Skill for changelog generation for internal devs (technical focus)
- Skill for auto-translating release notes to English
- Skill for generating social media update posts from release notes
