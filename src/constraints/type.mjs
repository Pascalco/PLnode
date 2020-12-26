import axios from "axios";
import * as c from "../config.mjs";
import exception from "./exception.mjs";

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!exception.check(entity, constraintData) && statement.mainsnak.snaktype == "value") {
      let relationId = constraintData["P2309"][0].datavalue.value.id;
      let relation;
      if (relationId == "Q21503252") {
        relation = "P31";
      } else if (relationId == "Q21514624") {
        relation = "P279";
      } else {
        relation = "P31?";
      }
      let classes = [];
      for (let statement of constraintData["P2308"]) {
        if ("datavalue" in statement) {
          classes.push(statement.datavalue.value.id);
        }
      }
      let qs = {
        query: "ASK { VALUES ?classes { wd:" + classes.join(" wd:") + "}. wd:" + entity + " wdt:" + relation + "/wdt:P279* ?classes }",
        format: "json",
      };
      axios
        .get(c.queryEndpoint, {
          params: qs,
          headers: c.headers,
        })
        .then(response => {
          resolve({
            constraint: "Q21503250",
            answer: !response.data.boolean,
          });
        })
        .catch(error => {
          reject(error);
        });
    } else {
      resolve({
        constraint: "Q21503250",
        answer: false,
      });
    }
  });
}

export default {
  check,
};
