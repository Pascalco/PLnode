import exception from "./exception.mjs";

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!exception.check(entity, constraintData) && statement.mainsnak.snaktype == "value") {
      let allowedUnits = [];
      if ("P2305" in constraintData) {
        for (let statement of constraintData["P2305"]) {
          if (statement.snaktype == "value") {
            allowedUnits.push(statement.datavalue.value.id);
          } else {
            allowedUnits.push("1");
          }
        }
      }
      let unit = statement.mainsnak.datavalue.value.unit.replace("http://www.wikidata.org/entity/", "");
      let res = !allowedUnits.includes(unit);
      resolve({
        constraint: "Q21514353",
        answer: res,
      });
    } else {
      resolve({
        constraint: "Q21514353",
        answer: false,
      });
    }
  });
}
export default {
  check,
};
