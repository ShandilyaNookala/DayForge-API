function insertInArray(array, index, element) {
  if (index >= array.length) {
    array.push(element);
  } else {
    array.splice(index + 1, 0, element);
  }
  return array;
}

module.exports = insertInArray;
