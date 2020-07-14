import exception from './exception.mjs';

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!(exception.check(entity, constraintData))) {
      let mandatoryQualifiers = [];
      if ('P2306' in constraintData) {
        for (let statement of constraintData['P2306']) {
          if ('datavalue' in statement) {
            mandatoryQualifiers.push(statement.datavalue.value.id);
          }
        }
      }
      let qualifiers;
      if ('qualifiers' in statement) {
        qualifiers = Object.keys(statement.qualifiers);
      } else {
        qualifiers = [];
      }
      let res = !(mandatoryQualifiers.every(val => qualifiers.includes(val)));
      resolve({
        constraint: 'Q21510856',
        answer: res
      });
    } else {
      resolve({
        constraint: 'Q21510856',
        answer: false
      });
    }
  });
}

export default {
  check
}
