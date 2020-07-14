import newEngine from '@comunica/actor-init-sparql';
import * as c from './config.mjs';

const myEngine = newEngine.newEngine();

function tripleCount(req, res) {
  let data = req.query;
  if (!('query' in data)) {
    res.status(500).json({
      'error': {
        code: 'param-missing',
        info: 'The required parameter "query" was missing.'
      }
    });
  }

  const result = myEngine.query(`${c.prefix} ${data.query}`, {
    sources: [c.ldf]
  });

  result.then(value => {
    let metadata = value.metadata();
    metadata.then(val => {
      res.json({
        'count': val.totalItems
      })
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

  myEngine.invalidateHttpCache();

  return 1;

}

export {
  tripleCount
}
