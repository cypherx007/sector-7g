// Supabase auth + reviews helpers.
// Loaded after the supabase-js CDN script and config.js.

(function () {
  const cfg = window.APP_CONFIG || {};
  const ready =
    cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("PASTE_") &&
    !cfg.SUPABASE_ANON_KEY.includes("PASTE_");

  if (!ready) console.warn("[auth] config.js not filled in.");

  const client = ready
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  async function signUp({ email, password, agentId }) {
    if (!client) throw new Error("Supabase not configured.");
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { agent_id: agentId } },
    });
    if (error) throw error;
    return data;
  }

  async function signIn({ email, password }) {
    if (!client) throw new Error("Supabase not configured.");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
  }

  async function getUser() {
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data?.user ?? null;
  }

  async function requireAuth(redirectTo = "index.html") {
    const u = await getUser();
    if (!u) { window.location.replace(redirectTo); return null; }
    return u;
  }

  async function requireAnon(redirectTo = "dashboard.html") {
    const u = await getUser();
    if (u) {
      const params = new URLSearchParams(window.location.search);
      const flag = params.get("flag");
      const dest = flag ? `${redirectTo}?flag=${encodeURIComponent(flag)}` : redirectTo;
      window.location.replace(dest);
    }
  }

  // ---- Reviews ----
  async function listReviews() {
    if (!client) return [];
    const { data, error } = await client
      .from("reviews")
      .select("*")
      .order("when_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function addReview(r) {
    if (!client) throw new Error("Supabase not configured.");
    const u = await getUser();
    if (!u) throw new Error("Not signed in.");
    const { data, error } = await client.from("reviews").insert({
      user_id:         u.id,
      when_at:         r.when_at,
      where_at:        r.where_at,
      with_who:        r.with_who,
      drinks:          r.drinks,
      drink_type:      r.drink_type,
      mood_before:     r.mood_before,
      mood_after:      r.mood_after,
      behaviour:       r.behaviour,
      treatment:       r.treatment || null,
      conflict:        r.conflict || null,
      regretted_words: r.regretted_words || null,
      embarrassment:   r.embarrassment || null,
      sex:             r.sex,
      partner:         r.partner || null,
      memory:          r.memory,
      regret:          r.regret,
      notes:           r.notes || null,
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteReview(id) {
    if (!client) throw new Error("Supabase not configured.");
    const { error } = await client.from("reviews").delete().eq("id", id);
    if (error) throw error;
  }

  async function clearAllReviews() {
    if (!client) throw new Error("Supabase not configured.");
    const u = await getUser();
    if (!u) throw new Error("Not signed in.");
    const { error } = await client.from("reviews").delete().eq("user_id", u.id);
    if (error) throw error;
  }

  window.Auth = {
    client, ready,
    signUp, signIn, signOut, getUser, requireAuth, requireAnon,
    listReviews, addReview, deleteReview, clearAllReviews,
  };
})();
