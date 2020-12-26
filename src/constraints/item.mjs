import axios from "axios";
import * as c from "../config.mjs";
import exception from "./exception.mjs";
import * as util from "../util.mjs";

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!exception.check(entity, constraintData)) {
      let requiredProperty = constraintData["P2306"][0].datavalue.value.id; // only one P2306 statement is allowed
      let valueStr;
      if ("P2305" in constraintData) {
        let values = [];
        for (let statement of constraintData["P2305"]) {
          if (statement.snaktype == "value") {
            //TODO: write query for somevalue and unknown value
            values.push(util.formatValueForSPARQL(statement));
          }
        }
        valueStr = "?val . filter(?val in (" + values.join() + "))";
      } else {
        valueStr = "[]";
      }

      let qs = {
        query: "ASK { wd:" + entity + " wdt:" + requiredProperty + " " + valueStr + " }",
        format: "json",
      };
      axios
        .get(c.queryEndpoint, {
          params: qs,
          headers: c.headers,
        })
        .then(response => {
          resolve({
            constraint: "Q21503247",
            answer: !response.data.boolean,
          });
        })
        .catch(error => {
          reject(error);
        });
    } else {
      resolve({
        constraint: "Q21503247",
        answer: false,
      });
    }
  });
}

export default {
  check,
};
