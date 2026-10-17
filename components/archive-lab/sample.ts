import { mixers, spotsOf, type Project } from "@/lib/content";

/**
 * Prototype sample (not the whole Archive): the mixers' spots dealt round-robin, so neighbours are
 * never from the same mixer. `index` is the film's place in `films`, for the player.
 */
export function sample(count = 27) {
  const per = mixers.map((m) => spotsOf(m.slug));
  const films: Project[] = [];
  for (let i = 0; films.length < count && i < 20; i++) for (const list of per) if (list[i] && films.length < count) films.push(list[i]);
  return { films, spots: films.map((film, index) => ({ film, index })) };
}

/** Lanes: one lane per mixer, up to `count` of their spots each. */
export function lanesSample(count = 8) {
  const films: Project[] = [];
  const lanes = mixers.map((mixer) => {
    const list = spotsOf(mixer.slug).slice(0, count).map((film) => ({ film, index: films.push(film) - 1 }));
    return { mixer, films: list };
  });
  return { films, lanes };
}
