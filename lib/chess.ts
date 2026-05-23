export type Color = 'white' | 'black';
export type PieceType =
  | 'pawn'
  | 'knight'
  | 'bishop'
  | 'rook'
  | 'queen'
  | 'king';
export type GameMode = 'computer' | 'pass-and-play';
export type StatusState = 'playing' | 'check' | 'checkmate' | 'stalemate';

export interface Piece {
  type: PieceType;
  color: Color;
}

export interface Square {
  row: number;
  col: number;
}

export interface Move {
  from: Square;
  to: Square;
  piece: Piece;
  captured?: Piece;
  promotion?: PieceType;
  requiresPromotion?: boolean;
  isCastle?: boolean;
  rookFrom?: Square;
  rookTo?: Square;
  isEnPassant?: boolean;
  isDoublePawnPush?: boolean;
}

interface SideCastlingRights {
  kingSide: boolean;
  queenSide: boolean;
}

export interface CastlingRights {
  white: SideCastlingRights;
  black: SideCastlingRights;
}

export interface GameStatus {
  state: StatusState;
  winner: Color | null;
  message: string;
}

export interface ChessGame {
  board: Board;
  currentPlayer: Color;
  castlingRights: CastlingRights;
  enPassantTarget: Square | null;
  capturedByWhite: Piece[];
  capturedByBlack: Piece[];
  lastMove: Move | null;
  status: GameStatus;
}

export type Board = (Piece | null)[][];

const pieceOrder: PieceType[] = [
  'rook',
  'knight',
  'bishop',
  'queen',
  'king',
  'bishop',
  'knight',
  'rook',
];

const pieceValues: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

const promotionPieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

const centerWeights = [
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 4, 4, 3, 2, 1],
  [1, 2, 3, 4, 4, 3, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
];

export function createInitialGame(): ChessGame {
  const game: ChessGame = {
    board: createInitialBoard(),
    currentPlayer: 'white',
    castlingRights: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    },
    enPassantTarget: null,
    capturedByWhite: [],
    capturedByBlack: [],
    lastMove: null,
    status: {
      state: 'playing',
      winner: null,
      message: 'White to move',
    },
  };

  return updateStatus(game);
}

export function getPieceGlyph(piece: Piece): string {
  const glyphs: Record<Color, Record<PieceType, string>> = {
    white: {
      king: '♔',
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘',
      pawn: '♙',
    },
    black: {
      king: '♚',
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞',
      pawn: '♟',
    },
  };

  return glyphs[piece.color][piece.type];
}

export function getPromotionPieces(): PieceType[] {
  return promotionPieces;
}

export function getAllLegalMoves(
  game: ChessGame,
  color: Color = game.currentPlayer,
): Move[] {
  const moves: Move[] = [];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = game.board[row][col];
      if (!piece || piece.color !== color) {
        continue;
      }

      const pseudoMoves = getPseudoMoves(game, { row, col }, piece);
      for (const move of pseudoMoves) {
        const simulated = executeMove(
          {
            ...game,
            currentPlayer: color,
          },
          move,
        );

        if (!isInCheck(simulated, color)) {
          moves.push(move);
        }
      }
    }
  }

  return moves;
}

export function getLegalMovesForSquare(
  game: ChessGame,
  square: Square,
): Move[] {
  const piece = game.board[square.row]?.[square.col];

  if (!piece || piece.color !== game.currentPlayer) {
    return [];
  }

  return getAllLegalMoves(game).filter(
    (move) =>
      move.from.row === square.row &&
      move.from.col === square.col,
  );
}

export function applyMove(game: ChessGame, move: Move): ChessGame {
  return updateStatus(executeMove(game, move));
}

export function chooseComputerMove(game: ChessGame): Move | null {
  const moves = getAllLegalMoves(game, game.currentPlayer);
  if (moves.length === 0) {
    return null;
  }

  const color = game.currentPlayer;
  const scoredMoves = moves.map((move) => {
    const next = applyMove(game, move);
    const score =
      evaluateBoard(next.board, color) +
      (next.status.state === 'checkmate' && next.status.winner === color
        ? 100000
        : 0) +
      (next.status.state === 'check' ? 40 : 0) +
      Math.random() * 12;

    return { move, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));

  return topMoves[Math.floor(Math.random() * topMoves.length)].move;
}

export function describeMove(move: Move): string {
  const destination = `${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`;
  const pieceName = move.piece.type === 'pawn' ? 'Pawn' : capitalize(move.piece.type);

  if (move.isCastle) {
    return move.to.col === 6 ? 'Castled king side' : 'Castled queen side';
  }

  if (move.promotion) {
    return `${pieceName} to ${destination}, promoted to ${capitalize(move.promotion)}`;
  }

  if (move.captured) {
    return `${pieceName} captured on ${destination}`;
  }

  return `${pieceName} to ${destination}`;
}

export function isInteractiveTurn(mode: GameMode, currentPlayer: Color): boolean {
  return mode === 'pass-and-play' || currentPlayer === 'white';
}

function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (let col = 0; col < 8; col += 1) {
    board[1][col] = { type: 'pawn', color: 'black' };
    board[6][col] = { type: 'pawn', color: 'white' };
    board[0][col] = { type: pieceOrder[col], color: 'black' };
    board[7][col] = { type: pieceOrder[col], color: 'white' };
  }

  return board;
}

function getPseudoMoves(game: ChessGame, from: Square, piece: Piece): Move[] {
  switch (piece.type) {
    case 'pawn':
      return getPawnMoves(game, from, piece);
    case 'knight':
      return getKnightMoves(game, from, piece);
    case 'bishop':
      return getSlidingMoves(game, from, piece, [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ]);
    case 'rook':
      return getSlidingMoves(game, from, piece, [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]);
    case 'queen':
      return getSlidingMoves(game, from, piece, [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]);
    case 'king':
      return getKingMoves(game, from, piece);
    default:
      return [];
  }
}

function getPawnMoves(game: ChessGame, from: Square, piece: Piece): Move[] {
  const moves: Move[] = [];
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;
  const promotionRow = piece.color === 'white' ? 0 : 7;
  const oneStep = from.row + direction;

  if (isInsideBoard(oneStep, from.col) && !game.board[oneStep][from.col]) {
    moves.push({
      from,
      to: { row: oneStep, col: from.col },
      piece,
      requiresPromotion: oneStep === promotionRow,
    });

    const twoStep = from.row + direction * 2;
    if (
      from.row === startRow &&
      isInsideBoard(twoStep, from.col) &&
      !game.board[twoStep][from.col]
    ) {
      moves.push({
        from,
        to: { row: twoStep, col: from.col },
        piece,
        isDoublePawnPush: true,
      });
    }
  }

  for (const deltaCol of [-1, 1]) {
    const targetRow = from.row + direction;
    const targetCol = from.col + deltaCol;
    if (!isInsideBoard(targetRow, targetCol)) {
      continue;
    }

    const targetPiece = game.board[targetRow][targetCol];
    if (targetPiece && targetPiece.color !== piece.color) {
      moves.push({
        from,
        to: { row: targetRow, col: targetCol },
        piece,
        captured: targetPiece,
        requiresPromotion: targetRow === promotionRow,
      });
    }

    if (
      game.enPassantTarget &&
      game.enPassantTarget.row === targetRow &&
      game.enPassantTarget.col === targetCol
    ) {
      const capturedPiece = game.board[from.row][targetCol];
      if (capturedPiece && capturedPiece.color !== piece.color) {
        moves.push({
          from,
          to: { row: targetRow, col: targetCol },
          piece,
          captured: capturedPiece,
          isEnPassant: true,
        });
      }
    }
  }

  return moves;
}

function getKnightMoves(game: ChessGame, from: Square, piece: Piece): Move[] {
  const deltas = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];

  return deltas.flatMap(([deltaRow, deltaCol]) =>
    buildStepMove(game, from, piece, from.row + deltaRow, from.col + deltaCol),
  );
}

function getSlidingMoves(
  game: ChessGame,
  from: Square,
  piece: Piece,
  directions: Array<[number, number]>,
): Move[] {
  const moves: Move[] = [];

  for (const [deltaRow, deltaCol] of directions) {
    let row = from.row + deltaRow;
    let col = from.col + deltaCol;

    while (isInsideBoard(row, col)) {
      const target = game.board[row][col];

      if (!target) {
        moves.push({
          from,
          to: { row, col },
          piece,
        });
      } else {
        if (target.color !== piece.color) {
          moves.push({
            from,
            to: { row, col },
            piece,
            captured: target,
          });
        }
        break;
      }

      row += deltaRow;
      col += deltaCol;
    }
  }

  return moves;
}

function getKingMoves(game: ChessGame, from: Square, piece: Piece): Move[] {
  const moves: Move[] = [];

  for (let deltaRow = -1; deltaRow <= 1; deltaRow += 1) {
    for (let deltaCol = -1; deltaCol <= 1; deltaCol += 1) {
      if (deltaRow === 0 && deltaCol === 0) {
        continue;
      }

      moves.push(
        ...buildStepMove(
          game,
          from,
          piece,
          from.row + deltaRow,
          from.col + deltaCol,
        ),
      );
    }
  }

  const homeRow = piece.color === 'white' ? 7 : 0;
  const rights = game.castlingRights[piece.color];

  if (
    from.row !== homeRow ||
    from.col !== 4 ||
    isInCheck(game, piece.color)
  ) {
    return moves;
  }

  if (
    rights.kingSide &&
    !game.board[homeRow][5] &&
    !game.board[homeRow][6] &&
    isRookReady(game.board, piece.color, homeRow, 7) &&
    !isSquareAttacked(game, { row: homeRow, col: 5 }, oppositeColor(piece.color)) &&
    !isSquareAttacked(game, { row: homeRow, col: 6 }, oppositeColor(piece.color))
  ) {
    moves.push({
      from,
      to: { row: homeRow, col: 6 },
      piece,
      isCastle: true,
      rookFrom: { row: homeRow, col: 7 },
      rookTo: { row: homeRow, col: 5 },
    });
  }

  if (
    rights.queenSide &&
    !game.board[homeRow][1] &&
    !game.board[homeRow][2] &&
    !game.board[homeRow][3] &&
    isRookReady(game.board, piece.color, homeRow, 0) &&
    !isSquareAttacked(game, { row: homeRow, col: 3 }, oppositeColor(piece.color)) &&
    !isSquareAttacked(game, { row: homeRow, col: 2 }, oppositeColor(piece.color))
  ) {
    moves.push({
      from,
      to: { row: homeRow, col: 2 },
      piece,
      isCastle: true,
      rookFrom: { row: homeRow, col: 0 },
      rookTo: { row: homeRow, col: 3 },
    });
  }

  return moves;
}

function buildStepMove(
  game: ChessGame,
  from: Square,
  piece: Piece,
  row: number,
  col: number,
): Move[] {
  if (!isInsideBoard(row, col)) {
    return [];
  }

  const target = game.board[row][col];
  if (target?.color === piece.color) {
    return [];
  }

  return [
    {
      from,
      to: { row, col },
      piece,
      captured: target ?? undefined,
    },
  ];
}

function executeMove(game: ChessGame, move: Move): ChessGame {
  const board = cloneBoard(game.board);
  const castlingRights = cloneCastlingRights(game.castlingRights);
  const movingPiece = board[move.from.row][move.from.col];

  if (!movingPiece) {
    return game;
  }

  let capturedPiece: Piece | undefined = move.captured;
  board[move.from.row][move.from.col] = null;

  if (move.isEnPassant) {
    const capturedRow = move.from.row;
    capturedPiece = board[capturedRow][move.to.col] ?? undefined;
    board[capturedRow][move.to.col] = null;
  }

  board[move.to.row][move.to.col] = movingPiece;

  if (move.isCastle && move.rookFrom && move.rookTo) {
    const rook = board[move.rookFrom.row][move.rookFrom.col];
    board[move.rookFrom.row][move.rookFrom.col] = null;
    board[move.rookTo.row][move.rookTo.col] = rook;
  }

  if (move.requiresPromotion || move.promotion) {
    board[move.to.row][move.to.col] = {
      type: move.promotion ?? 'queen',
      color: movingPiece.color,
    };
  }

  updateCastlingRights(castlingRights, movingPiece, move.from);
  if (capturedPiece) {
    updateCastlingRightsFromCapture(castlingRights, move.to, capturedPiece);
  }

  const nextGame: ChessGame = {
    board,
    currentPlayer: oppositeColor(game.currentPlayer),
    castlingRights,
    enPassantTarget: move.isDoublePawnPush
      ? {
          row: (move.from.row + move.to.row) / 2,
          col: move.from.col,
        }
      : null,
    capturedByWhite: [...game.capturedByWhite],
    capturedByBlack: [...game.capturedByBlack],
    lastMove: {
      ...move,
      promotion: move.promotion ?? (move.requiresPromotion ? 'queen' : undefined),
      captured: capturedPiece,
    },
    status: game.status,
  };

  if (capturedPiece) {
    if (movingPiece.color === 'white') {
      nextGame.capturedByWhite.push(capturedPiece);
    } else {
      nextGame.capturedByBlack.push(capturedPiece);
    }
  }

  return nextGame;
}

function updateStatus(game: ChessGame): ChessGame {
  const moves = getAllLegalMoves(game, game.currentPlayer);
  const inCheck = isInCheck(game, game.currentPlayer);
  let status: GameStatus;

  if (moves.length === 0) {
    if (inCheck) {
      status = {
        state: 'checkmate',
        winner: oppositeColor(game.currentPlayer),
        message: `${capitalize(oppositeColor(game.currentPlayer))} wins by checkmate`,
      };
    } else {
      status = {
        state: 'stalemate',
        winner: null,
        message: 'Draw by stalemate',
      };
    }
  } else if (inCheck) {
    status = {
      state: 'check',
      winner: null,
      message: `${capitalize(game.currentPlayer)} to move - check`,
    };
  } else {
    status = {
      state: 'playing',
      winner: null,
      message: `${capitalize(game.currentPlayer)} to move`,
    };
  }

  return {
    ...game,
    status,
  };
}

function updateCastlingRights(
  rights: CastlingRights,
  piece: Piece,
  from: Square,
): void {
  if (piece.type === 'king') {
    rights[piece.color].kingSide = false;
    rights[piece.color].queenSide = false;
    return;
  }

  if (piece.type !== 'rook') {
    return;
  }

  if (piece.color === 'white' && from.row === 7) {
    if (from.col === 0) {
      rights.white.queenSide = false;
    }
    if (from.col === 7) {
      rights.white.kingSide = false;
    }
  }

  if (piece.color === 'black' && from.row === 0) {
    if (from.col === 0) {
      rights.black.queenSide = false;
    }
    if (from.col === 7) {
      rights.black.kingSide = false;
    }
  }
}

function updateCastlingRightsFromCapture(
  rights: CastlingRights,
  square: Square,
  piece: Piece,
): void {
  if (piece.type !== 'rook') {
    return;
  }

  if (piece.color === 'white' && square.row === 7) {
    if (square.col === 0) {
      rights.white.queenSide = false;
    }
    if (square.col === 7) {
      rights.white.kingSide = false;
    }
  }

  if (piece.color === 'black' && square.row === 0) {
    if (square.col === 0) {
      rights.black.queenSide = false;
    }
    if (square.col === 7) {
      rights.black.kingSide = false;
    }
  }
}

function isInCheck(game: ChessGame, color: Color): boolean {
  const kingSquare = findKing(game.board, color);
  return kingSquare
    ? isSquareAttacked(game, kingSquare, oppositeColor(color))
    : false;
}

function isSquareAttacked(
  game: ChessGame,
  square: Square,
  byColor: Color,
): boolean {
  const pawnDirection = byColor === 'white' ? -1 : 1;
  for (const deltaCol of [-1, 1]) {
    const row = square.row - pawnDirection;
    const col = square.col + deltaCol;
    if (
      isInsideBoard(row, col) &&
      game.board[row][col]?.color === byColor &&
      game.board[row][col]?.type === 'pawn'
    ) {
      return true;
    }
  }

  const knightSteps = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
  for (const [deltaRow, deltaCol] of knightSteps) {
    const row = square.row + deltaRow;
    const col = square.col + deltaCol;
    if (
      isInsideBoard(row, col) &&
      game.board[row][col]?.color === byColor &&
      game.board[row][col]?.type === 'knight'
    ) {
      return true;
    }
  }

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  for (const [deltaRow, deltaCol] of directions) {
    let row = square.row + deltaRow;
    let col = square.col + deltaCol;
    let distance = 1;

    while (isInsideBoard(row, col)) {
      const piece = game.board[row][col];
      if (!piece) {
        row += deltaRow;
        col += deltaCol;
        distance += 1;
        continue;
      }

      if (piece.color !== byColor) {
        break;
      }

      if (distance === 1 && piece.type === 'king') {
        return true;
      }

      const isDiagonal = deltaRow !== 0 && deltaCol !== 0;
      if (
        piece.type === 'queen' ||
        (isDiagonal && piece.type === 'bishop') ||
        (!isDiagonal && piece.type === 'rook')
      ) {
        return true;
      }

      break;
    }
  }

  return false;
}

function findKing(board: Board, color: Color): Square | null {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (piece?.color === color && piece.type === 'king') {
        return { row, col };
      }
    }
  }

  return null;
}

function evaluateBoard(board: Board, perspective: Color): number {
  let score = 0;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece) {
        continue;
      }

      const positionalScore = centerWeights[row][col] * 6;
      const pawnAdvance =
        piece.type === 'pawn'
          ? (piece.color === 'white' ? 6 - row : row - 1) * 8
          : 0;
      const value = pieceValues[piece.type] + positionalScore + pawnAdvance;

      score += piece.color === perspective ? value : -value;
    }
  }

  return score;
}

function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((piece) => (piece ? { ...piece } : null)),
  );
}

function cloneCastlingRights(rights: CastlingRights): CastlingRights {
  return {
    white: { ...rights.white },
    black: { ...rights.black },
  };
}

function isRookReady(
  board: Board,
  color: Color,
  row: number,
  col: number,
): boolean {
  const piece = board[row][col];
  return Boolean(piece && piece.color === color && piece.type === 'rook');
}

function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function oppositeColor(color: Color): Color {
  return color === 'white' ? 'black' : 'white';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
