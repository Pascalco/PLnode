import axios from 'axios';
import * as c from '../config.mjs';
import exception from './exception.mjs';
import * as util from '../util.mjs';

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!(exception.check(entity, constraintData)) && statement.mainsnak.snaktype == 'value') {
      let value = util.formatValueForSPARQL(statement.mainsnak);
      let qs = {
        query: 'ASK { ?item wdt:' + p + ' ' + value + ' }',
        format: 'json'
      };
      axios.get(c.queryEndpoint, {
        params: qs,
        headers: c.headers
      })
      .then(response => {
        resolve({
          constraint: 'Q21502410',
          answer: response.data.boolean
        });
      })
      .catch(error => {
        reject(error);
      });
    } else {
      resolve({
        constraint: 'Q21502410',
        answer: false
      });
    }
  });
}

export default {
  check
}
