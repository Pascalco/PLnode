import exception from './exception.mjs';

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!(exception.check(entity, constraintData)) && statement.mainsnak.snaktype == 'value') {
      let res;
      if ('upperBound' in statement.mainsnak.datavalue.value || 'lowerBound' in statement.mainsnak.datavalue.value) {
        res = true;
      } else {
        res = false;
      }
      resolve({
        constraint: 'Q51723761',
        answer: res
      });
    } else {
      resolve({
        constraint: 'Q51723761',
        answer: false
      });
    }
  });
}

export default {
  check
}
