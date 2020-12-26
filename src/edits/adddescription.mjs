function getPara(data) {
  let para = {
    format: "json",
    action: "wbsetdescription",
    id: data.entity,
    language: data.language,
    value: data.term,
    maxlag: 10,
    bot: 1,
  };
  return [para, "csrf"];
}

export default {
  getPara,
};
