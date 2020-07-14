import exception from './exception.mjs';
import * as util from '../util.mjs';

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!(exception.check(entity, constraintData)) && statement.mainsnak.snaktype == 'value') {
      let value;
      let minval;
      let maxval;
      if (statement.mainsnak.datatype == 'quantity') {
        value = statement.mainsnak.datavalue.value.amount;
        if (constraintData['P2313'][0].snaktype == 'value') {
          minval = parseFloat(constraintData['P2313'][0].datavalue.value.amount);
        } else {
          minval = -Infinity;
        }
        if (constraintData['P2312'][0].snaktype == 'value') {
          maxval = parseFloat(constraintData['P2312'][0].datavalue.value.amount);
        } else {
          maxval = Infinity;
        }

      } else if (statement.mainsnak.datatype == 'time') {
        value = util.parseDate(statement.mainsnak.datavalue.value.time); //wrong for BC dates
        if (constraintData['P2310'][0].snaktype == 'value') {
          minval = util.parseDate(constraintData['P2310'][0].datavalue.value.time);

        } else if (constraintData['P2310'][0].snaktype == 'somevalue') {
          minval = new Date();
        } else {
          minval = -Infinity;
        }
        if (constraintData['P2311'][0].snaktype == 'value') {
          maxval = util.parseDate(constraintData['P2311'][0].datavalue.value.time);
        } else if (constraintData['P2311'][0].snaktype == 'somevalue') {
          maxval = new Date();
        } else {
          maxval = Infinity;
        }
      }
      let res = !(value >= minval && value <= maxval);
      resolve({
        constraint: 'Q21510860',
        answer: res
      });
    } else {
      resolve({
        constraint: 'Q21510860',
        answer: false
      });
    }
  });
}

export default {
  check
}
