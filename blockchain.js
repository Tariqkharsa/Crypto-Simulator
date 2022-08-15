//Blockchain Implementation for Proof-of-Work
//Due to its complexity, some modules were installed via npm to implement this algorithm

const crypto = require('crypto'); //Crypto modulo that contains all cryptographic functions such as SHA256
const EC = require('elliptic').ec; //encryption using elliptic curve
const ec = new EC('secp256k1');
const debug = require('debug')('UHCOIN:blockchain');

//Class for Transaction object
class Transaction {

  //Contructor parameters for setting these variables: fromAddress, toAddress, amount
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
  }

  //returns the SHA256 of the transaction
  calculateHash() {
    return crypto.createHash('sha256').update(this.fromAddress + this.toAddress + this.amount + this.timestamp).digest('hex');
  }

  // Stores the signature of the transaction inside the transaction object using a private key
  signTransaction(signingKey) {
    // check if the private key matches with the public key
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('Incorrect signature');
    }
    
    // Calculate the hash of this transaction and sign it with the key
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    
    // Store it inside the transaction object
    this.signature = sig.toDER('hex');
  }

  //Checks if the signature is valid by using public key.
  isValid() {
    // If the transaction doesn't have a from address we assume it's a
    // mining reward and that it's valid. You could verify this in a
    // different way (special field for instance)
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature found');
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

class Block {
  //Contructor parameters for setting these variables: timestamp, transactions, previousHash and setting the value of the seed to 0
  constructor(timestamp, transactions, previousHash = '') {
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.seed = 0;
    this.hash = this.calculateHash();
  }

  //Returns the SHA256 of this block (by processing all the data stored inside the block)
  calculateHash() {
    return crypto.createHash('sha256').update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.seed).digest('hex');
  }

  //Mines the block by iterating thru diffrent values of the seend until the hash of the block starts with enough zeros (difficulty)
  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.seed++;
      this.hash = this.calculateHash();
    }

    debug(`Block mined: ${this.hash}`);
  }

  // Validates all the transactions inside this block (signature + hash)
  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }

    return true;
  }
}

class Blockchain {
  //Set the difficulty of the block and the mining reward
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 3;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  //Creates the first block
  createGenesisBlock() {
    return new Block(Date.parse('2022-01-01'), [], '0');
  }

  // returns the latest block in order to mine additional blocks
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  //Mining process and adds a transaction to send the mining reward tothe given address.
  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);

    debug('Block mined successfully!');
    this.chain.push(block);

    this.pendingTransactions = [];
  }

  // Adds the transaction to the transaction's list for it to be later added to the block
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    // Verify the transactiion
    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }
    
    if (transaction.amount <= 0) {
      throw new Error('Transaction amount should be higher than 0');
    }
    
    // Making sure that the amount sent is not greater than existing balance
    const walletBalance = this.getBalanceOfAddress(transaction.fromAddress);
    if (walletBalance < transaction.amount) {
      throw new Error('Not enough balance');
    }

    // Get all other pending transactions for the "from" wallet
    const pendingTxForWallet = this.pendingTransactions
      .filter(tx => tx.fromAddress === transaction.fromAddress);

    // If the wallet has more pending transactions, calculate the total amount
    // of spend coins so far. If this exceeds the balance, we refuse to add this
    // transaction.
    if (pendingTxForWallet.length > 0) {
      const totalPendingAmount = pendingTxForWallet
        .map(tx => tx.amount)
        .reduce((prev, curr) => prev + curr);

      const totalAmount = totalPendingAmount + transaction.amount;
      if (totalAmount > walletBalance) {
        throw new Error('Pending transactions for this wallet is higher than its balance.');
      }
    }
                                    

    this.pendingTransactions.push(transaction);
    debug('transaction added: %s', transaction);
  }

  // Returns the balance of a given wallet address (public key)
  getBalanceOfAddress(address) {
    let balance = 0;

    //if the address had transactions going from it in the ledger then balance will go negative
    //if the address had transactions going to it in the ledger then balance will go positive
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    debug('getBalanceOfAdrees: %s', balance);
    return balance;
  }

  // Returns a list of all transactions
  getAllTransactionsForWallet(address) {
    const txs = [];

    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address || tx.toAddress === address) {
          txs.push(tx);
        }
      }
    }

    debug('get transactions for wallet count: %s', txs.length);
    return txs;
  }

  // Check if the Blockchain is valid
  isChainValid() {
    // Check if the Genesis block hasn't been modified by comparing the output of createGenesisBlock with the first block on our chain
    const realGenesis = JSON.stringify(this.createGenesisBlock());

    if (realGenesis !== JSON.stringify(this.chain[0])) {
      return false;
    }

    // Check the remaining blocks on the Blockchain to see if their hashes and signatures are correct
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (previousBlock.hash !== currentBlock.previousHash) {
        return false;
      }

      if (!currentBlock.hasValidTransactions()) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
    }

    return true;
  }
}

//export the Blockchain and Transaction class to Main.js
module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
