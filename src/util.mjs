import crypto from "crypto";
import mysql from "mysql2";
import * as credentials from "../credentials.mjs";
import * as c from "./config.mjs";
import axios from "axios";
import querystring from "querystring";
import jwt from "jsonwebtoken";

function uriFullEncode(url) {
  return encodeURI(url).replace(/\(/g, "%28").replace(/\)/g, "%29");
}

function rawurlencode(str) {
  str = str + "";
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

function formatValueForSPARQL(snak) {
  if (snak.snaktype == "novalue") {
    return "";
  }
  if (snak.snaktype == "somevalue") {
    return "";
  }

  if (snak.datatype == "wikibase-item") {
    return "wd:" + snak.datavalue.value.id;
  } else if (snak.datatype == "commonsMedia") {
    return "<http://commons.wikimedia.org/wiki/Special:FilePath/" + uriFullEncode(snak.datavalue.value) + ">";
  } else {
    return '"' + snak.datavalue.value + '"';
  }
}

function parseDate(datestring) {
  if (datestring[0] == "-") {
    return new Date("0000-01-01"); // to be fixed
  } else if (datestring[0] == "+" || datestring[0] == " ") {
    return new Date(datestring.substring(1).replace("-00-00", "-01-01").replace("-00", "-01"));
  } else {
    return new Date(datestring.replace("-00-00", "-01-01"));
  }
}

function createSQLconnectionReplica(database) {
  const connection = mysql.createConnection({
    host: "enwiki.analytics.db.svc.eqiad.wmflabs",
    user: credentials.sqluser,
    password: credentials.sqlpwd,
    database: `${database}_p`,
  });
  return connection;
}

function createSQLconnectionTools(database) {
  const connection = mysql.createConnection({
    host: "tools.db.svc.eqiad.wmflabs",
    user: credentials.sqluser,
    password: credentials.sqlpwd,
    database: `s54217__${database}`,
  });
  return connection;
}

function getOauthTokens(token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      return reject(0);
    }
    jwt.verify(token, credentials.jwtSecret, (err, decoded) => {
      if (err) {
        return reject(0);
      }
      const con = createSQLconnectionTools("wikidata");
      con
        .promise()
        .query(`SELECT oauth, oauth_validtill FROM users WHERE id = "${decoded.id}" LIMIT 1`)
        .then(([results, fields]) => {
          if (results.length !== 1) {
            return reject(0);
          }
          let validdate = new Date(results[0].oauth_validtill);
          let today = new Date();
          if (validdate > today) {
            resolve(results[0].oauth);
          } else {
            return con.promise().query(`DELETE FROM users WHERE id = "${decoded.id}"`);
          }
        })
        .then(val => {
          reject(0);
        })
        .catch(error => {
          console.log(error);
          reject(0);
        })
        .finally(() => {
          con.destroy();
        });
    });
  });
}

function getUserinfo(tokens) {
  return new Promise((resolve, reject) => {
    if (!tokens) {
      return reject(0);
    }
    const tokenKey = tokens.split("|")[0];
    const tokenSecret = tokens.split("|")[1];
    if (tokenKey === undefined || tokenSecret === undefined) {
      reject({ name: 0, rights: [], options: {} });
    }

    let params = {
      format: "json",
      action: "query",
      meta: "userinfo",
      uiprop: "rights|options",
    };

    let promise = apiQuery(c.wdAPI, params, tokenKey, tokenSecret);
    promise
      .then(response => {
        if ("query" in response.data && "userinfo" in response.data.query && "name" in response.data.query.userinfo) {
          resolve(response.data.query.userinfo);
        } else {
          reject({ name: 0, rights: [], options: {} });
        }
      })
      .catch(error => {
        console.log(error);
        reject({ name: 0, rights: [], options: {} });
      });
  });
}

function signRequest(method, url, data, tokenSecret) {
  let key = credentials.consumerSecret + "&" + tokenSecret;
  let dataSorted = Object.keys(data);
  dataSorted.sort();
  let pairs = [];
  for (let m of dataSorted) {
    pairs.push(rawurlencode(m) + "=" + rawurlencode(data[m]));
  }
  let toSign = method.toUpperCase() + "&" + rawurlencode(url) + "&" + rawurlencode(pairs.join("&"));

  return crypto.createHmac("sha1", key).update(toSign).digest("base64");
}

function apiQuery(url, data, tokenKey, tokenSecret) {
  let nonce = crypto.randomBytes(16).toString("hex");
  let timestamp = Math.floor(Date.now() / 1000);
  let method = "post";
  let oauthheaders = {
    oauth_consumer_key: credentials.consumerKey,
    oauth_token: tokenKey,
    oauth_version: "1.0",
    oauth_nonce: nonce,
    oauth_timestamp: timestamp,
    oauth_signature_method: "HMAC-SHA1",
  };

  let signData = {
    ...data,
    ...oauthheaders,
  };

  oauthheaders["oauth_signature"] = signRequest(method, url, signData, tokenSecret);
  let headersArray = [];

  for (let key of Object.keys(oauthheaders)) {
    headersArray.push(rawurlencode(key) + '="' + rawurlencode(oauthheaders[key]) + '"');
  }

  let headers = {
    Authorization: "OAuth " + headersArray.join(", "),
    "content-type": "application/x-www-form-urlencoded",
  };

  return axios.post(url, querystring.stringify(data), {
    headers: headers,
  });
}

export {
  uriFullEncode,
  formatValueForSPARQL,
  parseDate,
  apiQuery,
  signRequest,
  createSQLconnectionReplica,
  createSQLconnectionTools,
  getUserinfo,
  getOauthTokens,
};
