<script lang="ts">
  import { onMount } from 'svelte';
  import { db, dayKey, type NoteItem, type NoteType } from '#lib/db.ts';

  type Kind = 'auto' | 'text' | 'code';

  let items = $state<NoteItem[]>([]);
  let title = $state('');
  let content = $state('');
  let kind = $state<Kind>('auto');
  let today = $state(dayKey());
  let picked = $state<string | null>(null); // null = follow today
  let copied = $state<string | null>(null);
  let broken = $state<Record<string, boolean>>({});
  let input: HTMLTextAreaElement;

  const current = $derived(picked ?? today);
  const isToday = $derived(current === today);
  const days = $derived(
    [...new Set([today, ...items.map((i) => dayKey(i.createdAt))])].sort().reverse()
  );
  const visible = $derived(items.filter((i) => dayKey(i.createdAt) === current));

  const URL_RE = /^https?:\/\/\S+$/i;
  const IMG_RE = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i;

  function detect(text: string): NoteType {
    const t = text.trim();
    if (URL_RE.test(t)) return IMG_RE.test(t) ? 'image' : 'link';
    return 'text';
  }

  function dayLabel(key: string) {
    if (key === today) return 'today';
    return new Date(key + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  function time(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  async function save() {
    if (!content.trim()) return;
    const type: NoteType = kind === 'code' ? 'code' : kind === 'text' ? 'text' : detect(content);
    const body = type === 'code' ? content.replace(/\s+$/, '') : content.trim();

    const saved = await db.saveItem({ title: title.trim(), type, content: body });
    items = [saved, ...items];
    title = '';
    content = '';
    picked = null;
    input?.focus();
  }

  async function remove(id: string) {
    await db.deleteItem(id);
    items = items.filter((i) => i.id !== id);
  }

  async function copy(item: NoteItem) {
    await navigator.clipboard.writeText(item.content);
    copied = item.id;
    setTimeout(() => (copied = null), 1000);
  }

  function onKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      save();
      return;
    }
    if (e.key === 'Tab' && kind === 'code') {
      e.preventDefault();
      const el = e.currentTarget as HTMLTextAreaElement;
      const s = el.selectionStart;
      content = content.slice(0, s) + '  ' + content.slice(el.selectionEnd);
      queueMicrotask(() => (el.selectionStart = el.selectionEnd = s + 2));
    }
  }

  onMount(() => {
    db.getItems().then((r) => (items = r));
    input?.focus();

    // new day => fresh page automatically
    const tick = () => {
      const t = dayKey();
      if (t !== today) today = t;
    };
    const id = setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  });
</script>

<main class="wrap">
  <header>
    <h1>// notes</h1>
    <span class="muted">{current} · {visible.length}</span>
  </header>

  <nav class="days">
    {#each days as d (d)}
      <button class="day" class:on={d === current} onclick={() => (picked = d === today ? null : d)}>
        {dayLabel(d)}
      </button>
    {/each}
  </nav>

  {#if isToday}
    <form class="card" onsubmit={(e) => { e.preventDefault(); save(); }}>
      <textarea
        bind:this={input}
        bind:value={content}
        onkeydown={onKey}
        class:mono-code={kind === 'code'}
        placeholder={kind === 'code' ? '// code…' : 'text, code, link, image url…  (ctrl+enter)'}
        rows="2"
        spellcheck={kind !== 'code'}
      ></textarea>
      <div class="row">
        <input type="text" placeholder="title (optional)" bind:value={title} />
        {#each ['auto', 'text', 'code'] as k (k)}
          <button type="button" class="chip" class:on={kind === k} onclick={() => (kind = k as Kind)}>
            {k}
          </button>
        {/each}
        <button type="submit" class="save">save</button>
      </div>
    </form>
  {/if}

  <div class="list">
    {#each visible as item (item.id)}
      <article class="card">
        <div class="head">
          <span class="title">{item.title}</span>
          <span class="muted">{time(item.createdAt)}</span>
          <span class="badge {item.type}">{item.type}</span>
          {#if item.type === 'code' || item.type === 'text'}
            <button class="mini" onclick={() => copy(item)}>{copied === item.id ? 'ok' : 'cp'}</button>
          {/if}
          <button class="mini del" onclick={() => remove(item.id)}>×</button>
        </div>

        {#if item.type === 'code'}
          <pre><code>{item.content}</code></pre>
        {:else if item.type === 'image'}
          {#if broken[item.id]}
            <a href={item.content} target="_blank" rel="noopener noreferrer">{item.content}</a>
          {:else}
            <img
              src={item.content}
              alt={item.title}
              loading="lazy"
              onerror={() => (broken[item.id] = true)}
            />
          {/if}
        {:else if item.type === 'link'}
          <a href={item.content} target="_blank" rel="noopener noreferrer">{item.content}</a>
        {:else}
          <p class="text">{item.content}</p>
        {/if}
      </article>
    {:else}
      <p class="empty">{isToday ? 'fresh page. dump stuff.' : 'nothing here.'}</p>
    {/each}
  </div>
</main>

<style>
  .wrap {
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  h1 {
    font-size: 1rem;
    color: var(--yellow);
  }

  .muted {
    color: var(--fg-muted);
    font-size: 0.8rem;
  }

  .days {
    display: flex;
    gap: 0.3rem;
    overflow-x: auto;
    padding-bottom: 0.15rem;
    scrollbar-width: none;
  }

  .day {
    flex: none;
    padding: 0.15rem 0.7rem;
    font-size: 0.78rem;
    color: var(--fg-muted);
  }
  .day.on {
    background: var(--yellow);
    border-color: var(--yellow);
    color: var(--bg);
  }

  .card {
    background: var(--bg-1);
    border: 1px solid var(--bg-2);
    border-radius: 12px;
    padding: 0.5rem;
  }

  form.card {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  textarea {
    field-sizing: content;
    min-height: 3.2rem;
    max-height: 45vh;
    resize: none;
    background: var(--bg);
  }
  textarea.mono-code {
    color: var(--green);
    white-space: pre;
    overflow-x: auto;
  }

  .row {
    display: flex;
    gap: 0.3rem;
  }
  .row input {
    flex: 1;
    min-width: 0;
    background: var(--bg);
  }

  .chip {
    padding: 0.2rem 0.65rem;
    font-size: 0.78rem;
    color: var(--fg-muted);
  }
  .chip.on {
    background: var(--niagara-2);
    border-color: var(--niagara);
    color: var(--niagara);
  }

  .save {
    background: var(--yellow);
    border-color: var(--yellow);
    color: var(--bg);
    font-weight: 700;
  }
  .save:hover {
    background: var(--wisteria);
    border-color: var(--wisteria);
    color: var(--bg);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.3rem;
  }
  .title {
    flex: 1;
    color: var(--wisteria);
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badge {
    font-size: 0.75rem;
  }
  .badge.text { color: var(--niagara); }
  .badge.code { color: var(--green); }
  .badge.image { color: var(--quartz); }
  .badge.link { color: var(--yellow); }

  .mini {
    padding: 0 0.55rem;
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--fg-muted);
  }
  .del:hover {
    background: var(--red);
    border-color: var(--red);
    color: var(--bg);
  }

  .text {
    white-space: pre-wrap;
    word-break: break-word;
  }

  img {
    max-width: 100%;
    display: block;
    border-radius: 8px;
  }

  .empty {
    color: var(--fg-muted);
    text-align: center;
    padding: 1rem 0;
  }
</style>
