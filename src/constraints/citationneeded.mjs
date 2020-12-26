import exception from "./exception.mjs";

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!exception.check(entity, constraintData)) {
      let res;
      if ("references" in statement) {
        res = false;
      } else {
        res = true;
      }
      resolve({
        constraint: "Q54554025",
        answer: res,
      });
    } else {
      resolve({
        constraint: "Q54554025",
        answer: false,
      });
    }
  });
}

export default {
  check,
};
