import { checkTicTacToeWinner } from '../src/features/games/tictactoe/ticTacToeLogic';
import { TRIVIA_PACKS } from '../src/features/games/trivia/triviaData';

describe('Trivia & TicTacToe Engines', () => {
  it('has comprehensive relationship trivia packs with questions', () => {
    expect(TRIVIA_PACKS.length).toBeGreaterThanOrEqual(2);
    expect(TRIVIA_PACKS[0].questions.length).toBeGreaterThanOrEqual(6);
  });

  it('detects 3-in-a-row winner for TicTacToe', () => {
    const board: ('X' | 'O' | null)[] = [
      'X', 'X', 'X',
      null, 'O', null,
      'O', null, null
    ];
    const res = checkTicTacToeWinner(board);
    expect(res.winner).toBe('X');
    expect(res.winningLine).toEqual([0, 1, 2]);
  });

  it('detects diagonal win and draw', () => {
    const diagBoard: ('X' | 'O' | null)[] = [
      'O', null, null,
      null, 'O', null,
      null, null, 'O'
    ];
    expect(checkTicTacToeWinner(diagBoard).winner).toBe('O');

    const drawBoard: ('X' | 'O' | null)[] = [
      'X', 'O', 'X',
      'X', 'O', 'O',
      'O', 'X', 'X'
    ];
    expect(checkTicTacToeWinner(drawBoard).isDraw).toBe(true);
  });
});
