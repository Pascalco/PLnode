function check(entity, constraintData) {
  if ('P2303' in constraintData) {
    for (let exception of constraintData['P2303']) {
      if ('datavalue' in exception) {
        if (entity == exception.datavalue.value.id) {
          return true;
        }
      }
    }
  }
  return false;
}

export default {
  check
}
