import axios from 'axios';
import NodeCache from "node-cache";

import * as c from "./config.mjs";
import constraintDistinct from "./constraints/distinct.mjs";
import constraintCommonslink from "./constraints/commonslink.mjs";
import constraintEntitytype from "./constraints/entitytype.mjs";
import constraintAllowedqualifiers from "./constraints/allowedqualifiers.mjs";
import constraintAllowedunits from "./constraints/allowedunits.mjs";
import constraintCitationneeded from "./constraints/citationneeded.mjs";
import constraintConflictswith from "./constraints/conflictswith.mjs";
import constraintFormat from "./constraints/format.mjs";
import constraintInteger from "./constraints/integer.mjs";
import constraintInverse from "./constraints/inverse.mjs";
import constraintItem from "./constraints/item.mjs";
import constraintMandatoryqualifier from "./constraints/mandatoryqualifier.mjs";
import constraintNobounds from "./constraints/nobounds.mjs";
import constraintNoneof from "./constraints/noneof.mjs";
import constraintOneof from "./constraints/oneof.mjs";
import constraintPropertyscope from "./constraints/propertyscope.mjs";
import constraintRange from "./constraints/range.mjs";
import constraintSingle from "./constraints/single.mjs";
import constraintSinglebest from "./constraints/singlebest.mjs";
import constraintSymmetric from "./constraints/symmetric.mjs";
import constraintType from "./constraints/type.mjs";
import constraintValuestatement from "./constraints/valuestatement.mjs";
import constraintValuetype from "./constraints/valuetype.mjs";

const myCache = new NodeCache();

const supportedConstraints = ['Q21502410', 'Q21510852', 'Q52004125', 'Q21510851', 'Q21514353', 'Q54554025', 'Q21502838', 'Q21502404', 'Q52848401', 'Q21510855', 'Q21503247', 'Q21510856', 'Q51723761', 'Q52558054', 'Q21510859', 'Q53869507', 'Q21510860', 'Q19474404', 'Q52060874', 'Q21510862', 'Q21503250', 'Q21510864', 'Q21510865'];

function getViolationtext(constraint) {
  const texts = {
    "Q52004125": "allowed entity types violation",
    "Q21510851": "allowed qualifiers violation",
    "Q21514353": "allowed units violation",
    "Q54554025": "citation needed violation",
    "Q21510852": "commonslink violation",
    "Q21502838": "conflicts with violation",
    "Q21502410": "distinct violation",
    "Q21502404": "format violation",
    "Q52848401": "integer violation",
    "Q21510855": "inverse violation",
    "Q21503247": "item requires statement violation",
    "Q21510856": "mandatory qualifier violation",
    "Q51723761": "no bounds violation",
    "Q52558054": "none of violation",
    "Q21510859": "one of violation",
    "Q53869507": "property scope violation",
    "Q21510860": "range violation",
    "Q19474404": "single value violation",
    "Q52060874": "single best value violation",
    "Q21510862": "symmetric violation",
    "Q21503250": "type violation",
    "Q21510864": "value requires statement violation",
    "Q21510865": "value type violation"
  };
  return texts[constraint];
}

//TODO: check if the statement is valid
function checkIntegrity(statement) {
  return true;
}

//load all constraints of property p from its property page
function getPropdata(p) {
  return new Promise((resolve, reject) => {
    let propdata = myCache.get(p);
    if (propdata === undefined) { //propdata is not yet in cache
      propdata = [];
      let qs = {
        action: 'wbgetentities',
        ids: p,
        props: 'claims',
        format: 'json',
        origin: '*'
      };
      axios.get(c.wdAPI, {params: qs, headers: c.headers})
      .then(response => {
        if ('claims' in response.data.entities[p]) {
          if ('P2302' in response.data.entities[p].claims) { //P2302="property constraint"
            for (let constraint of response.data.entities[p].claims.P2302) {
              let cid = constraint.mainsnak.datavalue.value.id;
              let qualifiers = {};
              if ('qualifiers' in constraint) {
                qualifiers = constraint.qualifiers;
                if ('P2316' in qualifiers) {
                  if (qualifiers['P2316'][0].datavalue.value.id == 'Q62026391') { //suggestion constraint
                    continue
                  }
                }
              }
              propdata.push({
                [cid]: qualifiers
              });
            }
          }
        }
        if (!('Q21502838' in propdata)) {
          propdata.push({
            'Q21502838': {}
          }) //"conflicts with" constraints can always be checked
        }

        let success = myCache.set(p, propdata, 10000); //store result in cache
        resolve(propdata);
      })
      .catch(error => reject({
          error: error
        }));
    } else {
      resolve(propdata); //use cache
    }
  });
}

//check if all requested constraints are met
function checkConstraints(constraints, statement, entity, p, propdata) {
  let promises = [];
  let constraintsOnProp = propdata.map(obj => Object.keys(obj)[0]);
  let constraintsToCheck;
  if (constraints == 'all') {
    constraintsToCheck = constraintsOnProp;
  } else {
    constraintsToCheck = constraints.split('|');
  }

  for (let constraint of constraintsToCheck) {
    if (!(supportedConstraints.includes(constraint))) {
      promises.push(new Promise((resolve, reject) => {
          resolve({
            constraint: constraint,
            info: 'Constraint ' + constraint + ' not supported'
          })
        }));
    } else if (!(constraintsOnProp.includes(constraint))) {
      promises.push(new Promise((resolve, reject) => {
          resolve({
            constraint: constraint,
            info: 'Property ' + p + ' does not have constraint ' + constraint
          })
        }));
    } else {
      promises.push(checkConstraint(constraint, statement, entity, p, propdata));
    }
  }
  return promises;
}

function checkConstraint(constraint, statement, entity, p, propdata) {
  let constraintData = propdata.find(obj => Object.keys(obj)[0] == constraint)[constraint];

  if (constraint == 'Q52004125') { //allowed entity types
    return constraintEntitytype.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21510851') { //allowed qualifiers
    return constraintAllowedqualifiers.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21514353') { //allowed units
    return constraintAllowedunits.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q54554025') { //citation needed
    return constraintCitationneeded.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21510852') { //commonslink
    return constraintCommonslink.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21502838') { //conflicts with
    return constraintConflictswith.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21502410') { //distinct constraint
    return constraintDistinct.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21502404') { //format
    return constraintFormat.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q52848401') { //integer
    return constraintInteger.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21510855') { //inverse
    return constraintInverse.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21503247') { //item requires statement
    return constraintItem.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21510856') { //mandatory qualifier
    return constraintMandatoryqualifier.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q51723761') { //no bounds constraint
    return constraintNobounds.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q52558054') { //none of constraint
    return constraintNoneof.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21510859') { //one of constraint
    return constraintOneof.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q53869507') { //property scope constraint
    return constraintPropertyscope.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21510860') { //range constraint
    return constraintRange.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q19474404') { //single constraint
    return constraintSingle.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q52060874') { //single best constraint
    return constraintSinglebest.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21510862') { //symmetric constraint
    return constraintSymmetric.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21503250') { //type constraint
    return constraintType.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21510864') { //value requires statement constraint
    return constraintValuestatement.check(statement, entity, p, constraintData);

  } else if (constraint == 'Q21510865') { //value type constraint
    return constraintValuetype.check(statement, entity, p, constraintData);

  } else {
    console.log('error constraint type not found');
  }
}

function constraintCheck(req, res) {
  let results = {};

  let data = req.query;
  if (!('entity' in data)) {
    results.error = {
      code: 'param-missing',
      info: 'The required parameter "entity" was missing.'
    };
  } else if (!('statement' in data)) {
    results.error = {
      code: 'param-missing',
      info: 'The required parameter "statement" was missing.'
    };
  } else if (!('constraints' in data)) {
    results.error = {
      code: 'param-missing',
      info: 'The required parameter "constraints" was missing.'
    };
  } else if (!(checkIntegrity(data.statement))) {
    results.error = {
      code: 'invalid-statement',
      info: 'The submitted statement is not a valid statement.'
    };
  }
  if ('error' in results) {
    res.json(results);
  } else {
    results.violations = 0;
    results.problems = [];
    let statement = JSON.parse(data.statement);
    let p = statement.mainsnak.property;
    let p1 = getPropdata(p);
    p1.then(propdata => {
      let promises = checkConstraints(data.constraints, statement, data.entity, p, propdata);
      Promise.all(promises)
      .then(responses => {
        for (let response of responses) {
          if ('info' in response) {
            if (!('info' in results)) {
              results.info = [];
            }
            results.info.push(response.info);
          }
          if (response.answer == true) {
            results.violations += 1;
            results.problems.push({
              constraint: response.constraint,
              text: getViolationtext(response.constraint)
            });
          }
        }
        res.json(results)
      })
      .catch(error => {
        if ('response' in error && 'statusText' in error.response){
          console.log('cc-error', error.response.status, error.response.statusText);
          res.status(error.response.status).json({
            'error': error.response.statusText
          });
        } else {
          console.log(error);          
          res.status(500).json({
            'error': error
          });
        }
      });
    }).catch(error => {
      console.log(error);
      console.log(data);
      res.status(500).json({
        'error': error
      })
    })
  }
  return 1;
};

export {
  constraintCheck
}
