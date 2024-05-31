function split(str, delimiter) {
  if (!delimiter) return str.length ? Array.from(str) : [""];
  const result = [];

  let left = 0;
  for (let i = delimiter.length; i <= str.length; i++) {
    if (str.slice(i - delimiter.length, i) === delimiter) {
      result.push(str.slice(left, i - delimiter.length));
      left = i;
    }
  }
  result.push(str.slice(left, str.length));
  return result;
}

console.log(split("1;2;", ";"));
console.log(split("foo ", " "));
console.log(split("hello world", " "));
console.log(split("", undefined));
