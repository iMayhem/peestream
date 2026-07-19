window.__CONFIG__ = {
  // The URL for the CORS proxy, the URL must NOT end with a slash!
  // If not specified, the onboarding will not allow a "default setup". The user will have to use the extension or set up a proxy themselves
  VITE_CORS_PROXY_URL: "https://proxy.peestream.in,|type=api|https://providers.peestream.in",

  VITE_BACKEND_URL: "https://api.peestream.in",

  // The READ API key to access TMDB
  VITE_TMDB_READ_API_KEY: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkZmE0YzJjN2MxZGUxMDA1YWRlZTgyNGRjNTU5MzY3MiIsIm5iZiI6MTc1NTM1ODg0NS45NCwic3ViIjoiNjhhMGE2N2RjMDM0MmI4ZmRkZWQxMzljIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.XQoZX0eJUCboSHFR15I1kZhXgIrKavsEamnKwusjj8I",

  // The DMCA email displayed in the footer, null to hide the DMCA link
  VITE_DMCA_EMAIL: null,

  // Whether to disable hash-based routing, leave this as false if you don't know what this is
  VITE_NORMAL_ROUTER: true,

  // A comma separated list of disallowed IDs in the case of a DMCA claim - in the format "series-<id>" and "movie-<id>"
  VITE_DISALLOWED_IDS: "",

  // Enable Febbox (Aurora API) support
  VITE_ALLOW_FEBBOX_KEY: "true"
};
