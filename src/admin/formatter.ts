import humanizeDuration from "humanize-duration";
import { DateTime, Interval } from "luxon";
import { ARENA_URL } from "../common/constants";
import redis from "../common/redis";
import { Battle, Game, Run } from "../common/types";

const getRunUrl = (game: Game, runId: string): string => {
  return `${ARENA_URL}/admin/${game}/runs/${runId}`
}

const getBattleUrl = (game: Game, battleId: string): string => {
  return `${ARENA_URL}/admin/${game}/battles/${battleId}`
}

const getMoveUrl = (game: Game, moveId: string): string => {
  return `${ARENA_URL}/admin/moves/${moveId}`
}

const timestampToString = (t?: number) => {
  if (t === undefined) {
    return undefined
  }
  return DateTime.fromMillis(t).toString()
}

const getDuration = (start?: number, end?: number) => {
  if (start === undefined || end === undefined) {
    return undefined
  }
  const interval = Interval
    .fromDateTimes(DateTime.fromMillis(start), DateTime.fromMillis(end))
    .toDuration()
    .valueOf()
  return humanizeDuration(interval)
}

export const getBattles = async (game: Game, battleId: string) => {
  const b = await redis.get(`arena:${game}:battle:${battleId}`)
  if (b) {
    return JSON.parse(b) as Battle<any, any, any, any>
  }
}

export const formatRun = async (game: Game, run: Run) => {
  const battles = await Promise.all(run.battleIds.map(async battleId => {
    const battle = await getBattles(game, battleId);
    if (battle) {
      return briefBattle(game, battle)
    }
  }))
  return {
    id: run.id,
    callbackUrl: run.callbackUrl,
    score: run.score,
    message: run.message,
    createdAt: run.createdAt,
    createdAtStr: timestampToString(run.createdAt),
    completedAt: run.completedAt,
    completedAtStr: timestampToString(run.completedAt),
    duration: getDuration(run.createdAt, run.completedAt),
    battles,
  }
}

export const briefRun = (game: Game, run: Run) => {
  return {
    id: run.id,
    score: run.score,
    createdAt: run.createdAt,
    createdAtStr: timestampToString(run.createdAt),
    callbackUrl: run.callbackUrl,
    link: getRunUrl(game, run.id)
  }
}

export const getWaitingTime = (battle: Battle<any, any, any, any>) => {
  if (battle.history.length < 2) {
    return getDuration(battle.createdAt, Date.now());
  } else {
    return getDuration(battle.createdAt, battle.history[1].createdAt);
  }
}

export const getHistoryWithMove = (game: Game, battle: Battle<any, any, any, any>) => {
  let counter = 0;
  return battle.history.map((state) => {
    return {
      ...state,
      moveUrl: state.turn === battle.externalPlayer
        ? getMoveUrl(game, battle.moves[counter++])
        : undefined,
    } as Record<string, any>
  })
}

export const formatBattle = (game: Game, battle: Battle<any, any, any, any>) => {
  return {
    id: battle.id,
    runId: battle.runId,
    runUrl: getRunUrl(game, battle.runId),
    type: battle.type,
    externalPlayer: battle.externalPlayer,
    clock: battle.clock,
    result: battle.result,
    flippedReason: battle.flippedReason,
    score: battle.score,
    createdAtStr: DateTime.fromMillis(battle.createdAt ?? 0).toString(),
    completedAtStr: timestampToString(battle.completedAt),
    duration: getDuration(battle.createdAt, battle.completedAt),
    waitingTime: getWaitingTime(battle),
    history: battle.history, //getHistoryWithMove(game, battle),
    moves: battle.moves,
  }
}

export const briefBattle = (game: Game, battle: Battle<any, any, any, any>) => {
  return {
    id: battle.id,
    type: battle.type,
    score: battle.score,
    result: battle.result,
    flippedReason: battle.flippedReason,
    link: getBattleUrl(game, battle.id),
    createdAtStr: DateTime.fromMillis(battle.createdAt ?? 0).toString(),
    completedAtStr: timestampToString(battle.completedAt),
    duration: getDuration(battle.createdAt, battle.completedAt),
    waitingTime: getWaitingTime(battle),
  }
}
