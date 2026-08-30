export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type ChessCell = ChessPiece | null;
export type ChessBoard = ChessCell[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
}

export function initialBoard(): ChessBoard {
  const board: ChessBoard = Array(8).fill(null).map(() => Array(8).fill(null));

  // Black pieces (row 0 & 1)
  const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRank[c], color: 'b' };
    board[1][c] = { type: 'p', color: 'b' };
  }

  // White pieces (row 6 & 7)
  for (let c = 0; c < 8; c++) {
    board[6][c] = { type: 'p', color: 'w' };
    board[7][c] = { type: backRank[c], color: 'w' };
  }

  return board;
}

export function isInside(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function getRawMoves(board: ChessBoard, row: number, col: number): Position[] {
  const piece = board[row][col];
  if (!piece) return [];
  const moves: Position[] = [];
  const { type, color } = piece;
  const forward = color === 'w' ? -1 : 1;
  const startRow = color === 'w' ? 6 : 1;

  if (type === 'p') {
    // 1 step forward
    if (isInside(row + forward, col) && !board[row + forward][col]) {
      moves.push({ row: row + forward, col });
      // 2 steps from start
      if (row === startRow && isInside(row + 2 * forward, col) && !board[row + 2 * forward][col]) {
        moves.push({ row: row + 2 * forward, col });
      }
    }
    // Captures
    for (const dc of [-1, 1]) {
      const nr = row + forward;
      const nc = col + dc;
      if (isInside(nr, nc) && board[nr][nc] && board[nr][nc]?.color !== color) {
        moves.push({ row: nr, col: nc });
      }
    }
  } else if (type === 'n') {
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (isInside(nr, nc)) {
        if (!board[nr][nc] || board[nr][nc]?.color !== color) {
          moves.push({ row: nr, col: nc });
        }
      }
    }
  } else if (type === 'b' || type === 'r' || type === 'q') {
    const directions: number[][] = [];
    if (type === 'r' || type === 'q') {
      directions.push([0, 1], [0, -1], [1, 0], [-1, 0]);
    }
    if (type === 'b' || type === 'q') {
      directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    }
    for (const [dr, dc] of directions) {
      let step = 1;
      while (true) {
        const nr = row + dr * step;
        const nc = col + dc * step;
        if (!isInside(nr, nc)) break;
        const target = board[nr][nc];
        if (!target) {
          moves.push({ row: nr, col: nc });
        } else {
          if (target.color !== color) {
            moves.push({ row: nr, col: nc });
          }
          break;
        }
        step++;
      }
    }
  } else if (type === 'k') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (isInside(nr, nc)) {
          if (!board[nr][nc] || board[nr][nc]?.color !== color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
    }
  }

  return moves;
}

export function isKingInCheck(board: ChessBoard, color: PieceColor): boolean {
  let kingPos: Position | null = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.type === 'k' && board[r][c]?.color === color) {
        kingPos = { row: r, col: c };
        break;
      }
    }
  }
  if (!kingPos) return false;

  const opponentColor: PieceColor = color === 'w' ? 'b' : 'w';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === opponentColor) {
        const moves = getRawMoves(board, r, c);
        if (moves.some((m) => m.row === kingPos!.row && m.col === kingPos!.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function getLegalMoves(board: ChessBoard, row: number, col: number, turn: PieceColor): Position[] {
  const piece = board[row][col];
  if (!piece || piece.color !== turn) return [];

  const rawMoves = getRawMoves(board, row, col);
  return rawMoves.filter((m) => {
    const newBoard = board.map((r) => [...r]);
    newBoard[m.row][m.col] = newBoard[row][col];
    newBoard[row][col] = null;
    return !isKingInCheck(newBoard, turn);
  });
}

export function makeMove(board: ChessBoard, move: Move): { board: ChessBoard; capturedPiece: ChessPiece | null } {
  const newBoard = board.map((r) => [...r]);
  const capturedPiece = newBoard[move.to.row][move.to.col];
  const movingPiece = newBoard[move.from.row][move.from.col];

  if (!movingPiece) return { board, capturedPiece: null };

  if (movingPiece.type === 'p' && (move.to.row === 0 || move.to.row === 7)) {
    newBoard[move.to.row][move.to.col] = { type: 'q', color: movingPiece.color };
  } else {
    newBoard[move.to.row][move.to.col] = movingPiece;
  }
  newBoard[move.from.row][move.from.col] = null;

  return { board: newBoard, capturedPiece };
}

export function isGameOver(board: ChessBoard, turn: PieceColor): { over: boolean; winner: PieceColor | 'draw' | null } {
  let hasLegalMove = false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === turn) {
        if (getLegalMoves(board, r, c, turn).length > 0) {
          hasLegalMove = true;
          break;
        }
      }
    }
    if (hasLegalMove) break;
  }

  if (!hasLegalMove) {
    if (isKingInCheck(board, turn)) {
      return { over: true, winner: turn === 'w' ? 'b' : 'w' };
    }
    return { over: true, winner: 'draw' };
  }

  return { over: false, winner: null };
}
