const { Blockchain, Transaction } = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Your private key goes here (in this case mine)
const tariqKey = ec.keyFromPrivate('7c4c45907dec40c91bab3480c39032e90049f1a44f3e18c3e07c23e3273995cf');

// From that we can calculate your public key (which doubles as tariq wallet address)
const tariqWalletAddress = tariqKey.getPublic('hex');

// Your private key goes here (in this case the professor, Dr. Itani)
const itaniKey = ec.keyFromPrivate('790272cc7e24a65b08e8d0fa6e38ad9f900dde6086af6c6c272ae3748e0bffa4');

// From that we can calculate your public key (which doubles as Itani wallet address)
const itaniWalletAddress = itaniKey.getPublic('hex');

// Create new instance of Blockchain class
const UHCOIN = new Blockchain();

// Tariq mines first block and recieve 100 UHCOIN
UHCOIN.minePendingTransactions(tariqWalletAddress);


//Tariq's balance: 100 UHCOIN


// Created a transaction & signed it with Tariq key to send 50 UHCOIN to Dr. Itani 
const tx1 = new Transaction(tariqWalletAddress, itaniWalletAddress, 50);
tx1.signTransaction(tariqKey);
UHCOIN.addTransaction(tx1);


//Tariq's balance: 50 UHCOIN and Dr. Itani's balance: 50 UHCOIN


// Dr.Itani mines the block and recive 100 UHCOIN
UHCOIN.minePendingTransactions(itaniWalletAddress);


//Tariq's balance: 50 UHCOIN and Dr. Itani's balance: 150 UHCOIN


// Created a second transaction & signed it with Dr. Itani's key to send 20 UHCOIN to Tariq
const tx2 = new Transaction(itaniWalletAddress, tariqWalletAddress, 20);
tx2.signTransaction(itaniKey);
UHCOIN.addTransaction(tx2);


//Tariq's balance: 70 UHCOIN and Dr. Itani's balance: 130 UHCOIN


// Tariq mines the block and recieves 100 UHCOIN
UHCOIN.minePendingTransactions(tariqWalletAddress);


//Tariq's balance: 170 UHCOIN and Dr. Itani's balance: 130 UHCOIN


//Check the balance for our wallets
console.log();
console.log(`Balance of Tariq is:        ${UHCOIN.getBalanceOfAddress(tariqWalletAddress)} UHCOIN`);
console.log(`Balance of Dr. Itani is:    ${UHCOIN.getBalanceOfAddress(itaniWalletAddress)} UHCOIN`);

// Check if the Blockchain is valid
console.log();
console.log('Blockchain valid?', UHCOIN.isChainValid() ? 'Yes' : 'No');

//Print the Blockchain
console.log();
console.log(JSON.stringify(UHCOIN.chain,null,4));
