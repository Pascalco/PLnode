import axios from "axios";
import { monthnames } from "./ht/monthnames.mjs";
import { numerals } from "./ht/numerals.mjs";
import { own } from "./config.mjs";

function toArabicNumerals(str) {
  for (let [k, v] of Object.entries(numerals)) {
    let r = new RegExp(k, "g");
    str = str.replace(r, v);
  }
  return str;
}

function parseDate(val, lang) {
  let date;
  let value = val.replace(/–|-|—/g, "-").replace(/\[\[|\]\]/g, "");
  value = toArabicNumerals(value);
  const roman = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
    11: "XI",
    12: "XII",
  };
  //imprecise dates
  let r = new RegExp("\\b(años|vor|nach|ungefähr|ca|around)\\b");
  let res = value.match(r);
  if (res !== null) {
    return undefined;
  }
  //only year
  r = new RegExp("\\b(\\d{4})\\b");
  res = value.match(r);
  if (res !== null) {
    date = res[1] + "-00-00";
  }
  for (let [name, num] of Object.entries(monthnames[lang]) || {}) {
    // month and year
    r = new RegExp("(" + name + "|" + name.substr(0, 3) + ") (\\d{4})", "i");
    res = value.match(r);
    if (res !== null) {
      date = res[2] + "-" + num + "-00";
    }
    // day, month, year
    r = new RegExp("(\\d{1,2})( |\\. |º |er | - an? de | de | d'| ב)?(" + name + ")(,| del?|, इ.स.| พ.ศ.)? (\\d{4})", "i");
    res = value.match(r);
    if (res !== null) {
      date = res[5] + "-" + num + "-" + res[1];
    }
    // month, day, year
    r = new RegExp("(" + name + "|" + name.substr(0, 3) + ") (\\d{1,2})t?h?\\,? (\\d{4})", "i");
    res = value.match(r);
    if (res !== null) {
      date = res[3] + "-" + num + "-" + res[2];
    }
    // year, month, day
    r = new RegExp("(\\d{4})(e?ko|\\.|,)? (" + name + ")(aren)? (\\d{1,2})(a|ean|an)?", "i");
    res = value.match(r);
    if (res !== null) {
      date = res[1] + "-" + num + "-" + res[5];
    }
  }
  for (let num = 1; num <= 12; num++) {
    // day, month (number), year
    r = new RegExp("(\\d{1,2})([. /]+| tháng )(0?" + num + "|" + roman[num] + ")([., /]+| năm )(\\d{4})", "i");
    res = value.match(r);
    if (res !== null) {
      date = res[5] + "-" + num + "-" + res[1];
    }
    // year, month (number), day
    r = new RegExp("(\\d{4})( - |/)(0?" + num + "|" + roman[num] + ")( - |/)(\\d{1,2})", "i");
    res = value.match(r);
    if (res !== null) {
      date = res[1] + "-" + num + "-" + res[5];
    }
  }
  // Japanese/Chinese/Korean
  r = new RegExp("(\\d{4})(年|年）|年[〈（(][^）〉)]+[〉|）|)]|년)");
  res = value.match(r);
  if (res !== null) {
    date = res[1] + "-00-00";
  }
  r = new RegExp("(\\d{4})(年|年）|年[〈（(][^）〉)]+[〉|）|)]|년 )(\\d{1,2})(月|월)");
  res = value.match(r);
  if (res !== null) {
    date = res[1] + "-" + res[3] + "-00";
  }
  r = new RegExp("(\\d{4})(年|年）|年[〈（(][^）〉)]+[〉|）|)]|년 )(\\d{1,2})(月|월 )(\\d{1,2})(日|일)");
  res = value.match(r);
  if (res !== null) {
    date = res[1] + "-" + res[3] + "-" + res[5];
  }
  return date;
}

function checkForInterwiki(res, qid, api) {
  let data = {
    action: "query",
    prop: "pageprops",
    ppprop: "wikibase_item",
    titles: res,
    redirects: 1,
    format: "json",
    origin: "*",
  };
  return new Promise((resolve, reject) => {
    axios
      .get(api, {
        params: data,
      })
      .then(response => {
        for (let m in response.data.query.pages) {
          if (m !== "-1") {
            if ("pageprops" in response.data.query.pages[m]) {
              let newvalue = response.data.query.pages[m].pageprops.wikibase_item;
              if (newvalue === qid) {
                reject("target is same as the item");
              } else {
                resolve(newvalue);
              }
            } else {
              reject("target has no Wikidata item");
            }
          } else {
            reject("no target page found");
          }
        }
      });
  });
}

function parseMediawikiTemplate(t, templateprefixes, templateredirects, template) {
  templateredirects.push(template);
  for (let m of templateredirects) {
    if (m.includes(" ")) {
      templateredirects.push(m.replace(/ /g, "_"));
    }
  }
  let text = t
    .replace(/(\n|\r)/gm, "") //remove linebreaks
    .replace(/<!--.*?-->/g, "") //remove comments
    .replace(/<ref([^>]+)\/>/g, "") //remove self-closing reference tags
    .replace(/<ref((?!<\/ref>).)*<\/ref>/g, "") //remove references
    .replace(/<ref([^>]+)>/g, "") //remove reference tags
    .replace(/\s\s+/g, " ") //remove multiple spaces
    .replace(/'{2,}/g, "") //remove some MediaWiki syntax
    .replace(
      new RegExp("{{\\s*(:?(" + templateprefixes.join("|") + "):\\s*)?(" + templateredirects.join("|") + ")\\s*", "gi"),
      "{{" + template
    );
  let txt = text.split("{{" + template + "|");
  if (txt.length === 1) {
    return null;
  }
  text = txt[1];
  let patt = new RegExp("{{((?!}}|{{).)*}}", "g");
  while (patt.test(text)) {
    text = text.replace(patt, ""); //remove all other templates
  }
  txt = text.split("}}");
  text = txt[0].replace(/\|((?!\]\]|\||\[\[).)*\]\]/g, "]]"); //simplify links
  let result = {};
  let unnamed = 0;
  for (let m of text.split("|")) {
    let sp = m.split("="); // param = value
    let param = sp[0].trim();
    if (sp.length > 1) {
      let value = sp.slice(1).join("=").trim();
      if (value === "") {
        if (param in result) {
          delete result[param];
        }
      } else {
        result[param] = value;
      }
    } else {
      unnamed++;
      if (param !== "") {
        result[unnamed] = param;
      } else if (unnamed in result) {
        delete result[unnamed];
      }
    }
  }
  return result;
}

function addStatement(statement, qid, token, editgroup) {
  let data = {
    action: "addstatement",
    entity: qid,
    statement: statement,
    summary: `([[:toollabs:editgroups/b/harvesttemplates/${editgroup}|details]])`,
    token: token,
  };
  return new Promise((resolve, reject) => {
    axios
      .get(`${own}/edit`, {
        params: data,
      })
      .then(response => {
        if ("success" in response.data) {
          resolve(true);
        } else {
          reject(response.data.error.info);
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}

function createStatement(value, title, revid, job) {
  let datavalue;
  switch (job.datatype) {
    case "wikibase-item":
      datavalue = `{"value": {"entity-type":"item", "id": "${value}"}, "type": "wikibase-entityid"}`;
      break;
    case "time":
      let precision = 9;
      if (value.substring(6, 8) !== "00") {
        precision = 10;
        if (value.substring(9, 11) !== "00") {
          precision = 11;
        }
      }
      datavalue = `{"value":{"time":"${value}","timezone":0,"before":0,"after":0,"precision":${precision},"calendarmodel":"http://www.wikidata.org/entity/${job.calendar}"},"type":"time"}`;
      break;
    case "quantity":
      let unit = job.unit !== "1" ? `http://www.wikidata.org/entity/${job.unit}` : job.unit;
      datavalue = `{"value":{"amount":"${value}","unit":"${unit}"},"type":"quantity"}`;
      break;
    default:
      datavalue = `{"value": "${value}","type": "string"}`;
      break;
  }
  let permalink = `${job.site}/w/index.php?title=${title}&oldid=${revid}`;
  let source = `[{"snaks":{"P143":[{"snaktype":"value","property":"P143","datavalue":{"value":{"entity-type":"item","id":"${job.wbeditionid}"},"type":"wikibase-entityid"},"datatype":"wikibase-item"}],"P4656":[{"snaktype":"value","property":"P4656","datavalue":{"value":"${permalink}","type":"string"},"datatype":"url"}]},"snaks-order":["P143","P4656"]}]`;
  return `{"mainsnak": {"snaktype": "value","property": "${job.p}","datavalue": ${datavalue}, "datatype": "${job.datatype}"}, "references": ${source}, "type": "statement"}`;
}

function checkAlreadyDone(qid, p, value) {
  let data = {
    entity: qid,
    property: p,
    value: value,
  };
  return new Promise((resolve, reject) => {
    axios
      .get(`${own}/exists`, {
        params: data,
      })
      .then(response => {
        if (response.data.exists === true) {
          reject("already exists");
        } else {
          resolve();
        }
      })
      .catch(error => {
        reject("failure while checking existance");
        console.log(error);
      });
  });
}

function checkConstraints(statement, qid, job) {
  let data = {
    entity: qid,
    statement: statement,
    constraints: job.constraints.join("|"),
  };
  return new Promise((resolve, reject) => {
    axios
      .get(`${own}/cc`, {
        params: data,
      })
      .then(response => {
        if ("violations" in response.data && response.data.violations === 0) {
          resolve(true);
        } else if ("problems" in response.data) {
          reject(`Constraint violation: ${response.data.problems[0]["text"]}`);
        } else {
          console.log(response.data);
          reject(`Error: ${response.data.error.info}`);
        }
      })
      .catch(error => {
        reject("failure while checking constraints");
        console.log(error);
      });
  });
}

function handleValue(val, qid, job) {
  let value;
  if (typeof val === "string") {
    value = job.addprefix + val + job.addsuffix;
    value = value.replace(new RegExp("^" + job.removeprefix), "");
    value = value.replace(new RegExp(job.removesuffix + "$"), "");
    value = value.replace(new RegExp(job.searchvalue, "g"), job.replacevalue);
    value = value.replace(/&nbsp;/g, " ");
  } else {
    value = val;
  }
  if (job.datatype === "wikibase-item") {
    let res = value.match(/^\[\[([^|\]]+)/);
    if (res !== null) {
      res = res[1];
    } else {
      if (job.wikisyntax) {
        res = value;
      } else {
        return new Promise((resolve, reject) => reject("no target page found"));
      }
    }
    if (res.indexOf("#") > -1) {
      return new Promise((resolve, reject) => reject("no target page found"));
    }
    return checkForInterwiki(res, qid, `${job.site}/w/api.php`);
  } else if (job.datatype === "url") {
    let res = value.match(/\[([^\s\]]+)(\s(.*))?\]/);
    if (res !== null) {
      value = res[1];
    }
  } else if (job.datatype === "commonsMedia") {
    let res = value.match(/\[\[([^|\]]+)/);
    if (res !== null) {
      value = res[1];
    }
    value = value.replace(new RegExp("^(" + job.fileprefixes.join("|") + "):\\s*", "i"), "");
    value = decodeURIComponent(value).replace(/_/g, " ");
  } else if (job.datatype === "time") {
    if (typeof value !== "string") {
      if (value[1] === undefined) {
        value[1] = "00";
      }
      if (value[2] === undefined) {
        value[2] = "00";
      }
      value = value[2] + " " + value[1] + " " + value[0];
    }

    value = parseDate(value, job.lang);
    if (value) {
      value = value.replace(/-(\d)-/, "-0$1-");
      value = value.replace(/-(\d)$/, "-0$1");
      if (job.rel === "geq" && parseInt(value.substring(0, 4)) < job.limityear) {
        return new Promise((resolve, reject) => reject(`${value} < ${job.limityear}`));
      } else if (job.rel === "l" && parseInt(value.substring(0, 4)) >= job.limityear) {
        return new Promise((resolve, reject) => reject(`${value} > ${job.limityear}`));
      }
      value = "+" + value + "T00:00:00Z"; //To be fixed
    } else {
      return new Promise((resolve, reject) => reject("could not find a date"));
    }
  } else if (job.datatype === "quantity") {
    value = value.replace(/(\d)(&nbsp;|\s|')(\d)/g, "$1$3"); //remove thousands separator
    value = toArabicNumerals(value);
    if (job.decimalmark === ".") {
      value = value.replace(/,/g, ""); //remove thousands separators
    } else if (job.decimalmark === ",") {
      value = value.replace(/\./g, ""); //remove thousands separators
      value = value.replace(",", "."); //replace decimal mark , by .
    }
    let patt = /^(\+|-)?[0-9.]+$/;
    if (!patt.test(value)) {
      return new Promise((resolve, reject) => reject("unclear value"));
    }
  }
  return new Promise((resolve, reject) => resolve(value));
}

function harvester(req, res) {
  let m = JSON.parse(req.body.data.candidate);
  let job = JSON.parse(req.body.data.job);
  if (!m.qid) {
    res.json({
      status: "error",
      rawvalue: "",
      parsedvalue: "",
      message: "missing item",
    });
    return 0;
  }
  let rawValue;
  let parsedValue;
  let revid;
  let statement;
  let data = {
    action: "query",
    prop: "revisions",
    pageids: m.pageid,
    rvprop: "ids|content",
    rvslots: "*",
    format: "json",
    origin: "*",
  };
  axios
    .get(`${job.site}/w/api.php`, {
      params: data,
    })
    .then(response => {
      if (!("revisions" in response.data.query.pages[m.pageid])) {
        return new Promise((resolve, reject) => reject("page not found"));
      }
      revid = response.data.query.pages[m.pageid].revisions[0].revid;
      let params = parseMediawikiTemplate(
        response.data.query.pages[m.pageid].revisions[0].slots.main["*"],
        job.templateprefixes,
        job.templateredirects,
        job.template
      );
      if (params === null) {
        return new Promise((resolve, reject) => reject("template not found"));
      }
      if (job.parameters.length !== 0) {
        for (let pp of job.parameters) {
          if (pp in params) {
            rawValue = params[pp];
            break;
          }
        }
      } else {
        //if multiple parameters need to be parsed, e.g. dates
        if (job.aparameter1 && job.aparameter1 in params) {
          rawValue = [params[job.aparameter1]];
          if (job.aparameter2 && job.aparameter2 in params) {
            rawValue.push(params[job.aparameter2]);
            if (job.aparameter3 && job.aparameter3 in params) {
              rawValue.push(params[job.aparameter3]);
            }
          }
        }
      }
      if (!rawValue) {
        return new Promise((resolve, reject) => reject("no value"));
      }
      return handleValue(rawValue, m.qid, job);
    })
    .then(value => {
      parsedValue = value;
      statement = createStatement(parsedValue, m.title.replace(/ /g, "_"), revid, job);
      return checkConstraints(statement, m.qid, job);
    })
    .then(() => {
      return checkAlreadyDone(m.qid, job.p, parsedValue);
    })
    .then(() => {
      return addStatement(statement, m.qid, req.body.data.token, job.editgroup);
    })
    .then(() => {
      res.json({
        status: "success",
        rawvalue: rawValue,
        parsedvalue: parsedValue,
        message: "success",
      });
    })
    .catch(error => {
      res.json({
        status: "error",
        rawvalue: rawValue ? rawValue : "",
        parsedvalue: parsedValue ? parsedValue : "",
        message: error,
      });
    });
}

export { harvester };
