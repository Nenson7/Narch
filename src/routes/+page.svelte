<script>
  import { onMount } from 'svelte';
  import { db, type NoteItem } from '#lib/db.ts';

  let items = $state<NoteItem[]>([]);
  let title = $state('');
  let type = $state<'text' | 'code' | 'image'>('text');
  let content = $state('');

  onMount(async () => {
    items = await db.getItems();
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    const saved = await db.saveItem({
      title: title.trim() || 'Untitled',
      type,
      content
    });

    items = [saved, ...items];
    title = '';
    content = '';
  }

  async function handleDelete(id: string) {
    await db.deleteItem(id);
    items = items.filter(i => i.id !== id);
  }
</script>

<main style="max-width: 700px; margin: 0 auto; padding-top: 1rem;">
  <h1 style="margin-bottom: 1rem;">// FEED & NOTES</h1>

  <!-- Input Form -->
  <form onsubmit={handleSubmit} class="card" style="margin-bottom: 1.5rem;">
    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
      <input type="text" placeholder="Title..." bind:value={title} style="flex: 1;" />
      <select bind:value={type}>
        <option value="text">Text</option>
        <option value="code">Code</option>
        <option value="image">Image URL</option>
      </select>
    </div>

    <textarea
      placeholder={type === 'code' ? '// Paste code snippet...' : type === 'image' ? 'https://image-url.com/img.png' : 'Write note...'}
      bind:value={content}
      rows={type === 'code' ? 5 : 3}
      style="width: 100%; margin-bottom: 0.5rem; resize: vertical;"
    ></textarea>

    <button type="submit" style="width: 100%;">SAVE</button>
  </form>

  <!-- Feed List -->
  <div style="display: flex; flex-direction: column; gap: 1rem;">
    {#each items as item (item.id)}
      <article class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="color: var(--accent); font-weight: bold;">{item.title}</span>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <span style="font-size: 0.8rem; color: var(--fg-muted);">[{item.type}]</span>
            <button onclick={() => handleDelete(item.id)} style="padding: 0 0.3rem; font-size: 0.8rem; color: var(--red); border-color: var(--red);">X</button>
          </div>
        </div>

        {#if item.type === 'code'}
          <pre><code>{item.content}</code></pre>
        {:else if item.type === 'image'}
          <div style="border: 1px solid var(--border); background: var(--bg); padding: 0.25rem;">
            <img src={item.content} alt={item.title} style="max-width: 100%; display: block;" onerror={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        {:else}
          <p style="white-space: pre-wrap; word-break: break-word;">{item.content}</p>
        {/if}
      </article>
    {:else}
      <p style="color: var(--fg-muted); text-align: center;">No items yet.</p>
    {/each}
  </div>
</main>
