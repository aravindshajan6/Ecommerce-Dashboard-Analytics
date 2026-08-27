import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', body, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-line/5 text-fg-3"><Icon size={22} /></span>
      <p className="text-sm font-medium text-fg">{title}</p>
      {body && <p className="max-w-xs text-xs text-fg-3">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, retry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <p className="text-sm font-medium text-danger">Couldn&rsquo;t load this widget</p>
      <p className="max-w-sm text-xs text-fg-3">{error?.message || 'Unknown error'}</p>
      {retry && <button onClick={retry} className="btn-ghost mt-1 text-xs">Retry</button>}
    </div>
  );
}
