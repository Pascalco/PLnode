import axios from "axios";
import * as c from "../config.mjs";
import exception from "./exception.mjs";

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!exception.check(entity, constraintData) && statement.mainsnak.snaktype == "value") {
      let namespace = "";
      if ("P2307" in constraintData) {
        if ("datavalue" in constraintData["P2307"][0]) {
          //namespace has only 1 value
          namespace = constraintData["P2307"][0].datavalue.value;
        }
      }
      let value = namespace + ":" + statement.mainsnak.datavalue.value;
      let qs = {
        action: "query",
        titles: value,
        redirects: "true",
        format: "json",
        origin: "*",
      };
      let res;
      axios
        .get(c.commonsAPI, { params: qs, headers: c.headers })
        .then(response => {
          if ("-1" in response.data.query.pages) {
            res = true;
          } else {
            res = false;
          }
          resolve({
            constraint: "Q21510852",
            answer: res,
          });
        })
        .catch(error => {
          reject(error);
        });
    } else {
      resolve({
        constraint: "Q21510852",
        answer: false,
      });
    }
  });
}

export default {
  check,
};
