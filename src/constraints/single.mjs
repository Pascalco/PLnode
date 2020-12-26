import axios from "axios";
import * as c from "../config.mjs";
import exception from "./exception.mjs";

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!exception.check(entity, constraintData)) {
      let qs = {
        query: "ASK { wd:" + entity + " p:" + p + "/ps:" + p + " [] }",
        format: "json",
      };
      axios
        .get(c.queryEndpoint, {
          params: qs,
          headers: c.headers,
        })
        .then(response => {
          resolve({
            constraint: "Q19474404",
            answer: response.data.boolean,
          });
        })
        .catch(error => {
          reject(error);
        });
    } else {
      resolve({
        constraint: "Q19474404",
        answer: false,
      });
    }
  });
}

export default {
  check,
};
