import * as util from './util.mjs';

function profile(req, res) {
  util.getOauthTokens(req.query.token)
  .then(tokens => {
    return util.getUserinfo(tokens);
  })
  .then(userinfo => {
    res.send({username: userinfo.name, rights: userinfo.rights, options: userinfo.options});
  })
  .catch(error => {
    console.log(error);
    res.send({username: 0, rights: [], options: {}});
  });
  return 1;
}

export {
  profile
}
