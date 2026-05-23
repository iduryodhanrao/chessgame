'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CircleX,
  Pause,
  Play,
  RefreshCcw,
  Swords,
  Users,
} from 'lucide-react';
import {
  applyMove,
  chooseComputerMove,
  createInitialGame,
  describeMove,
  type GameMode,
  getLegalMovesForSquare,
  getPieceGlyph,
  getPromotionPieces,
  isInteractiveTurn,
  type Move,
  type Piece,
  type Square,
} from '@/lib/chess';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const terminalStates = new Set(['checkmate', 'stalemate']);

export function ChessApp() {
  const [mode, setMode] = useState<GameMode>('computer');
  const [game, setGame] = useState(createInitialGame);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [candidateMoves, setCandidateMoves] = useState<Move[]>([]);
  const [pendingPromotionMove, setPendingPromotionMove] = useState<Move | null>(
    null,
  );
  const [showModePrompt, setShowModePrompt] = useState(true);
  const [showPausePrompt, setShowPausePrompt] = useState(false);
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);

  const isTerminal = terminalStates.has(game.status.state);
  const isThinking =
    mode === 'computer' &&
    game.currentPlayer === 'black' &&
    !pendingPromotionMove &&
    !showModePrompt &&
    !showPausePrompt &&
    !showRestartPrompt &&
    !isTerminal;
  const playerCanMove =
    !showModePrompt &&
    !showPausePrompt &&
    !showRestartPrompt &&
    !pendingPromotionMove &&
    !isThinking &&
    !isTerminal &&
    isInteractiveTurn(mode, game.currentPlayer);

  const selectedMoveTargets = useMemo(
    () =>
      new Set(candidateMoves.map((move) => `${move.to.row}-${move.to.col}`)),
    [candidateMoves],
  );

  useEffect(() => {
    if (!isThinking) {
      return;
    }

    const timer = window.setTimeout(() => {
      const move = chooseComputerMove(game);
      if (move) {
        setGame(applyMove(game, move));
      }
      setSelectedSquare(null);
      setCandidateMoves([]);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [game, isThinking]);

  function resetInteractionState() {
    setSelectedSquare(null);
    setCandidateMoves([]);
    setPendingPromotionMove(null);
  }

  function startNewGame(nextMode: GameMode) {
    setMode(nextMode);
    setGame(createInitialGame());
    setShowModePrompt(false);
    setShowPausePrompt(false);
    setShowRestartPrompt(false);
    resetInteractionState();
  }

  function closeGame() {
    setGame(createInitialGame());
    setShowModePrompt(true);
    setShowPausePrompt(false);
    setShowRestartPrompt(false);
    resetInteractionState();
  }

  function commitMove(move: Move) {
    const nextGame = applyMove(game, move);
    setGame(nextGame);
    setSelectedSquare(null);
    setCandidateMoves([]);
    setPendingPromotionMove(null);
  }

  function handleSquarePress(square: Square) {
    if (!playerCanMove) {
      return;
    }

    const chosenMove = candidateMoves.find(
      (move) => move.to.row === square.row && move.to.col === square.col,
    );

    if (chosenMove) {
      if (chosenMove.requiresPromotion) {
        setPendingPromotionMove(chosenMove);
      } else {
        commitMove(chosenMove);
      }
      return;
    }

    const piece = game.board[square.row][square.col];
    if (!piece || piece.color !== game.currentPlayer) {
      setSelectedSquare(null);
      setCandidateMoves([]);
      return;
    }

    setSelectedSquare(square);
    setCandidateMoves(getLegalMovesForSquare(game, square));
  }

  function handlePromotionChoice(pieceType: Piece['type']) {
    if (!pendingPromotionMove) {
      return;
    }

    commitMove({
      ...pendingPromotionMove,
      promotion: pieceType,
      requiresPromotion: false,
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 text-slate-50">
      <div className="w-full max-w-md">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-3 shadow-[0_20px_80px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="grid grid-cols-8 overflow-hidden rounded-[1.5rem] border border-white/10">
            {game.board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isSelected =
                  selectedSquare?.row === rowIndex &&
                  selectedSquare?.col === colIndex;
                const isMoveTarget = selectedMoveTargets.has(
                  `${rowIndex}-${colIndex}`,
                );
                const targetMove = candidateMoves.find(
                  (move) =>
                    move.to.row === rowIndex && move.to.col === colIndex,
                );
                const isCaptureTarget = Boolean(
                  targetMove?.captured || targetMove?.isEnPassant,
                );

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    aria-label={`${files[colIndex]}${8 - rowIndex}`}
                    onClick={() =>
                      handleSquarePress({ row: rowIndex, col: colIndex })
                    }
                    className={[
                      'relative aspect-square flex items-center justify-center text-[clamp(1.7rem,8vw,2.35rem)] transition-all duration-150',
                      isLight ? 'bg-[#f4e2c2] text-slate-900' : 'bg-[#8f5e3b] text-white',
                      isSelected ? 'ring-4 ring-sky-400/80 ring-inset' : '',
                      playerCanMove ? 'active:scale-[0.98]' : '',
                    ].join(' ')}
                  >
                    {rowIndex === 7 ? (
                      <span className="pointer-events-none absolute bottom-1 right-1 text-[10px] font-semibold uppercase tracking-wide text-black/50">
                        {files[colIndex]}
                      </span>
                    ) : null}
                    {colIndex === 0 ? (
                      <span className="pointer-events-none absolute left-1 top-1 text-[10px] font-semibold text-black/45">
                        {8 - rowIndex}
                      </span>
                    ) : null}

                    {isMoveTarget ? (
                      isCaptureTarget ? (
                        <span className="absolute inset-1 rounded-full border-4 border-rose-400/90" />
                      ) : (
                        <span className="absolute h-3.5 w-3.5 rounded-full bg-emerald-400/90 shadow-[0_0_14px_rgba(74,222,128,0.9)]" />
                      )
                    ) : null}

                    {piece ? (
                      <span className="relative drop-shadow-[0_6px_10px_rgba(15,23,42,0.45)]">
                        {getPieceGlyph(piece)}
                      </span>
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowModePrompt(true)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              Choose mode
            </button>
            <button
              type="button"
              onClick={() => setShowPausePrompt(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
            <button
              type="button"
              onClick={() => setShowRestartPrompt(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Restart
            </button>
            <button
              type="button"
              onClick={closeGame}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              <CircleX className="h-4 w-4" />
              Close
            </button>
          </div>
        </section>
      </div>

      {showModePrompt ? (
        <OverlayCard>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-emerald-400/10 p-3">
              <Swords className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Start prompt
              </p>
              <h2 className="text-xl font-semibold text-white">
                Choose how you want to play
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => startNewGame('computer')}
              className="rounded-3xl border border-emerald-300/20 bg-gradient-to-r from-emerald-400/15 to-cyan-400/10 p-4 text-left"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-base font-semibold text-white">
                    <Bot className="h-4 w-4 text-emerald-300" />
                    Play vs Computer
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Friendly AI, quick turns, and no setup needed.
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-100">
                  Recommended
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => startNewGame('pass-and-play')}
              className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-left"
            >
              <div className="flex items-center gap-2 text-base font-semibold text-white">
                <Users className="h-4 w-4 text-cyan-300" />
                Pass &amp; Play with Friend
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Share one phone and keep the game flowing until you pause or end it.
              </p>
            </button>
          </div>
        </OverlayCard>
      ) : null}

      {showRestartPrompt ? (
        <OverlayCard>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Restart prompt
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Restart this {mode === 'computer' ? 'computer match' : 'pass-and-play game'}?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            You will reset the board and begin a fresh game in the same mode.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowRestartPrompt(false)}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => startNewGame(mode)}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-400/15 px-4 py-3 text-sm font-medium text-white"
            >
              Restart now
            </button>
          </div>
        </OverlayCard>
      ) : null}

      {showPausePrompt ? (
        <OverlayCard>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Game paused
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Match is on hold
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Resume whenever you are ready. Play will continue from the current
            position with no extra turn prompts.
          </p>

          <button
            type="button"
            onClick={() => setShowPausePrompt(false)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/15 px-4 py-3 text-sm font-medium text-white"
          >
            <Play className="h-4 w-4" />
            Resume game
          </button>
        </OverlayCard>
      ) : null}

      {pendingPromotionMove ? (
        <OverlayCard>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Promotion prompt
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Promote your pawn
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Choose the piece that will replace the pawn on the last rank.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {getPromotionPieces().map((pieceType) => (
              <button
                key={pieceType}
                type="button"
                onClick={() => handlePromotionChoice(pieceType)}
                className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-center"
              >
                <div className="text-4xl text-white">
                  {getPieceGlyph({ color: game.currentPlayer, type: pieceType })}
                </div>
                <div className="mt-2 text-sm font-medium capitalize text-slate-100">
                  {pieceType}
                </div>
              </button>
            ))}
          </div>
        </OverlayCard>
      ) : null}

      {isTerminal ? (
        <OverlayCard>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Game over
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {game.status.message}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Start a new game, choose another mode, or close back to the mode picker.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => startNewGame(mode)}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-400/15 px-4 py-3 text-sm font-medium text-white"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={closeGame}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-slate-100"
            >
              Close
            </button>
          </div>
        </OverlayCard>
      ) : null}
    </main>
  );
}

function OverlayCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-950/95 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.65)]">
        {children}
      </div>
    </div>
  );
}
