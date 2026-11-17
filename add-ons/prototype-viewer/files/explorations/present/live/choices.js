// What the client sees: one saved choice per prototype, { name, show, round,
// order }. On Metalab Sites the choices live in the viewer site's own small
// database (collection "choices"). Clients may be allowed to save (so they can
// comment), so only choices saved by MetaLab people count.
// Anywhere else (pnpm present) they live in this browser, and you are staff.

window.presentChoices = (() => {
  const COLLECTION = 'choices';
  const LOCAL_KEY = 'present-choices';
  const online = () => Boolean(window.sites?.db);
  const fields = item => ({ ...(item.data ?? item), id: item.id ?? item._id });
  const byStaff = c => /@metalab\.com$/i.test(c.author_email ?? '');

  async function person() {
    if (!online()) return { staff: true, local: true };
    const user = await window.sites.user();
    const email = user?.email ?? '';
    // (not user.tenant: an invited guest carries the same tenant as staff)
    return { staff: /@metalab\.com$/i.test(email), email, name: user?.display_name ?? '' };
  }

  async function load() {
    if (!online()) {
      try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch { return {}; }
    }
    const items = await window.sites.db.collection(COLLECTION).limit(500).list();
    return Object.fromEntries(items.map(fields).filter(c => c.name && byStaff(c)).map(c => [c.name, c]));
  }

  async function save(all, name, patch) {
    const next = { ...all[name], name, ...patch };
    if (!online()) {
      all[name] = next;
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(all)); } catch {}
      return next;
    }
    const col = window.sites.db.collection(COLLECTION);
    const { id, ...data } = next;
    all[name] = fields(id ? await col.update(id, data) : await col.create(data));
    return all[name];
  }

  return { person, load, save, online };
})();
