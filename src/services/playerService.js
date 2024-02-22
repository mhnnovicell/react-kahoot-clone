import { supabase } from './supabaseClient';

export const fetchPlayers = async () => {
  const { data, error } = await supabase.from('players').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data.map((player) => ({
    name: player.name,
    class: player.class,
  }));
};

export const insertPlayer = async (name, color) => {
  const { data, error } = await supabase
    .from('players')
    .insert({ name, class: color });
  if (error) {
    console.error(error);
  }
};

export const deletePlayer = async (name) => {
  const { data, error } = await supabase
    .from('players')
    .delete()
    .eq('name', name);
  if (error) {
    console.error(error);
  }
};
