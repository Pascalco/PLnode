import * as util from "./util.mjs";

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
  if (!("site" in data)) {
    res.status(500).json({
      error: {
        code: "param-missing",
        info: 'The required parameter "site" was missing.',
      },
    });
  }
  const category = data.category.replace(/ /g, "_");
  const site = data.site;
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
  return 1;
}

export { categoryScan };
