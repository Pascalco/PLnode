import exception from './exception.mjs';

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!(exception.check(entity, constraintData))) {
      let noneofvalues = [];
      if ('P2305' in constraintData) {
        for (let statement of constraintData['P2305']) {
          if ('datavalue' in statement) {
            noneofvalues.push(statement.datavalue.value.id);
          } else {
            noneofvalues.push(statement.snaktype);
          }
        }
      }
      let value;
      if ('datavalue' in statement.mainsnak) {
        value = statement.mainsnak.datavalue.value.id;
      } else {
        value = statement.mainsnak.snaktype;
      }
      let res = noneofvalues.includes(value);
      resolve({
        constraint: 'Q52558054',
        answer: res
      });
    } else {
      resolve({
        constraint: 'Q52558054',
        answer: false
      });
    }
  });
}

export default {
  check
}
