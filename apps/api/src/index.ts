import { app } from "./app";
import { env } from "./env";

app.listen(env.port, () =>
  console.log(`Madhura Naturals API listening on :${env.port} — docs at http://localhost:${env.port}/api/docs`)
);
