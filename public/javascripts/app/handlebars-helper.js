Handlebars.registerHelper("select", function (value, options) {
  var $el = $("<select />").html(options.fn(this));
  $el.find('[value="' + value + '"]').attr({ selected: "selected" });
  return $el.html();
});

Handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
  lvalue = parseFloat(lvalue);
  rvalue = parseFloat(rvalue);

  return {
    "+": lvalue + rvalue,
    "-": lvalue - rvalue,
    "*": lvalue * rvalue,
    "/": lvalue / rvalue,
    "%": lvalue % rvalue,
  }[operator];
});

Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
  switch (operator) {
    case "==":
      return v1 == v2 ? options.fn(this) : options.inverse(this);
    case "===":
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    case "!=":
      return v1 != v2 ? options.fn(this) : options.inverse(this);
    case "!==":
      return v1 !== v2 ? options.fn(this) : options.inverse(this);
    case "<":
      return v1 < v2 ? options.fn(this) : options.inverse(this);
    case "<=":
      return v1 <= v2 ? options.fn(this) : options.inverse(this);
    case ">":
      return v1 > v2 ? options.fn(this) : options.inverse(this);
    case ">=":
      return v1 >= v2 ? options.fn(this) : options.inverse(this);
    case "&&":
      return v1 && v2 ? options.fn(this) : options.inverse(this);
    case "||":
      return v1 || v2 ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
});

Handlebars.registerHelper("fixFloat", function (distance, f) {
  if (typeof distance == "number" && !Number.isInteger(distance)) {
    f = f || 2;
    return distance.toFixed(2);
  }

  return distance;
});

Handlebars.registerHelper("findByIndex", function (list, idx) {
  return list[idx];
});

Handlebars.registerHelper("isEmpty", function (value, options) {
  if (Object.keys(value).length > 0) {
    return options.fn(this);
  }
  return options.inverse(this);
});
