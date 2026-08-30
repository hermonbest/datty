export type TicTacToeCell = 'X' | 'O' | null;

export interface TicTacToeResult {
  winner: 'X' | 'O' | null;
  winningLine: number[] | null;
  isDraw: boolean;
}

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function checkTicTacToeWinner(board: TicTacToeCell[]): TicTacToeResult {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: combo, isDraw: false };
    }
  }

  const isFull = board.every((cell) => cell !== null);
  return { winner: null, winningLine: null, isDraw: isFull };
}

export const TIC_TAC_TOE_DARES: string[] = [
  'Loser owes the winner a 3-minute foot or head massage!',
  'Loser has to make the winner a hot beverage or favorite snack right now!',
  'Loser must post a sweet love note in Couple Moments or Chat!',
  'Loser gives the winner 10 sweet kisses on their cheeks & nose!',
  'Loser must whisper their favorite thing about the winner into their ear!',
  'Loser has to do 10 squats while saying "I love you" each rep!'
];
