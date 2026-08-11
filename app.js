import { readFile, writeFile } from "fs/promises";
import { createServer } from "http";
import crypto from "crypto";

process.loadEnvFile();

const PORT = Number(process.env.PORT) || 
const DATA_FILE = path.join("data", "links.json");

const loadLinks = async () => {
  try {
    const data = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(DATA_FILE, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};

const saveLinks = async (links) => {
  await writeFile(DATA_FILE, JSON.stringify(links));
};

const server = createServer(async (req, res) => {
  //   console.log(req.url)
  console.log(req.method, req.url);
  if (req.method === "GET") {
    if (req.url === "/") {
      try {
        const data = await readFile(path.join("public", "index.html"));

        res.writeHead(200, {
          "Content-Type": "text/html",
        });

        return res.end(data);
      } catch (err) {
        res.writeHead(404, {
          "Content-Type": "text/plain",
        });

        return res.end("404 Page not found");
      }
    } else if (req.url === "/style.css") {
      try {
        const data = await readFile(path.join("public", "style.css"));

        res.writeHead(200, {
          "Content-Type": "text/css",
        });

        return res.end(data);
      } catch (err) {
        res.writeHead(404, {
          "Content-Type": "text/plain",
        });

        return res.end("404 Page not found");
      }
    } else if (req.url === "/links") {
      const links = await loadLinks();

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      return res.end(JSON.stringify(links));
    } else {
      const links = await loadLinks();
      const shortCode = req.url.slice(1);
      if (links[shortCode]) {
        res.writeHead(302, { location:links[shortCode] });
        return res.end();
      }
      res.writeHead(404, {
        "Content-Type": "text/plain",
      });
      return res.end("Shortened url is not found");
    }
  }
  if (req.method === "POST" && req.url === "/shorten") {
    const links = await loadLinks();
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      const { url, shortCode } = JSON.parse(body);
      console.log(url, shortCode);
      if (!url) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("url is required");
      }
      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
      if (links[finalShortCode]) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Shortcode already exists");
      }
      links[finalShortCode] = url;
      await saveLinks(links);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, shortCode: finalShortCode }));
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
