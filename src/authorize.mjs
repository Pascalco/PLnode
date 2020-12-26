import crypto from "crypto";
import axios from "axios";
import jwt from "jsonwebtoken";
import * as util from "./util.mjs";
import * as credentials from "../credentials.mjs";

function authorize(req, res) {
  if ("oauth_verifier" in req.query && "oauth_token" in req.query) {
    let url = "https://www.mediawiki.org/w/index.php";
    let nonce = crypto.randomBytes(16).toString("hex");
    let timestamp = Math.floor(Date.now() / 1000);

    let data = {
      format: "json",
      title: "Special:OAuth/token",
      oauth_verifier: req.query.oauth_verifier,
      oauth_consumer_key: credentials.consumerKey,
      oauth_token: req.cookies.requestToken,
      oauth_version: "1.0",
      oauth_nonce: nonce,
      oauth_timestamp: timestamp,
      oauth_signature_method: "HMAC-SHA1",
    };
    let signature = util.signRequest("GET", url, data, req.cookies.requestSecret);
    data.oauth_signature = signature;

    axios
      .get(url, {
        params: data,
      })
      .then(response => {
        const tokens = `${response.data.key}|${response.data.secret}`;
        util
          .getUserinfo(tokens)
          .then(response => {
            const con = util.createSQLconnection("wikidata");
            const validtill = new Date(+new Date() + 86400000 * 30).toISOString().slice(0, 19).replace("T", " ");
            con
              .promise()
              .query(`INSERT INTO users (username, oauth, oauth_validtill) VALUES ("${response.name}", "${tokens}", "${validtill}")`)
              .then(() => {
                return con.promise().query(`SELECT id FROM users WHERE oauth = "${tokens}" ORDER BY oauth_validtill DESC LIMIT 1`);
              })
              .then(([rows, fields]) => {
                const jwttoken = jwt.sign(
                  {
                    id: rows[0].id,
                  },
                  credentials.jwtSecret,
                  {
                    expiresIn: 86400 * 30,
                  }
                );
                res.redirect(`${req.cookies.landingPage}?token=${jwttoken}`);
              })
              .catch(error => {
                console.log(error);
                res.send("error");
              })
              .finally(() => {
                con.destroy();
              });
          })
          .catch(error => {
            console.log(error);
            res.send("error");
          });
      })
      .catch(error => {
        console.log(error);
        res.send("error");
      });
  } else {
    if (!("landingpage" in req.query)) {
      res.send('mandatory parameter "landingpage" missing');
      return 0;
    } else if (!/^https:\/\/[a-z0-9-]+\.toolforge\.org\/[a-z0-9-./]+$/.test(req.query.landingpage)) {
      res.send("landingpage must be on toolforge.org");
      return 0;
    }

    let tokenSecret = "";
    let url = "https://www.mediawiki.org/w/index.php";
    let nonce = crypto.randomBytes(16).toString("hex");
    let timestamp = Math.floor(Date.now() / 1000);

    let data = {
      format: "json",
      title: "Special:OAuth/initiate",
      oauth_callback: "oob",
      oauth_consumer_key: credentials.consumerKey,
      oauth_version: "1.0",
      oauth_nonce: nonce,
      oauth_timestamp: timestamp,
      oauth_signature_method: "HMAC-SHA1",
    };
    let signature = util.signRequest("GET", url, data, tokenSecret);
    data.oauth_signature = signature;

    axios
      .get(url, {
        params: data,
      })
      .then(response => {
        if ("data" in response && "key" in response.data && "secret" in response.data) {
          res.cookie("requestToken", response.data.key, {
            maxAge: 10 * 60 * 1000,
          });
          res.cookie("requestSecret", response.data.secret, {
            maxAge: 10 * 60 * 1000,
          });
          res.cookie("landingPage", req.query.landingpage, {
            maxAge: 10 * 60 * 1000,
          });
          let url = `https://www.mediawiki.org/wiki/Special:OAuth/authorize?oauth_token=${response.data.key}&oauth_consumer_key=${credentials.consumerKey}`;
          res.redirect(url);
        } else {
          res.send("authorization error");
        }
      })
      .catch(error => {
        console.log(error);
      });
  }
  return 1;
}

export { authorize };
