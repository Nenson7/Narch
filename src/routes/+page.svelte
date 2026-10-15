<script lang="ts">
  let notes: string[] = $state([]);
  let text = $state("");

  const addNote = () => {
    if (text.trim() === "") {
      return;
    }
    notes.push(text);
    text = "";
  };
</script>

<main>
  <div style="display:flex; justify-content: space-between;">
    <h1>NARCH NOTES</h1>
    <button onclick={addNote}>Append</button>
  </div>

  <input
    type="text"
    bind:value={text}
    style="margin-bottom: 20px; border-bottom: 2px solid var(--yellow);"
  />

  {#if notes.length === 0}
    <h3 class="note-heading">There is no available Note. :-(</h3>
  {:else}
    {#each notes as note}
      <h3 class="note-heading">{note}</h3>
    {/each}
  {/if}
</main>
