export interface NoteItem {
  id: string;
  type: 'text' | 'code' | 'image';
  title: string;
  content: string;
  createdAt: number;
}

const STORAGE_KEY = 'gruber_feed_v1';

export const db = {
  async getItems(): Promise<NoteItem[]> {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async saveItem(item: Omit<NoteItem, 'id' | 'createdAt'>): Promise<NoteItem> {
    // TODO: Replace this block with Supabase client call later:
    // const { data, error } = await supabase.from('notes').insert([item]).select().single();

    const items = await this.getItems();
    const newItem: NoteItem = {
      ...item,
      id: Math.random().toString(36.25).substring(2, 9),
      createdAt: Date.now(),
    };
    items.unshift(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return newItem;
  },

  async deleteItem(id: string): Promise<void> {
    // TODO: Replace with Supabase delete call later:
    // await supabase.from('notes').delete().eq('id', id);

    let items = await this.getItems();
    items = items.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
};
