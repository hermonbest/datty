import { initialBoard, getLegalMoves, makeMove, isGameOver, PieceColor } from '../src/features/games/chess/chessEngine';

describe('Chess Game Turn & Couple Constraints', () => {
  it('prevents selecting opponent pieces when turn is White', () => {
    const board = initialBoard();
    const turn: PieceColor = 'w';

    // Black piece at (1, 0)
    const blackPiece = board[1][0];
    expect(blackPiece?.color).toBe('b');

    // getLegalMoves for black piece when turn is white should return empty
    const legalMoves = getLegalMoves(board, 1, 0, turn);
    expect(legalMoves).toEqual([]);
  });

  it('allows White player to make move, switches turn to Black, and enables Black legal moves', () => {
    let board = initialBoard();
    let turn: PieceColor = 'w';

    // White e2 to e4
    const whiteMoves = getLegalMoves(board, 6, 4, turn);
    expect(whiteMoves).toContainEqual({ row: 4, col: 4 });

    const moveResult = makeMove(board, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    board = moveResult.board;
    turn = 'b';

    // Now turn is Black. White piece at (4, 4) cannot move
    const whiteMovesOnBlackTurn = getLegalMoves(board, 4, 4, turn);
    expect(whiteMovesOnBlackTurn).toEqual([]);

    // Black pawn at (1, 4) can move to e5 or e6
    const blackMoves = getLegalMoves(board, 1, 4, turn);
    expect(blackMoves).toContainEqual({ row: 3, col: 4 });
    expect(blackMoves).toContainEqual({ row: 2, col: 4 });
  });

  it('correctly reports board serialization and restoration for Firestore sync', () => {
    const originalBoard = initialBoard();
    const serialized = JSON.stringify(originalBoard);
    const restored = JSON.parse(serialized);

    expect(restored[0][4]).toEqual({ type: 'k', color: 'b' });
    expect(restored[7][4]).toEqual({ type: 'k', color: 'w' });
  });
});
