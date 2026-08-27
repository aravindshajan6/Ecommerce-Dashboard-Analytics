import { useCallback } from 'react';
import clsx from 'clsx';

/**
 * Glass panel with spotlight hover. Props: title, subtitle, action (node), className, bodyClassName,
 * spotlight (bool, default true), gradient (animated conic border), as (element tag).
 */
export default function GlassCard({
  title, subtitle, action, icon: Icon, children, className, bodyClassName, spotlight = true, gradient = false, as: Tag = 'section', style, ...rest
}) {
  const onMove = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);

  return (
    <Tag
      onPointerMove={spotlight ? onMove : undefined}
      className={clsx('glass', spotlight && 'spot', gradient && 'gradient-border', 'flex min-w-0 flex-col', className)}
      style={style}
      {...rest}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div className="min-w-0 flex items-start gap-2.5">
            {Icon && (
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                <Icon size={15} />
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="truncate text-sm font-semibold text-fg">{title}</h3>}
              {subtitle && <p className="truncate text-xs text-fg-3">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={clsx('relative min-w-0 flex-1 px-5 pb-5', !(title || action) && 'pt-5', bodyClassName)}>{children}</div>
    </Tag>
  );
}
