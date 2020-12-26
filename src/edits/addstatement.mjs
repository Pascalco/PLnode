function getPara(data) {
  let summary = "";
  if ("summary" in data) {
    summary = data.summary;
  }

  let para = {
    format: "json",
    action: "wbeditentity",
    id: data.entity,
    data: JSON.stringify({ claims: [JSON.parse(data.statement)] }),
    summary: summary,
    maxlag: 10,
    bot: 1,
  };
  return [para, "csrf"];
}

export default {
  getPara,
};
