import exception from './exception.mjs';

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!(exception.check(entity, constraintData)) && 'qualifiers' in statement) {
      let allowedQualifiers = [];
      if ('P2306' in constraintData) {
        for (let statement of constraintData['P2306']) {
          if ('datavalue' in statement) {
            allowedQualifiers.push(statement.datavalue.value.id);
          }
        }
      }
      let qualifiers = Object.keys(statement.qualifiers);
      let res = !(qualifiers.every(val => allowedQualifiers.includes(val)));
      resolve({
        constraint: 'Q21510851',
        answer: res
      });
    } else {
      resolve({
        constraint: 'Q21510851',
        answer: false
      });
    }
  });
}

export default {
  check
}
