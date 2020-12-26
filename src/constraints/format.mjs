import exception from "./exception.mjs";

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!exception.check(entity, constraintData) && statement.mainsnak.snaktype == "value") {
      let pattern = "^(" + constraintData["P1793"][0].datavalue.value + ")$";
      let flag = "";
      if (pattern.includes("(?i)")) {
        pattern = pattern.replace("(?i)", "");
        flag = "i";
      }
      let value = statement.mainsnak.datavalue.value;
      let patt = new RegExp(pattern, flag);
      let res = !patt.test(value);
      resolve({
        constraint: "Q21502404",
        answer: res,
      });
    } else {
      resolve({
        constraint: "Q21502404",
        answer: false,
      });
    }
  });
}

export default {
  check,
};
