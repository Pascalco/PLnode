import exception from "./exception.mjs";

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!exception.check(entity, constraintData) && statement.mainsnak.snaktype == "value") {
      let amount = statement.mainsnak.datavalue.value.amount;
      let res = !Number.isInteger(parseFloat(amount));
      resolve({
        constraint: "Q52848401",
        answer: res,
      });
    } else {
      resolve({
        constraint: "Q52848401",
        answer: false,
      });
    }
  });
}

export default {
  check,
};
