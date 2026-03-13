import type { QuizSetMeta } from '../types/quiz';

type Props = {
  sets: QuizSetMeta[];
  selectedSetId: string | null;
  onSelect: (setId: string) => void;
};

export function SetSelector({ sets, selectedSetId, onSelect }: Props) {
  return (
    <section class="panel">
      <h2 class="panel-title">Pilih Set</h2>
      <div class="set-grid" role="group" aria-label="Daftar set quiz">
        {sets.map((set) => (
          <button
            key={set.id}
            type="button"
            class={selectedSetId === set.id ? 'set-button is-active' : 'set-button'}
            onClick={() => onSelect(set.id)}
            aria-pressed={selectedSetId === set.id}
          >
            {set.title}
          </button>
        ))}
      </div>
    </section>
  );
}