import axios from 'axios';
import * as c from './config.mjs';

function exists(req, res) {
  let data = req.query;
  if (!('entity' in data)) {
    res.json({
      'error': {
        code: 'param-missing',
        info: 'The required parameter "entity" was missing.'
      }
    });
  }
  if (!('property' in data)) {
    res.json({
      'error': {
        code: 'param-missing',
        info: 'The required parameter "property" was missing.'
      }
    });
  }

  let params = {
    'action': 'wbgetclaims',
    'entity': data.entity,
    'property': data.property,
    'format': 'json',
    'origin': '*',
  }

  axios.get(c.wdAPI, {
    params: params,
    headers: c.headers
  })
  .then(response => {
    let answer = false;
    if ('claims' in response.data) {
      if (data.property in response.data.claims) {
        if (data.value) {
          for (let statement of response.data.claims[data.property]) {
            let datavalue = statement.mainsnak.datavalue;
            if (datavalue.type == 'time' && datavalue.value.time == data.value) {
              answer = true;
            }
            if (datavalue.type == 'wikibase-entityid' && datavalue.value.id == data.value) {
              answer = true;
            }
            if (datavalue.type == 'string' && datavalue.value == data.value) {
              answer = true;
            }
            if (datavalue.type == 'quantity' && parseFloat(datavalue.value.amount) == parseFloat(data.value)) {
              answer = true;
            }
            if (datavalue.type == 'monolingualtext' && datavalue.value.text == data.value) {
              answer = true;
            }
            if (datavalue.type == 'globecoordinate') {
              let latWD = parseFloat(datavalue.value.latitude);
              let lonWD = parseFloat(datavalue.value.longitude);
              let latRe = parseFloat(data.value.split('|')[0]);
              let lonRe = parseFloat(data.value.split('|')[1]);
              if (Math.abs(latWD - latRe) < 0.001 && Math.abs(lonWD - lonRe) < 0.001) {
                answer = true;
              }
            }
          }
        } else {
          answer = true;
        }
      }
    }
    res.json({
      'exists': answer
    });
  })
  .catch(error => {
    console.log(error);
    res.status(500).json({
      'error': {
        code: 'queryerror',
        info: error
      }
    });
  });
  return 1;
}

export {
  exists
}
