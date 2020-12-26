import express from "express";
import bodyParser from "body-parser";
import path from "path";
import cookieParser from "cookie-parser";
import { authorize } from "./authorize.mjs";
import { profile } from "./profile.mjs";
import { logout } from "./logout.mjs";
import { constraintCheck } from "./constraintCheck.mjs";
import { tripleCount } from "./tripleCount.mjs";
import { edit } from "./edit.mjs";
import { exists } from "./exists.mjs";
import { harvester } from "./harvester.mjs";

let app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(function (req, res, next) {
  let origin = req.headers.origin;
  if (!origin) {
    origin = "*";
  }
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", true);
  return next();
});

app.use("/static", express.static("public"));

let server = app.listen(process.env.PORT, function () {
  let host = server.address().address;
  let port = server.address().port;
  console.log("Info: Listening at http://%s:%s", host, port);
});

app.get("/authorize", authorize);
app.get("/profile", profile);
app.get("/logout", logout);
app.get("/cc", constraintCheck);
app.get("/edit", edit);
app.get("/triplecount", tripleCount);
app.get("/exists", exists);
app.post("/harvester", harvester);
app.get("/", function (req, res) {
  res.sendFile("doc.html", { root: "public" });
});
