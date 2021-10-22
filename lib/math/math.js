const roundTo = require("round-to");

let padding = (value) => {
  if (isNaN(parseFloat(value))) {
    return "-";
  } else {
    //4.54524524　→ 4.55　みたいにする
    return roundTo(value, 2).toPrecision(3);
  }
};
let round = (value) => {
  return roundTo(value, 2);
};
module.exports = {
  padding,
  round,
};
