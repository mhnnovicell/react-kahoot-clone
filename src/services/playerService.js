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
    isReady: player.isReady,
    id: player.id,
    points: player.points,
    createdAt: player.created_at,
    hasBeenAdded: player.hasBeenAdded,
    previousPoints: player.previousPoints,
    addedPoints: player.addedPoints,
    onScoreboard: player.onScoreboard,
    currentQuestionId: player.currentQuestionId,
  }));
};

export const insertPlayer = async (name, color) => {
  const { data, error } = await supabase
    .from('players')
    .insert({
      name,
      class: color,
      isReady: true,
      points: 0,
      hasBeenAdded: true,
    })
    .select();

  if (error) {
    console.error(error);
    return null;
  } else {
    console.log(data, 'data');
    // Store the current player ID in localStorage (persists better than sessionStorage)
    localStorage.setItem('currentPlayerId', data[0].id);
    return data[0];
  }
};

export const deletePlayer = async (name) => {
  const { data, error } = await supabase
    .from('players')
    .delete()
    .eq('name', name);

  if (error) {
    console.error(error);
    return false;
  }

  // Check if we're deleting the current player
  const currentPlayerId = localStorage.getItem('currentPlayerId');
  if (currentPlayerId) {
    const { data: playerData } = await supabase
      .from('players')
      .select('name')
      .eq('id', currentPlayerId)
      .single();

    if (playerData && playerData.name === name) {
      localStorage.removeItem('currentPlayerId');
    }
  }

  return true;
};

export const getCurrentPlayer = async () => {
  const currentPlayerId = localStorage.getItem('currentPlayerId');
  if (!currentPlayerId) return null;

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', currentPlayerId)
    .single();

  if (error) {
    console.error('Error fetching current player:', error);
    return null;
  }

  return data;
};

export const updatePlayerScore = async (playerId, points, previousPoints) => {
  const { data, error } = await supabase
    .from('players')
    .update({
      points: points,
      previousPoints: previousPoints,
      addedPoints: points - previousPoints,
    })
    .eq('id', playerId)
    .select();

  if (error) {
    console.error('Error updating player score:', error);
    return null;
  }

  return data[0];
};

export const updatePlayerScoreboardStatus = async (
  playerId,
  onScoreboard,
  currentQuestionId,
) => {
  const { data, error } = await supabase
    .from('players')
    .update({
      onScoreboard: onScoreboard,
      currentQuestionId: currentQuestionId,
    })
    .eq('id', playerId)
    .select();

  if (error) {
    console.error('Error updating player scoreboard status:', error);
    return null;
  }

  return data[0];
};
