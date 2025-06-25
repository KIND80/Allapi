export function getAnonymousId() {
    let anonId = localStorage.getItem("alapi_anon_id");
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem("alapi_anon_id", anonId);
    }
    return anonId;
  }
  