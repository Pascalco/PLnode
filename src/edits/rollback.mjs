function getPara(data) {
  let para = {
    format: "json",
    action: "rollback",
    title: data.entity,
    user: data.user,
  };
  return [para, "rollback"];
}

export default {
  getPara,
};
