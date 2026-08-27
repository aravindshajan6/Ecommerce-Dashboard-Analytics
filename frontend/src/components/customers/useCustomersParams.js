import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const PAGE_SIZE = 20;
export const DEFAULT_SORT = 'totalSpent:desc';

/**
 * Customers table state kept in the URL (?q=&page=&sort=field:dir) so the page and the
 * table share one query key (react-query dedupes the request) and links are shareable.
 */
export function useCustomersParams() {
  const [sp, setSp] = useSearchParams();
  const search = sp.get('q') || '';
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
  const sort = sp.get('sort') || DEFAULT_SORT;

  const update = useCallback((patch) => {
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => {
        const isDefault = v == null || v === '' || (k === 'page' && Number(v) === 1) || (k === 'sort' && v === DEFAULT_SORT);
        if (isDefault) next.delete(k); else next.set(k, String(v));
      });
      return next;
    }, { replace: true });
  }, [setSp]);

  const setSearch = useCallback((q) => update({ q, page: 1 }), [update]);
  const setPage = useCallback((p) => update({ page: p }), [update]);
  const toggleSort = useCallback((field) => {
    const [f, d] = sort.split(':');
    update({ sort: `${field}:${f === field && d === 'desc' ? 'asc' : 'desc'}`, page: 1 });
  }, [sort, update]);

  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, sort, ...(search ? { search } : {}) }),
    [page, sort, search],
  );

  return { params, search, page, sort, setSearch, setPage, toggleSort };
}
