import "dotenv/config";
import app from "./app";

// Vercel runs the exported app as a function, so it only listens elsewhere.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 5000;

  app.listen(port, () => {
    console.log(`Parabondhu API listening on port ${port}`);
  });
}

export default app;
