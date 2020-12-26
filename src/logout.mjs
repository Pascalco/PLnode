import * as util from "./util.mjs";

function logout(req, res) {
  const con = util.createSQLconnection("wikidata");
  util
    .getOauthTokens(req.query.token)
    .then(tokens => {
      return con.promise().query(`DELETE FROM users WHERE oauth = "${tokens}"`);
    })
    .then(() => {
      res.end("logout");
    })
    .catch(error => {
      console.log("Logout error: ", error);
      res.end("error");
    })
    .finally(() => {
      con.destroy();
    });
  return 1;
}

export { logout };
