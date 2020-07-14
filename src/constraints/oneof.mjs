import exception from './exception.mjs';

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!(exception.check(entity, constraintData))) {
      let oneofvalues = [];
      if ('P2305' in constraintData) {
        for (let statement of constraintData['P2305']) {
          if ('datavalue' in statement) {
            oneofvalues.push(statement.datavalue.value.id);
          } else {
            oneofvalues.push(statement.snaktype);
          }
        }
      }
      let value;
      if ('datavalue' in statement.mainsnak) {
        value = statement.mainsnak.datavalue.value.id;
      } else {
        value = statement.mainsnak.snaktype;
      }
      let res = !(oneofvalues.includes(value));
      resolve({
        constraint: 'Q21510859',
        answer: res
      });
    } else {
      resolve({
        constraint: 'Q21510859',
        answer: false
      });
    }
  });
}

export default {
  check
}
