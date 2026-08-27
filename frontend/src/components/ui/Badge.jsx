import clsx from 'clsx';

const MAP = {
  paid: 'bg-success/15 text-success', fulfilled: 'bg-success/15 text-success', delivered: 'bg-success/15 text-success', healthy: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning', partial: 'bg-warning/15 text-warning', low: 'bg-warning/15 text-warning', unfulfilled: 'bg-warning/15 text-warning',
  refunded: 'bg-danger/15 text-danger', voided: 'bg-danger/15 text-danger', out: 'bg-danger/15 text-danger', cancelled: 'bg-danger/15 text-danger',
  web: 'bg-primary/15 text-primary', mobile_app: 'bg-violet/15 text-violet', pos: 'bg-teal/15 text-teal', instagram: 'bg-pink/15 text-pink',
};

export default function Badge({ children, tone, className }) {
  const key = tone ?? (typeof children === 'string' ? children.toLowerCase() : '');
  return (
    <span className={clsx('pill capitalize', MAP[key] || 'bg-line/10 text-fg-2', className)}>
      {typeof children === 'string' ? children.replace(/_/g, ' ') : children}
    </span>
  );
}
