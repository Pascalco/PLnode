import exception from './exception.mjs';

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!(exception.check(entity, constraintData))) {
      let scope = [];
      if ('P5314' in constraintData) {
        for (let statement of constraintData['P5314']) {
          if (statement.datavalue.value.id == 'Q54828448') {
            scope.push('mainsnak');
          } else if (statement.datavalue.value.id == 'Q54828450') {
            scope.push('source');
          } else if (statement.datavalue.value.id == 'Q54828449') {
            scope.push('qualifier');
          }
        }
      }
      let res = !(scope.includes('mainsnak')); // only maisnak is tested
      resolve({
        constraint: 'Q53869507',
        answer: res
      });
    } else {
      resolve({
        constraint: 'Q53869507',
        answer: false
      });
    }
  });
}

export default {
  check
}
