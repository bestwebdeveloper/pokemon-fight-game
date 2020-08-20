const firstRow = 'мама мыла раму';
const secondRow = 'собака друг человека';

function countLetter(letter, string) {
  let count = 0;

  for (let i = 0; i < string.length; i++) {
    if (string.charAt(i) === letter) {
      count++;
    }
  }

  return count;
}

function getRow(firstRow, secondRow) {
  const firstRowCountA = countLetter('а', firstRow);
  const secondRowCountA = countLetter('а', secondRow);

  if (firstRowCountA > secondRowCountA) {
    return firstRow;
  }

  return secondRow;
}

console.log(getRow(firstRow, secondRow)); // мама мыла раму