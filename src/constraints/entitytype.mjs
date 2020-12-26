import exception from "./exception.mjs";

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!exception.check(entity, constraintData)) {
      let targetEntityTypes = [];
      if ("P2305" in constraintData) {
        for (let statement of constraintData["P2305"]) {
          if ("datavalue" in statement) {
            targetEntityTypes.push(statement.datavalue.value.id);
          }
        }
      }
      let entityType;
      if (entity.charAt(0) == "Q") {
        entityType = "Q29934200";
      } else if (entity.charAt(0) == "P") {
        entityType = "Q29934218";
      } else if (entity.charAt(0) == "L") {
        if (entity.indexOf("F") > -1) {
          entityType = "Q54285143";
        } else if (entity.indexOf("S") > -1) {
          entityType = "Q54285715";
        } else {
          entityType = "Q51885771";
        }
      }

      let res = !targetEntityTypes.includes(entityType);
      resolve({
        constraint: "Q52004125",
        answer: res,
      });
    } else {
      resolve({
        constraint: "Q52004125",
        answer: false,
      });
    }
  });
}

export default {
  check,
};
