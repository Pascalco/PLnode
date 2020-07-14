import axios from 'axios';
import * as c from '../config.mjs';
import exception from './exception.mjs';
import * as util from '../util.mjs';

//this constraint can be violated in two ways:
//1. the new property adds a "conflicts with" constraint and an existing statement violates italics
//2. the new value conflicts with an constraint already present on the entity

function check(statement, entity, p, constraintData) {
  return new Promise((resolve, reject) => {
    if (!(exception.check(entity, constraintData))) {
      let check2;
      if ('P2306' in constraintData) {
        let conflictProperty = constraintData['P2306'][0].datavalue.value.id; // only one P2306 statement is allowed
        let conflictValues;
        if ('P2305' in constraintData) {
          let values = []
          for (let statement of constraintData['P2305']) {
            if (statement.snaktype == 'value') { //TODO: write query for somevalue and unknown value
              values.push(util.formatValueForSPARQL(statement));
            }
          }
          conflictValues = "?val . filter(?val in (" + values.join() + "))";
        } else {
          conflictValues = "[]";
        }
        check2 = 'UNION { wd:' + entity + ' wdt:' + conflictProperty + ' ' + conflictValues + ' }';
      } else {
        check2 = '';
      }
      let value = util.formatValueForSPARQL(statement.mainsnak);
      let qs = {
        query: 'ASK { { wd:' + entity + ' ?p [] . ?property wikibase:statement ?p; p:P2302 ?constraint . ?constraint ps:P2302 wd:Q21502838; pq:P2306 wd:' + p + ' . OPTIONAL { ?constraint pq:P2305 ?conflictValue  } FILTER(IF(BOUND(?conflictValue), ?conflictValue  = ' + value + ', true))} ' + check2 + '}',
        format: 'json'
      };
      axios.get(c.queryEndpoint, {
        params: qs,
        headers: c.headers
      })
      .then(response => {
        resolve({
          constraint: 'Q21502838',
          answer: response.data.boolean
        });
      })
      .catch(error => {
        reject(error);
      });
    } else {
      resolve({
        constraint: 'Q21502838',
        answer: false
      });
    }
  });
}

export default {
  check
}
