import axios from "axios";
import * as c from "../config.mjs";
import exception from "./exception.mjs";

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!exception.check(entity, constraintData)) {
      let rank = statement.rank;
      if (rank === undefined) {
        rank = "normal";
      }
      if (rank == "deprecated") {
        resolve({
          constraint: "Q52060874",
          answer: false,
        });
      } else if (rank == "normal") {
        let res = false;
        let qs = {
          query: "SELECT ?rank WHERE { wd:" + entity + " p:" + p + "/wikibase:rank ?rank }",
          format: "json",
        };
        axios
          .get(c.queryEndpoint, {
            params: qs,
            headers: c.headers,
          })
          .then(response => {
            for (let m of response.data.results.bindings) {
              if (m.rank.value == "http://wikiba.se/ontology#PreferredRank") {
                res = false;
                break;
              } else if (m.rank.value == "http://wikiba.se/ontology#NormalRank") {
                res = true;
              }
            }
            resolve({
              constraint: "Q52060874",
              answer: res,
            });
          })
          .catch(error => {
            reject(error);
          });
      } else if (rank == "preferred") {
        let qs = {
          query: "ASK { wd:" + entity + " p:" + p + "/wikibase:rank wikibase:PreferredRank }",
          format: "json",
        };
        axios
          .get(c.queryEndpoint, {
            params: qs,
            headers: c.headers,
          })
          .then(response => {
            resolve({
              constraint: "Q52060874",
              answer: response.data.boolean,
            });
          })
          .catch(error => {
            reject(error);
          });
      } else {
        resolve({
          constraint: "Q52060874",
          answer: false,
        });
      }
    } else {
      resolve({
        constraint: "Q52060874",
        answer: false,
      });
    }
  });
}

export default {
  check,
};
