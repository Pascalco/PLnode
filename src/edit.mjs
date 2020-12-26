import * as c from "./config.mjs";
import * as util from "./util.mjs";
import adddescription from "./edits/adddescription.mjs";
import addstatement from "./edits/addstatement.mjs";
import rollback from "./edits/rollback.mjs";
import undo from "./edits/undo.mjs";
import patrol from "./edits/patrol.mjs";

const supportedActions = ["adddescription", "addstatement", "rollback", "undo", "patrol"];

function getParams(data) {
  if (data.action == "adddescription") {
    return adddescription.getPara(data);
  } else if (data.action == "addstatement") {
    return addstatement.getPara(data);
  } else if (data.action == "rollback") {
    return rollback.getPara(data);
  } else if (data.action == "undo") {
    return undo.getPara(data);
  } else if (data.action == "patrol") {
    return patrol.getPara(data);
  } else {
    console.error("action not found");
  }
}

function edit(req, res) {
  let data = req.query;
  util
    .getOauthTokens(data.token)
    .then(tokens => {
      const tokenKey = tokens.split("|")[0];
      const tokenSecret = tokens.split("|")[1];

      let results = {};
      if (!("action" in data)) {
        results.error = {
          code: "param-missing",
          info: 'The required parameter "action" was missing.',
        };
      } else if (!("entity" in data)) {
        results.error = {
          code: "param-missing",
          info: 'The required parameter "entity" was missing.',
        };
      } else if (!supportedActions.includes(data.action)) {
        results.error = {
          code: "not-supported",
          info: `Action ${data.action} is not supported`,
        };
      }
      if ("error" in results) {
        res.json(results);
      } else {
        let params = getParams(data);
        let edittokendata = {
          format: "json",
          action: "query",
          meta: "tokens",
          type: params[1],
        };
        let promise1 = util.apiQuery(c.wdAPI, edittokendata, tokenKey, tokenSecret);
        promise1
          .then(response1 => {
            if ("query" in response1.data && "tokens" in response1.data.query) {
              for (let [tokenkey, tokenvalue] of Object.entries(response1.data.query.tokens)) {
                params[0].token = tokenvalue;
              }
              let promise2 = util.apiQuery(c.wdAPI, params[0], tokenKey, tokenSecret);
              promise2
                .then(response2 => {
                  if (!("error" in response2.data)) {
                    res.json(response2.data);
                  } else {
                    if (response2.data.error.code === "maxlag") {
                      res.json({
                        error: {
                          code: "maxlag",
                          info: "Server lag",
                        },
                      });
                    } else {
                      console.log(response2.data);
                      res.json({
                        error: {
                          code: "edit-error",
                          info: "The edit could not be saved",
                        },
                      });
                    }
                  }
                })
                .catch(error2 => {
                  console.log(error2);
                  res.json({
                    error: error2,
                  });
                });
            } else {
              res.json({
                error: "csrf token retrieval error",
              });
            }
          })
          .catch(error1 => {
            console.log(error1);
            res.json({
              error: error1,
            });
          });
      }
    })
    .catch(() => {
      res.json({
        error: {
          code: "auth-error",
          info: "not logged in",
        },
      });
    });
  return 1;
}

export { edit };
