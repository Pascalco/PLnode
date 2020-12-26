function getPara(data) {
  let para = {
    format: "json",
    action: "patrol",
    revid: data.revid,
  };
  return [para, "patrol"];
}

export default {
  getPara,
};
