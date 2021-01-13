import axios from "axios";
import * as util from "./util.mjs";
import * as c from "./config.mjs";

function getPages(con, allPages, toDo, depth, namespace) {
  return new Promise((resolve, reject) => {
    const categoriesString = toDo.join('","');
    let promise = con
      .promise()
      .query(
        `SELECT DISTINCT page_title, page_namespace FROM page, categorylinks WHERE page_id=cl_from AND cl_to IN ("${categoriesString}")`
      );
    promise
      .then(([results, fields]) => {
        toDo = [];
        for (let result of results) {
          if (result.page_namespace == namespace) {
            allPages.push(result.page_title.toString("utf8"));
          }
          if (result.page_namespace == 14) {
            toDo.push(result.page_title.toString("utf8"));
          }
        }
        if (toDo.length > 0 && depth != 0) {
          getPages(con, allPages, toDo, depth - 1, namespace)
            .then(pages => {
              resolve(pages);
            })
            .catch(err => {
              console.log(err);
              reject(err);
            });
        } else {
          resolve(allPages);
        }
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
  });
}

function categoryScan(req, res) {
  let data = req.query;
  if (!("category" in data)) {
    res.status(500).json({
      error: {
        code: "param-missing",
        info: 'The required parameter "category" was missing.',
      },
    });
  }
  if (!("servername" in data)) {
    res.status(500).json({
      error: {
        code: "param-missing",
        info: 'The required parameter "servername" was missing.',
      },
    });
  }
  const category = data.category.replace(/ /g, "_");
  const servername = data.servername;
  let depth;
  if ("depth" in data) {
    depth = parseInt(data.depth);
  } else {
    depth = 0;
  }
  let namespace;
  if ("namespace" in data) {
    namespace = parseInt(data.namespace);
  } else {
    namespace = 0;
  }

  let qs = {
    action: "query",
    meta: "siteinfo",
    siprop: "general",
    format: "json",
    origin: "*",
  };
  axios
    .get(`https://${servername}/w/api.php`, { params: qs, headers: c.headers })
    .then(response => {
      const site = response.data.query.general.wikiid;
      const con = util.createSQLconnectionReplica(site);
      getPages(con, [], [category], depth, namespace)
        .then(pages => {
          res.json([...new Set(pages)]);
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({
            error: {
              code: "unknown",
              info: err,
            },
          });
        })
        .finally(() => {
          con.destroy();
        });
    })
    .catch(err => {
      res.status(500).json({
        error: {
          code: "unknown",
          info: err,
        },
      });
    });
}

export { categoryScan };
