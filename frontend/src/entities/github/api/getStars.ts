export async function getGithubStars() {
  const CACHE_KEY = process.env.REACT_APP_CACHE_KEY || "github_stars";
  const CACHE_TIME = Number(process.env.REACT_APP_CACHE_TIME) || 1000 * 60 * 60;
  const API = process.env.REACT_APP_GITHUB_API;

  const cached = localStorage.getItem(CACHE_KEY);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;

      if (age < CACHE_TIME) {
        return parsed.stars;
      }
    } catch (e) {
      console.error("Cache parse error:", e);
    }
  }

  try {
    const response = await fetch(API!);
    const data = await response.json();

    if (data.stargazers_count !== undefined) {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          stars: data.stargazers_count,
          timestamp: Date.now(),
        })
      );

      return data.stargazers_count;
    }
  } catch (e) {
    console.error("GitHub fetch error:", e);
  }

  return null;
}
