import {
  initialBoard,
  getLegalMoves,
  makeMove,
  isKingInCheck,
  ChessBoard,
  isGameOver
} from '../src/features/games/chess/chessEngine';

describe('Chess Engine for Couples', () => {
  it('initializes standard 8x8 chessboard with pieces in proper spots', () => {
    const board = initialBoard();
    expect(board.length).toBe(8);
    expect(board[0].length).toBe(8);
    // Row 0 is black back rank
    expect(board[0][0]).toEqual({ type: 'r', color: 'b' });
    expect(board[0][4]).toEqual({ type: 'k', color: 'b' });
    // Row 7 is white back rank
    expect(board[7][4]).toEqual({ type: 'k', color: 'w' });
    // Row 6 is white pawns
    expect(board[6][0]).toEqual({ type: 'p', color: 'w' });
  });

  it('calculates initial white pawn opening moves (1 or 2 steps forward)', () => {
    const board = initialBoard();
    const e2Moves = getLegalMoves(board, 6, 4, 'w');
    expect(e2Moves).toContainEqual({ row: 5, col: 4 });
    expect(e2Moves).toContainEqual({ row: 4, col: 4 });
    expect(e2Moves.length).toBe(2);
  });

  it('calculates knight legal jump moves over pawns', () => {
    const board = initialBoard();
    const knightMoves = getLegalMoves(board, 7, 1, 'w');
    expect(knightMoves).toContainEqual({ row: 5, col: 0 });
    expect(knightMoves).toContainEqual({ row: 5, col: 2 });
    expect(knightMoves.length).toBe(2);
  });

  it('correctly executes a move and updates board state', () => {
    const board = initialBoard();
    const nextState = makeMove(board, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    expect(nextState.board[6][4]).toBeNull();
    expect(nextState.board[4][4]).toEqual({ type: 'p', color: 'w' });
  });

  it('detects check on king', () => {
    const emptyBoard: ChessBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    emptyBoard[0][4] = { type: 'k', color: 'b' };
    emptyBoard[7][4] = { type: 'r', color: 'w' };
    expect(isKingInCheck(emptyBoard, 'b')).toBe(true);
    expect(isKingInCheck(emptyBoard, 'w')).toBe(false);
  });

  it('detects game over when checkmate occurs', () => {
    // Scholar's mate test
    // 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#
    let board = initialBoard();
    board = makeMove(board, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }).board; // e4
    board = makeMove(board, { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }).board; // e5
    board = makeMove(board, { from: { row: 7, col: 3 }, to: { row: 3, col: 7 } }).board; // Qh5
    board = makeMove(board, { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }).board; // Nc6
    board = makeMove(board, { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }).board; // Bc4
    board = makeMove(board, { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }).board; // Nf6
    board = makeMove(board, { from: { row: 3, col: 7 }, to: { row: 1, col: 5 } }).board; // Qxf7#

    const status = isGameOver(board, 'b');
    expect(status.over).toBe(true);
    expect(status.winner).toBe('w');
  });
});
